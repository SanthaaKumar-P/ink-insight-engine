import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

const GradCAMViz = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [selectedDigit, setSelectedDigit] = useState(3);

  useEffect(() => {
    const size = 140;

    // Draw digit
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
    ctx.font = "bold 100px Space Grotesk";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(selectedDigit), size / 2, size / 2 + 5);

    // Generate heatmap
    const heatmap = heatmapRef.current!;
    const hctx = heatmap.getContext("2d")!;
    hctx.fillStyle = "#000";
    hctx.fillRect(0, 0, size, size);

    // Create gradient heatmap centered on digit strokes
    const srcData = ctx.getImageData(0, 0, size, size);
    const heatData = hctx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const brightness = srcData.data[idx];
        // Spread influence
        let influence = 0;
        for (let dy = -15; dy <= 15; dy += 3) {
          for (let dx = -15; dx <= 15; dx += 3) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
              const nIdx = (ny * size + nx) * 4;
              const dist = Math.sqrt(dx * dx + dy * dy);
              influence += srcData.data[nIdx] * Math.exp(-dist / 10);
            }
          }
        }
        const norm = Math.min(influence / 3000, 1);

        // Colormap: blue -> cyan -> green -> yellow -> red
        let r = 0, g = 0, b = 0;
        if (norm < 0.25) {
          b = 255;
          g = Math.round(norm * 4 * 255);
        } else if (norm < 0.5) {
          g = 255;
          b = Math.round((1 - (norm - 0.25) * 4) * 255);
        } else if (norm < 0.75) {
          g = 255;
          r = Math.round((norm - 0.5) * 4 * 255);
        } else {
          r = 255;
          g = Math.round((1 - (norm - 0.75) * 4) * 255);
        }

        heatData.data[idx] = r;
        heatData.data[idx + 1] = g;
        heatData.data[idx + 2] = b;
        heatData.data[idx + 3] = Math.round(norm * 200 + 55);
      }
    }
    hctx.putImageData(heatData, 0, 0);

    // Overlay
    const overlay = overlayRef.current!;
    const octx = overlay.getContext("2d")!;
    octx.drawImage(canvas, 0, 0);
    octx.globalAlpha = 0.6;
    octx.drawImage(heatmap, 0, 0);
    octx.globalAlpha = 1;
  }, [selectedDigit]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Explainable AI — Grad-CAM Visualization
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Heatmaps show which regions the CNN focuses on when making predictions.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from({ length: 10 }, (_, i) => (
            <button
              key={i}
              onClick={() => setSelectedDigit(i)}
              className={`w-10 h-10 rounded-lg font-mono font-bold text-sm transition-all ${
                selectedDigit === i
                  ? "gradient-primary text-primary-foreground glow-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {i}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { ref: canvasRef, label: "Input Image" },
            { ref: heatmapRef, label: "Activation Heatmap" },
            { ref: overlayRef, label: "Grad-CAM Overlay" },
          ].map(({ ref, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <canvas
                ref={ref}
                width={140}
                height={140}
                className="rounded-lg border border-border w-full max-w-[200px] aspect-square"
              />
              <p className="text-xs font-mono text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-3">
          How Grad-CAM Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { step: "01", title: "Forward Pass", desc: "Input image passes through CNN layers" },
            { step: "02", title: "Gradient Calc", desc: "Compute gradients of target class" },
            { step: "03", title: "Weight Maps", desc: "Global average pooling of gradients" },
            { step: "04", title: "Heatmap", desc: "Weighted combination → ReLU → overlay" },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <span className="text-primary font-mono font-bold text-lg">{s.step}</span>
              <p className="text-sm font-semibold mt-1">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default GradCAMViz;
