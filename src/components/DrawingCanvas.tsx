import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Eraser, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DrawingCanvasProps {
  onPredict: (imageData: ImageData) => void;
  size?: number;
}

const DrawingCanvas = ({ onPredict, size = 280 }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
  }, [size]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#fff";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDraw = () => {
    setIsDrawing(false);
    if (hasContent) {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, size, size);
        onPredict(imageData);
      }
    }
  };

  const clearCanvas = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
    setHasContent(false);
  }, [size]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="relative group">
        <div className="absolute -inset-1 rounded-xl gradient-primary opacity-30 blur-md group-hover:opacity-50 transition-opacity" />
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="relative rounded-xl cursor-crosshair touch-none border border-primary/30"
          style={{ width: size, height: size }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground text-sm font-mono animate-pulse-glow">
              Draw a digit here
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          className="border-primary/30 hover:border-primary hover:glow-primary"
        >
          <RotateCcw className="w-4 h-4 mr-1" /> Clear
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (hasContent) {
              const ctx = canvasRef.current?.getContext("2d");
              if (ctx) onPredict(ctx.getImageData(0, 0, size, size));
            }
          }}
          className="border-secondary/30 hover:border-secondary hover:glow-secondary"
        >
          <Sparkles className="w-4 h-4 mr-1" /> Predict
        </Button>
      </div>
    </motion.div>
  );
};

export default DrawingCanvas;
