import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Brain, Gamepad2, BarChart3, Layers, Eye, AlertTriangle, Sparkles, History, LogOut, Save, User } from "lucide-react";
import { recognizeDigit } from "@/lib/digitRecognizer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import DrawingCanvas from "@/components/DrawingCanvas";
import ConfidenceDisplay from "@/components/ConfidenceDisplay";
import ModelComparison from "@/components/ModelComparison";
import AugmentationPlayground from "@/components/AugmentationPlayground";
import GameMode from "@/components/GameMode";
import ErrorAnalysis from "@/components/ErrorAnalysis";
import GradCAMViz from "@/components/GradCAMViz";
import HistoryView from "@/components/HistoryView";

type Tab = "recognize" | "xai" | "models" | "augment" | "game" | "errors" | "history";

const tabs: { id: Tab; label: string; icon: typeof Brain }[] = [
  { id: "recognize", label: "Recognize", icon: Brain },
  { id: "xai", label: "Grad-CAM", icon: Eye },
  { id: "models", label: "Models", icon: BarChart3 },
  { id: "augment", label: "Augment", icon: Layers },
  { id: "game", label: "Game", icon: Gamepad2 },
  { id: "errors", label: "Errors", icon: AlertTriangle },
  { id: "history", label: "History", icon: History },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("recognize");
  const [predictions, setPredictions] = useState<number[]>(Array(10).fill(0));
  const [predictedDigit, setPredictedDigit] = useState<number | null>(null);
  const [lastImageData, setLastImageData] = useState<ImageData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const handlePredict = useCallback((imageData: ImageData) => {
    const normalized = recognizeDigit(imageData);
    setPredictions(normalized);
    setPredictedDigit(normalized.indexOf(Math.max(...normalized)));
    setLastImageData(imageData);
  }, []);

  const saveDrawing = async () => {
    if (!user || predictedDigit === null || !lastImageData) return;
    setSaving(true);
    const confidence = Math.max(...predictions);
    const { error } = await supabase.from("drawings").insert({
      user_id: user.id,
      predicted_digit: predictedDigit,
      confidence,
      predictions: predictions as unknown as never,
    });
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Drawing saved!", description: `Predicted: ${predictedDigit}` });
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen neural-grid">
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">NeuroDigit</h1>
              <p className="text-[11px] font-mono text-muted-foreground">CNN-Powered Digit Recognition</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50">
              <User className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono text-muted-foreground truncate max-w-[160px]">{user.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <nav className="border-b border-border/50 glass">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "gradient-primary text-primary-foreground glow-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "recognize" && (
            <motion.div
              key="recognize"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
            >
              <div className="space-y-4">
                <div className="glass rounded-xl p-6">
                  <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Drawing Canvas
                  </h2>
                  <DrawingCanvas onPredict={handlePredict} />
                </div>

                <div className="glass rounded-xl p-4 flex items-center justify-between gap-3">
                  <p className="text-xs font-mono text-muted-foreground">
                    <span className="text-primary">TIP:</span> Draw a single digit (0-9) using bold strokes.
                  </p>
                  <Button size="sm" onClick={saveDrawing} disabled={saving || predictedDigit === null}>
                    <Save className="w-3.5 h-3.5 mr-2" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>

              <ConfidenceDisplay predictions={predictions} predictedDigit={predictedDigit} />
            </motion.div>
          )}

          {activeTab === "xai" && (
            <motion.div key="xai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <GradCAMViz />
            </motion.div>
          )}

          {activeTab === "models" && (
            <motion.div key="models" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ModelComparison />
            </motion.div>
          )}

          {activeTab === "augment" && (
            <motion.div key="augment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <AugmentationPlayground />
            </motion.div>
          )}

          {activeTab === "game" && (
            <motion.div key="game" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <GameMode />
            </motion.div>
          )}

          {activeTab === "errors" && (
            <motion.div key="errors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ErrorAnalysis />
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <HistoryView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
