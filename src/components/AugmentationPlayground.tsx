import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";

const AugmentationPlayground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const augCanvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [noise, setNoise] = useState(0);
  const [blur, setBlur] = useState(0);
  const [scale, setScale] = useState(100);
  const [prediction, setPrediction] = useState<{ digit: number; conf: number } | null>(null);

  // Draw a sample digit on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 140, 140);
    ctx.font = "bold 100px Space Grotesk";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("7", 70, 75);
  }, []);

  // Apply augmentations
  useEffect(() => {
    const src = canvasRef.current;
    const dst = augCanvasRef.current;
    if (!src || !dst) return;
    const ctx = dst.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 140, 140);

    ctx.save();
    ctx.filter = blur > 0 ? `blur(${blur}px)` : "none";
    ctx.translate(70, 70);
    ctx.rotate((rotation * Math.PI) / 180);
    const s = scale / 100;
    ctx.scale(s, s);
    ctx.drawImage(src, -70, -70);
    ctx.restore();

    if (noise > 0) {
      const imgData = ctx.getImageData(0, 0, 140, 140);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const n = (Math.random() - 0.5) * noise * 5;
        imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + n));
        imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + n));
        imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + n));
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Simulated prediction change
    const degradation = (Math.abs(rotation) / 180) * 0.3 + (noise / 100) * 0.3 + (blur / 10) * 0.2 + (Math.abs(scale - 100) / 100) * 0.2;
    const conf = Math.max(0.1, 0.97 - degradation);
    setPrediction({ digit: 7, conf });
  }, [rotation, noise, blur, scale]);

  const sliders = [
    { label: "Rotation", value: rotation, set: setRotation, min: -180, max: 180, unit: "°" },
    { label: "Noise", value: noise, set: setNoise, min: 0, max: 100, unit: "%" },
    { label: "Blur", value: blur, set: setBlur, min: 0, max: 10, unit: "px" },
    { label: "Scale", value: scale, set: setScale, min: 50, max: 150, unit: "%" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-xl p-5 flex flex-col items-center gap-3">
          <p className="text-xs font-mono uppercase text-muted-foreground">Original</p>
          <canvas ref={canvasRef} width={140} height={140} className="rounded-lg border border-border" />
        </div>

        <div className="glass rounded-xl p-5 flex flex-col items-center gap-3">
          <p className="text-xs font-mono uppercase text-muted-foreground">Augmented</p>
          <div className="relative">
            <canvas ref={augCanvasRef} width={140} height={140} className="rounded-lg border border-primary/30" />
            <div className="absolute inset-0 rounded-lg border border-primary/20 animate-pulse-glow pointer-events-none" />
          </div>
        </div>

        <div className="glass rounded-xl p-5 flex flex-col items-center justify-center gap-2">
          <p className="text-xs font-mono uppercase text-muted-foreground">Prediction</p>
          {prediction && (
            <>
              <div className={`text-5xl font-bold ${prediction.conf > 0.7 ? "text-primary" : prediction.conf > 0.4 ? "text-secondary" : "text-destructive"}`}>
                {prediction.digit}
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  animate={{ width: `${prediction.conf * 100}%` }}
                  className={`h-full rounded-full ${prediction.conf > 0.7 ? "gradient-primary" : prediction.conf > 0.4 ? "gradient-secondary" : "bg-destructive"}`}
                />
              </div>
              <p className="text-xs font-mono text-muted-foreground">{(prediction.conf * 100).toFixed(1)}%</p>
            </>
          )}
        </div>
      </div>

      <div className="glass rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {sliders.map((s) => (
          <div key={s.label}>
            <div className="flex justify-between mb-2">
              <span className="text-xs font-mono uppercase text-muted-foreground">{s.label}</span>
              <span className="text-xs font-mono text-primary">{s.value}{s.unit}</span>
            </div>
            <Slider
              value={[s.value]}
              onValueChange={(v) => s.set(v[0])}
              min={s.min}
              max={s.max}
              step={1}
              className="cursor-pointer"
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AugmentationPlayground;
