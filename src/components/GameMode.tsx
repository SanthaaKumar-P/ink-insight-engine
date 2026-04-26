import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, Target, Star, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import DrawingCanvas from "./DrawingCanvas";
import { recognizeDigit } from "@/lib/digitRecognizer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const GameMode = () => {
  const { user } = useAuth();
  const [targetDigit, setTargetDigit] = useState(() => Math.floor(Math.random() * 10));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState<{ correct: boolean; digit: number } | null>(null);
  const [history, setHistory] = useState<{ target: number; predicted: number; correct: boolean }[]>([]);
  const [saving, setSaving] = useState(false);

  const handlePredict = useCallback(
    (imageData: ImageData) => {
      const predictions = recognizeDigit(imageData);
      const predicted = predictions.indexOf(Math.max(...predictions));
      const isCorrect = predicted === targetDigit;

      setFeedback({ correct: isCorrect, digit: predicted });
      setHistory((h) => [...h, { target: targetDigit, predicted, correct: isCorrect }]);

      if (isCorrect) {
        setScore((s) => s + 10 + streak * 5);
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
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
    setBestStreak(0);
    setRound(1);
    setHistory([]);
    setTargetDigit(Math.floor(Math.random() * 10));
  };

  const saveScore = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Log in to save your score", variant: "destructive" });
      return;
    }
    if (history.length === 0) return;
    setSaving(true);
    const { error } = await supabase.from("game_scores").insert({
      user_id: user.id,
      score,
      best_streak: bestStreak,
      rounds_played: history.length,
      accuracy: (history.filter((h) => h.correct).length / history.length) * 100,
    });
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Score saved!" });
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

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={resetGame} className="border-primary/30 hover:border-primary">
          Reset Game
        </Button>
        <Button onClick={saveScore} disabled={saving || history.length === 0}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Score"}
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
