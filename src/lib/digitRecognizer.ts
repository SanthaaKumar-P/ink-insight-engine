/**
 * Structural feature-based digit recognizer.
 * Analyzes pixel density in grid regions, stroke topology,
 * aspect ratio, symmetry, and connectivity to classify 0-9.
 */

function downscale(imageData: ImageData, targetSize = 28): number[][] {
  const { width, height, data } = imageData;
  const grid: number[][] = Array.from({ length: targetSize }, () => Array(targetSize).fill(0));
  const cellW = width / targetSize;
  const cellH = height / targetSize;

  for (let gy = 0; gy < targetSize; gy++) {
    for (let gx = 0; gx < targetSize; gx++) {
      let sum = 0;
      let count = 0;
      const startX = Math.floor(gx * cellW);
      const endX = Math.floor((gx + 1) * cellW);
      const startY = Math.floor(gy * cellH);
      const endY = Math.floor((gy + 1) * cellH);
      for (let py = startY; py < endY; py++) {
        for (let px = startX; px < endX; px++) {
          const idx = (py * width + px) * 4;
          sum += data[idx]; // red channel (grayscale)
          count++;
        }
      }
      grid[gy][gx] = count > 0 ? sum / count / 255 : 0;
    }
  }
  return grid;
}

function getBoundingBox(grid: number[][], threshold = 0.15) {
  const size = grid.length;
  let minR = size, maxR = 0, minC = size, maxC = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] > threshold) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }
  return { minR, maxR, minC, maxC };
}

function regionDensity(grid: number[][], r1: number, r2: number, c1: number, c2: number): number {
  let sum = 0, count = 0;
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
        sum += grid[r][c];
        count++;
      }
    }
  }
  return count > 0 ? sum / count : 0;
}

function horizontalCrossings(grid: number[][], row: number, threshold = 0.15): number {
  let crossings = 0;
  let inStroke = false;
  for (let c = 0; c < grid[0].length; c++) {
    const on = grid[row][c] > threshold;
    if (on && !inStroke) crossings++;
    inStroke = on;
  }
  return crossings;
}

function verticalCrossings(grid: number[][], col: number, threshold = 0.15): number {
  let crossings = 0;
  let inStroke = false;
  for (let r = 0; r < grid.length; r++) {
    const on = grid[r][col] > threshold;
    if (on && !inStroke) crossings++;
    inStroke = on;
  }
  return crossings;
}

function countEnclosedRegions(grid: number[][], threshold = 0.15): number {
  const size = grid.length;
  const binary = grid.map(row => row.map(v => (v > threshold ? 1 : 0)));
  const visited = Array.from({ length: size }, () => Array(size).fill(false));

  function floodFill(r: number, c: number) {
    const stack = [[r, c]];
    let touchesBorder = false;
    let cellCount = 0;
    while (stack.length > 0) {
      const [cr, cc] = stack.pop()!;
      if (cr < 0 || cr >= size || cc < 0 || cc >= size) { touchesBorder = true; continue; }
      if (visited[cr][cc] || binary[cr][cc] === 1) continue;
      visited[cr][cc] = true;
      cellCount++;
      stack.push([cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]);
    }
    return { touchesBorder, cellCount };
  }

  let enclosed = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!visited[r][c] && binary[r][c] === 0) {
        const { touchesBorder, cellCount } = floodFill(r, c);
        if (!touchesBorder && cellCount > 3) enclosed++;
      }
    }
  }
  return enclosed;
}

function horizontalSymmetry(grid: number[][], bb: ReturnType<typeof getBoundingBox>): number {
  const { minR, maxR, minC, maxC } = bb;
  const midC = (minC + maxC) / 2;
  let match = 0, total = 0;
  for (let r = minR; r <= maxR; r++) {
    for (let dc = 0; dc <= (maxC - minC) / 2; dc++) {
      const left = Math.round(midC - dc);
      const right = Math.round(midC + dc);
      if (left >= 0 && right < grid[0].length) {
        const diff = Math.abs(grid[r][left] - grid[r][right]);
        match += 1 - diff;
        total++;
      }
    }
  }
  return total > 0 ? match / total : 0;
}

function verticalSymmetry(grid: number[][], bb: ReturnType<typeof getBoundingBox>): number {
  const { minR, maxR, minC, maxC } = bb;
  const midR = (minR + maxR) / 2;
  let match = 0, total = 0;
  for (let c = minC; c <= maxC; c++) {
    for (let dr = 0; dr <= (maxR - minR) / 2; dr++) {
      const top = Math.round(midR - dr);
      const bot = Math.round(midR + dr);
      if (top >= 0 && bot < grid.length) {
        const diff = Math.abs(grid[top][c] - grid[bot][c]);
        match += 1 - diff;
        total++;
      }
    }
  }
  return total > 0 ? match / total : 0;
}

export function recognizeDigit(imageData: ImageData): number[] {
  const grid = downscale(imageData, 28);
  const bb = getBoundingBox(grid);
  const { minR, maxR, minC, maxC } = bb;

  if (maxR <= minR || maxC <= minC) return Array(10).fill(0.1);

  const h = maxR - minR + 1;
  const w = maxC - minC + 1;
  const aspectRatio = h / w;

  const midR = Math.round((minR + maxR) / 2);
  const midC = Math.round((minC + maxC) / 2);
  const q1R = Math.round(minR + h * 0.25);
  const q3R = Math.round(minR + h * 0.75);

  // Quadrant densities
  const topLeft = regionDensity(grid, minR, midR, minC, midC);
  const topRight = regionDensity(grid, minR, midR, midC, maxC);
  const botLeft = regionDensity(grid, midR, maxR, minC, midC);
  const botRight = regionDensity(grid, midR, maxR, midC, maxC);
  const topHalf = regionDensity(grid, minR, midR, minC, maxC);
  const botHalf = regionDensity(grid, midR, maxR, minC, maxC);
  const center = regionDensity(grid, q1R, q3R, Math.round(minC + w * 0.25), Math.round(minC + w * 0.75));
  const leftHalf = regionDensity(grid, minR, maxR, minC, midC);
  const rightHalf = regionDensity(grid, minR, maxR, midC, maxC);

  // Center horizontal strip density
  const centerStrip = regionDensity(grid, midR - 1, midR + 1, minC, maxC);

  // Crossings
  const hCrossMid = horizontalCrossings(grid, midR);
  const hCrossQ1 = horizontalCrossings(grid, q1R);
  const hCrossQ3 = horizontalCrossings(grid, q3R);
  const vCrossMid = verticalCrossings(grid, midC);

  // Topology
  const enclosed = countEnclosedRegions(grid);

  // Symmetry
  const hSym = horizontalSymmetry(grid, bb);
  const vSym = verticalSymmetry(grid, bb);

  // Top and bottom edge density
  const topEdge = regionDensity(grid, minR, minR + 2, minC, maxC);
  const botEdge = regionDensity(grid, maxR - 2, maxR, minC, maxC);
  const leftEdge = regionDensity(grid, minR, maxR, minC, minC + 2);
  const rightEdge = regionDensity(grid, minR, maxR, maxC - 2, maxC);

  // Center hole (for 0, 4, 6, 8, 9)
  const centerHole = regionDensity(grid, Math.round(minR + h * 0.3), Math.round(minR + h * 0.7),
    Math.round(minC + w * 0.3), Math.round(minC + w * 0.7));

  // Scores
  const scores = Array(10).fill(0);

  // === 0: Enclosed loop, horizontally symmetric, no center fill ===
  scores[0] += enclosed >= 1 ? 3 : -2;
  scores[0] += hSym > 0.7 ? 1.5 : 0;
  scores[0] += centerHole < 0.25 ? 2 : -1;
  scores[0] += hCrossMid === 2 ? 2 : -1;
  scores[0] += aspectRatio > 1.0 ? 1 : 0;
  scores[0] += topEdge > 0.15 ? 1 : 0;
  scores[0] += botEdge > 0.15 ? 1 : 0;

  // === 1: Tall, thin, one vertical stroke ===
  scores[1] += aspectRatio > 2.0 ? 3 : aspectRatio > 1.5 ? 1.5 : -1;
  scores[1] += w < 10 ? 3 : w < 14 ? 1 : -2;
  scores[1] += hCrossMid === 1 ? 2 : -1;
  scores[1] += hCrossQ1 === 1 ? 1 : 0;
  scores[1] += hCrossQ3 === 1 ? 1 : 0;
  scores[1] += enclosed === 0 ? 1 : -2;

  // === 2: Top curve, diagonal, bottom horizontal ===
  scores[2] += enclosed === 0 ? 1 : -2;
  scores[2] += botEdge > 0.3 ? 2 : -0.5;
  scores[2] += topRight > topLeft ? 1.5 : -0.5;
  scores[2] += botLeft > botRight * 0.5 ? 1 : 0;
  scores[2] += hCrossQ1 <= 2 ? 0.5 : 0;
  scores[2] += hCrossQ3 >= 1 ? 0.5 : 0;
  scores[2] += topHalf > 0.1 && botHalf > 0.1 ? 1 : 0;
  scores[2] += centerStrip > 0.1 ? 0.5 : 0;

  // === 3: Two bumps on right, open left ===
  scores[3] += enclosed === 0 ? 1 : -1;
  scores[3] += rightHalf > leftHalf * 1.2 ? 2 : -1;
  scores[3] += topEdge > 0.15 ? 1 : 0;
  scores[3] += botEdge > 0.15 ? 1 : 0;
  scores[3] += centerStrip > 0.15 ? 1.5 : -0.5;
  scores[3] += hCrossMid >= 1 ? 0.5 : 0;
  scores[3] += rightEdge > 0.2 ? 1 : 0;

  // === 4: Vertical stroke + horizontal bar, open top ===
  scores[4] += enclosed <= 1 ? 1 : -1;
  scores[4] += hCrossMid >= 2 ? 2 : -1;
  scores[4] += vCrossMid >= 2 ? 1.5 : 0;
  scores[4] += centerStrip > 0.2 ? 2 : -0.5;
  scores[4] += topHalf > 0.1 ? 0.5 : 0;
  scores[4] += rightHalf > leftHalf ? 1 : 0;
  scores[4] += aspectRatio > 1.2 ? 1 : 0;
  // 4 typically has more ink in top-right and center-right
  scores[4] += topRight > 0.1 ? 0.5 : 0;

  // === 5: Top horizontal, middle horizontal, bottom curve ===
  scores[5] += enclosed === 0 ? 1 : -1;
  scores[5] += topEdge > 0.25 ? 2 : -0.5;
  scores[5] += topLeft > topRight ? 1.5 : -1;
  scores[5] += botRight > botLeft ? 1.5 : -0.5;
  scores[5] += centerStrip > 0.15 ? 1 : 0;
  scores[5] += leftEdge > 0.15 ? 0.5 : 0;

  // === 6: Bottom loop, top curve left ===
  scores[6] += enclosed >= 1 ? 2.5 : -2;
  scores[6] += botHalf > topHalf * 1.1 ? 2 : -1;
  scores[6] += botLeft > 0.15 ? 1 : 0;
  scores[6] += botRight > 0.15 ? 1 : 0;
  scores[6] += topLeft > topRight ? 1 : -0.5;
  scores[6] += hCrossQ3 === 2 ? 1 : 0;

  // === 7: Top horizontal, diagonal down-right ===
  scores[7] += enclosed === 0 ? 1 : -2;
  scores[7] += topEdge > 0.3 ? 2.5 : -1;
  scores[7] += botEdge < 0.15 ? 1 : -0.5;
  scores[7] += topHalf > botHalf * 1.3 ? 2 : -1;
  scores[7] += hCrossQ3 === 1 ? 1 : 0;
  scores[7] += hCrossMid === 1 ? 1 : 0;
  scores[7] += leftEdge < rightEdge ? 0.5 : 0;
  scores[7] += aspectRatio > 1.3 ? 0.5 : 0;

  // === 8: Two enclosed loops, symmetric ===
  scores[8] += enclosed >= 2 ? 4 : enclosed >= 1 ? 0 : -3;
  scores[8] += hSym > 0.65 ? 2 : -0.5;
  scores[8] += vSym > 0.5 ? 1.5 : 0;
  scores[8] += hCrossMid === 2 ? 1.5 : -0.5;
  scores[8] += centerStrip > 0.2 ? 1 : 0;
  scores[8] += topEdge > 0.1 && botEdge > 0.1 ? 1 : 0;

  // === 9: Top loop, bottom vertical ===
  scores[9] += enclosed >= 1 ? 2.5 : -2;
  scores[9] += topHalf > botHalf * 1.1 ? 2 : -1;
  scores[9] += topLeft > 0.1 ? 1 : 0;
  scores[9] += topRight > 0.1 ? 1 : 0;
  scores[9] += rightHalf > leftHalf ? 1 : -0.5;
  scores[9] += hCrossQ1 === 2 ? 1 : 0;
  scores[9] += botRight > botLeft ? 0.5 : 0;

  // Convert scores to probabilities via softmax
  const maxScore = Math.max(...scores);
  const expScores = scores.map(s => Math.exp(s - maxScore));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  return expScores.map(e => e / sumExp);
}
