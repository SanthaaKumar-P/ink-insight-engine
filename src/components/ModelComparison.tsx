import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from "recharts";

const accuracyData = [
  { model: "CNN", accuracy: 99.2, params: 1.2, speed: 15 },
  { model: "ANN", accuracy: 97.8, params: 0.8, speed: 8 },
  { model: "SVM", accuracy: 94.5, params: 0.1, speed: 45 },
  { model: "KNN", accuracy: 96.9, params: 0, speed: 120 },
];

const radarData = [
  { metric: "Accuracy", CNN: 99, ANN: 97, SVM: 94 },
  { metric: "Speed", CNN: 85, ANN: 92, SVM: 60 },
  { metric: "Robustness", CNN: 95, ANN: 80, SVM: 70 },
  { metric: "Scalability", CNN: 90, ANN: 85, SVM: 50 },
  { metric: "Memory", CNN: 60, ANN: 75, SVM: 95 },
];

const ModelComparison = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">
            Accuracy Comparison
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={accuracyData}>
              <XAxis dataKey="model" stroke="hsl(215 15% 55%)" fontSize={12} />
              <YAxis domain={[90, 100]} stroke="hsl(215 15% 55%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(220 18% 10%)",
                  border: "1px solid hsl(220 15% 18%)",
                  borderRadius: "8px",
                  fontFamily: "JetBrains Mono",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="accuracy" fill="hsl(185 90% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">
            Multi-Metric Radar
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(220 15% 18%)" />
              <PolarAngleAxis dataKey="metric" stroke="hsl(215 15% 55%)" fontSize={11} />
              <Radar name="CNN" dataKey="CNN" stroke="hsl(185 90% 50%)" fill="hsl(185 90% 50%)" fillOpacity={0.2} />
              <Radar name="ANN" dataKey="ANN" stroke="hsl(35 95% 55%)" fill="hsl(35 95% 55%)" fillOpacity={0.15} />
              <Radar name="SVM" dataKey="SVM" stroke="hsl(270 80% 65%)" fill="hsl(270 80% 65%)" fillOpacity={0.1} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {accuracyData.map((m, i) => (
          <motion.div
            key={m.model}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-4 text-center"
          >
            <p className="font-mono text-xs text-muted-foreground uppercase">{m.model}</p>
            <p className="text-2xl font-bold text-primary mt-1">{m.accuracy}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {m.params}M params · {m.speed}ms
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ModelComparison;
