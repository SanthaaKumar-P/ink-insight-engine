import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

const confusionData = [
  [980, 1, 2, 1, 0, 3, 5, 1, 4, 3],
  [0, 1130, 2, 1, 0, 1, 2, 1, 3, 0],
  [5, 3, 1015, 3, 2, 0, 2, 5, 4, 1],
  [1, 0, 5, 995, 0, 8, 0, 4, 6, 1],
  [1, 1, 0, 0, 968, 0, 4, 1, 2, 7],
  [2, 0, 0, 8, 1, 875, 5, 1, 4, 2],
  [4, 2, 1, 0, 3, 3, 945, 0, 3, 0],
  [1, 4, 8, 2, 1, 0, 0, 1005, 2, 5],
  [3, 1, 3, 5, 3, 4, 2, 2, 950, 3],
  [3, 3, 0, 4, 8, 4, 1, 5, 4, 977],
];

const commonErrors = [
  { true_label: 3, predicted: 5, count: 8, reason: "Similar curves" },
  { true_label: 7, predicted: 1, count: 6, reason: "Stroke similarity" },
  { true_label: 4, predicted: 9, count: 7, reason: "Top loop confusion" },
  { true_label: 8, predicted: 3, count: 5, reason: "Open vs closed loops" },
  { true_label: 5, predicted: 6, count: 5, reason: "Bottom curve overlap" },
  { true_label: 9, predicted: 4, count: 8, reason: "Upper stroke ambiguity" },
];

const ErrorAnalysis = () => {
  const maxVal = Math.max(...confusionData.flat());

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">
          Confusion Matrix
        </h3>
        <div className="overflow-x-auto">
          <div className="inline-grid gap-[2px] min-w-[400px]" style={{ gridTemplateColumns: `40px repeat(10, 1fr)` }}>
            <div />
            {Array.from({ length: 10 }, (_, i) => (
              <div key={`h-${i}`} className="text-center text-xs font-mono text-muted-foreground py-1">
                {i}
              </div>
            ))}
            {confusionData.map((row, i) => (
              <>
                <div key={`l-${i}`} className="text-xs font-mono text-muted-foreground flex items-center justify-center">
                  {i}
                </div>
                {row.map((val, j) => {
                  const intensity = val / maxVal;
                  const isDiag = i === j;
                  return (
                    <motion.div
                      key={`${i}-${j}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (i * 10 + j) * 0.005 }}
                      className="aspect-square flex items-center justify-center rounded text-[10px] font-mono"
                      style={{
                        backgroundColor: isDiag
                          ? `hsl(185 90% 50% / ${intensity * 0.8})`
                          : val > 5
                          ? `hsl(0 75% 55% / ${Math.min(intensity * 3, 0.8)})`
                          : `hsl(220 15% 15% / ${0.3 + intensity * 0.3})`,
                        color: intensity > 0.3 ? "hsl(210 20% 92%)" : "hsl(215 15% 55%)",
                      }}
                    >
                      {val > 0 ? val : ""}
                    </motion.div>
                  );
                })}
              </>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-mono text-muted-foreground">
            <span>← Predicted Label</span>
            <span>True Label ↑</span>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">
          Top Misclassification Patterns
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {commonErrors.map((err, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-primary">{err.true_label}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-2xl font-bold text-destructive">{err.predicted}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-muted-foreground">{err.reason}</p>
                <p className="text-[10px] font-mono text-muted-foreground/60">{err.count} occurrences</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ErrorAnalysis;
