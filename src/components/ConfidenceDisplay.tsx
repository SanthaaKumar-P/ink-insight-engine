import { motion } from "framer-motion";

interface ConfidenceDisplayProps {
  predictions: number[];
  predictedDigit: number | null;
}

const ConfidenceDisplay = ({ predictions, predictedDigit }: ConfidenceDisplayProps) => {
  const maxConf = Math.max(...predictions);
  const isLowConfidence = maxConf < 0.6;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass rounded-xl p-5 w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
          Confidence Scores
        </h3>
        {isLowConfidence && predictions.some((p) => p > 0) && (
          <span className="text-xs font-mono px-2 py-1 rounded-full bg-destructive/20 text-destructive border border-destructive/30 animate-pulse-glow">
            ⚠ Low Confidence
          </span>
        )}
      </div>

      {predictedDigit !== null && (
        <div className="text-center mb-5">
          <motion.div
            key={predictedDigit}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary text-primary-foreground text-4xl font-bold glow-primary"
          >
            {predictedDigit}
          </motion.div>
          <p className="text-xs text-muted-foreground font-mono mt-2">
            {(maxConf * 100).toFixed(1)}% confidence
          </p>
        </div>
      )}

      <div className="space-y-2">
        {predictions.map((conf, digit) => (
          <div key={digit} className="flex items-center gap-3">
            <span
              className={`w-5 text-right font-mono text-sm ${
                digit === predictedDigit
                  ? "text-primary font-bold"
                  : "text-muted-foreground"
              }`}
            >
              {digit}
            </span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${conf * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  digit === predictedDigit
                    ? "gradient-primary"
                    : conf > 0.1
                    ? "bg-muted-foreground/40"
                    : "bg-muted-foreground/20"
                }`}
              />
            </div>
            <span className="w-12 text-right font-mono text-xs text-muted-foreground">
              {(conf * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ConfidenceDisplay;
