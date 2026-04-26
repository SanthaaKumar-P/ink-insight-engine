import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History as HistoryIcon, Trophy, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Drawing {
  id: string;
  predicted_digit: number;
  confidence: number;
  created_at: string;
}

interface Score {
  id: string;
  score: number;
  best_streak: number;
  rounds_played: number;
  accuracy: number;
  created_at: string;
}

const HistoryView = () => {
  const { user } = useAuth();
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [d, s] = await Promise.all([
      supabase.from("drawings").select("id,predicted_digit,confidence,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("game_scores").select("id,score,best_streak,rounds_played,accuracy,created_at").eq("user_id", user.id).order("score", { ascending: false }).limit(20),
    ]);
    if (d.data) setDrawings(d.data);
    if (s.data) setScores(s.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const deleteDrawing = async (id: string) => {
    const { error } = await supabase.from("drawings").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", variant: "destructive" });
    else { setDrawings((d) => d.filter((x) => x.id !== id)); toast({ title: "Deleted" }); }
  };

  if (!user) {
    return <div className="glass rounded-xl p-8 text-center text-muted-foreground">Sign in to view your history</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass rounded-xl p-6">
        <h3 className="text-sm font-mono uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <HistoryIcon className="w-4 h-4 text-primary" /> Recent Drawings
        </h3>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : drawings.length === 0 ? (
          <p className="text-xs text-muted-foreground">No drawings saved yet. Draw and predict to save!</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {drawings.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                    {d.predicted_digit}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Digit {d.predicted_digit}</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {(Number(d.confidence) * 100).toFixed(1)}% · {new Date(d.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteDrawing(d.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-xl p-6">
        <h3 className="text-sm font-mono uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-secondary" /> Top Scores
        </h3>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : scores.length === 0 ? (
          <p className="text-xs text-muted-foreground">No game scores saved yet. Play the Game tab!</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {scores.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-xs font-bold">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{s.score} pts</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      Streak {s.best_streak}x · {Number(s.accuracy).toFixed(0)}% · {s.rounds_played} rounds
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HistoryView;
