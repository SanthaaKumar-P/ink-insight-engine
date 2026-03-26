import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, Target, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import DrawingCanvas from "./DrawingCanvas";

const GameMode = () => {
  const [targetDigit, setTargetDigit] = useState(() => Math.floor(Math.random() * 10));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState<{ correct: boolean; digit: number } | null>(null);
  const [history, setHistory] = useState<{ target: number; predicted: number; correct: boolean }[]>([]);

  const handlePredict = useCallback(
    (imageData: ImageData) => {
      // Simulate prediction - in production would use TF.js model
      const pixels = imageData.data;
      let sum = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        sum += pixels[i];
      }
      // Use pixel density to create a pseudo-random but consistent prediction
      const predicted = Math.abs(Math.round(sum / 10000)) % 10;
      // 60% chance of being correct for gamification fun
      const isCorrect = Math.random() > 0.4 ? true : predicted === targetDigit;
      const finalPredicted = isCorrect ? targetDigit : predicted;

      setFeedback({ correct: isCorrect, digit: finalPredicted });
      setHistory((h) => [...h, { target: targetDigit, predicted: finalPredicted, correct: isCorrect }]);

      if (isCorrect) {
        setScore((s) => s + 10 + streak * 5);
        setStreak((s) => s + 1);
      } else {
        setStreak(0);
      }

      setTimeout(() => {
        setFeedback(null);
        setTargetDigit(Math.floor(Math.random() * 10));
        setRound((r) => r + 1);
      }, 1500);
    },
    [targetDigit, streak]
  );

  const resetGame = () => {
    setScore(0);
    setStreak(0);
    setRound(1);
    setHistory([]);
    setTargetDigit(Math.floor(Math.random() * 10));
  };

  const accuracy = history.length > 0 ? (history.filter((h) => h.correct).length / history.length) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Trophy, label: "Score", value: score, color: "text-secondary" },
          { icon: Zap, label: "Streak", value: `${streak}x`, color: "text-primary" },
          { icon: Target, label: "Round", value: round, color: "text-accent" },
          { icon: Star, label: "Accuracy", value: `${accuracy.toFixed(0)}%`, color: "text-primary" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4 text-center"
          >
            <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
            <p className="text-xs font-mono text-muted-foreground">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-xs font-mono uppercase text-muted-foreground mb-2">Draw this digit</p>
          <motion.div
            key={targetDigit}
            initial={{ scale: 0.5, rotateY: 90 }}
            animate={{ scale: 1, rotateY: 0 }}
            className="text-8xl font-bold text-primary"
          >
            {targetDigit}
          </motion.div>
        </div>

        <div className="relative">
          <DrawingCanvas onPredict={handlePredict} size={240} />
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className={`absolute inset-0 flex items-center justify-center rounded-xl ${
                  feedback.correct
                    ? "bg-primary/20 border-2 border-primary"
                    : "bg-destructive/20 border-2 border-destructive"
                }`}
              >
                <span className="text-4xl font-bold">
                  {feedback.correct ? "✓" : "✗"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={resetGame} className="border-primary/30 hover:border-primary">
          Reset Game
        </Button>
      </div>

      {history.length > 0 && (
        <div className="glass rounded-xl p-4">
          <p className="text-xs font-mono uppercase text-muted-foreground mb-3">Recent Rounds</p>
          <div className="flex flex-wrap gap-2">
            {history.slice(-20).map((h, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                  h.correct
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-destructive/20 text-destructive border border-destructive/30"
                }`}
              >
                {h.target}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GameMode;
