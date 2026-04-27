import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Shield, Activity, TrendingUp, RefreshCcw, Info, LayoutDashboard, Download, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeMarket, MarketAnalysis } from './services/geminiService';
import { voice } from './services/voiceService';
import { cn } from './lib/utils';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import TradingViewChart from './components/TradingViewChart';

// Mock data generator for small charts
const generateSparkline = () => Array.from({ length: 12 }, (_, i) => ({ value: Math.random() * 100 }));

function MarketAssetDisplay({ asset, index, isSelected, onSelect }: { 
  asset: MarketAnalysis; 
  index: number; 
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isBullish = asset.bias === "BULLISH";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className={cn(
        "p-2.5 rounded-lg border transition-all duration-200 cursor-pointer relative",
        isSelected 
          ? "bg-[#FF4E00]/5 border-[#FF4E00]/30" 
          : "bg-[#0A0A0B] border-[#242427] hover:bg-[#161618]"
      )}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-white uppercase">{asset.asset}</span>
          <div className={cn(
            "px-1 rounded-[2px] text-[6px] font-bold uppercase",
            isBullish ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          )}>
            {asset.bias}
          </div>
        </div>
        <span className="text-[10px] font-mono text-[#FF4E00]">{asset.currentPrice}</span>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <span className="text-[6px] text-[#8E9299] uppercase block">Range</span>
          <span className="text-[8px] font-mono text-white/70 block truncate">{asset.msnrDetails.monthlyRange}</span>
        </div>
        <div className="flex-1">
          <span className="text-[6px] text-[#8E9299] uppercase block">Sunday</span>
          <span className="text-[8px] font-mono text-white/70 block truncate">{asset.msnrDetails.sundayRange}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [data, setData] = useState<MarketAnalysis[]>([]);
  const [statusText, setStatusText] = useState("System standby. Say 'Research markets' to begin.");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("EURUSD");

  const handleInitialLoad = async () => {
    setIsAnalyzing(true);
    setStatusText("Initializing baseline MSNR analysis...");
    const results = await analyzeMarket();
    if (results.length > 0) {
      setData(results);
      setLastUpdated(new Date().toLocaleTimeString());
      setSelectedSymbol(results[0].asset);
      setStatusText("Baseline analysis complete. Awaiting voice input.");
    }
    setIsAnalyzing(false);
  };

  useEffect(() => {
    handleInitialLoad();
  }, []);

  const handleVoiceAssistant = async () => {
    try {
      setIsListening(true);
      setStatusText("Listening for command...");
      const transcript = await voice.listen();
      
      setIsAnalyzing(true);
      setIsListening(false);
      setStatusText(`Alchemist is researching: ${transcript}...`);
      
      const results = await analyzeMarket(transcript);
      if (results.length > 0) {
        setData(results);
        setLastUpdated(new Date().toLocaleTimeString());
        setSelectedSymbol(results[0].asset);
        
        const summary = results[0].advice;
        setStatusText("Market structure sync complete.");
        await voice.speak(`${results[0].asset} analysis finalized by Alchemist. Advice: ${summary}`);
      } else {
        setStatusText("No data found for this query.");
        await voice.speak("I couldn't find enough market data for that specific request.");
      }
    } catch (err: any) {
      console.error(err);
      setIsListening(false);
      if (err.message?.includes("RESOURCE_EXHAUSTED")) {
        setStatusText("Gemini limit reached. Wait 60s.");
      } else {
        setStatusText("Error capturing voice input.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedAsset = data.find(a => a.asset === selectedSymbol);

  return (
    <div className="h-screen technical-grid flex flex-col md:flex-row overflow-hidden font-sans bg-[#0A0A0B]">
      {/* Sidebar - Asset List (Shrunk) */}
      <aside className="w-full md:w-72 border-r border-[#242427] bg-[#161618] flex flex-col z-20">
        <div className="p-5 border-b border-[#242427]">
          <div className="flex items-center gap-3 mb-1 text-white">
            <div className="p-1.5 bg-[#FF4E00] rounded shadow-[0_0_10px_rgba(255,78,0,0.3)]">
              <Shield className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold tracking-tight uppercase">Alchemist</h1>
          </div>
          <p className="text-[8px] font-mono text-[#8E9299] uppercase tracking-[0.2em]">MSNR TERMINAL</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 custom-scrollbar">
          {isAnalyzing && data.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center opacity-30 text-[#8E9299]">
              <RefreshCcw className="w-5 h-5 animate-spin mb-3 text-[#FF4E00]" />
              <span className="text-[7px] font-mono uppercase tracking-widest">Syncing...</span>
            </div>
          ) : (
            data.map((asset, idx) => (
              <MarketAssetDisplay 
                key={asset.asset + idx} 
                asset={asset} 
                index={idx}
                isSelected={selectedSymbol === asset.asset}
                onSelect={() => setSelectedSymbol(asset.asset)}
              />
            ))
          )}
        </div>

        <div className="p-5 border-t border-[#242427] bg-[#0A0A0B]/50 flex flex-col gap-3">
          <div className="p-2 border border-[#242427] rounded-lg bg-[#0A0A0B] flex flex-col gap-1">
             <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono text-[#8E9299] uppercase tracking-wider">Status</span>
              <div className={cn("w-1 h-1 rounded-full", isListening ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-green-500 shadow-[0_0_5px_#22c55e]")} />
            </div>
            <p className="text-[10px] text-white/40 leading-tight italic truncate">
              {statusText}
            </p>
          </div>

          <button
            onClick={handleVoiceAssistant}
            disabled={isAnalyzing || isListening}
            className={cn(
              "group relative h-10 rounded flex items-center justify-center gap-2 transition-all duration-300",
              isListening ? "bg-red-500/10 border border-red-500/50" : "bg-[#FF4E00] hover:bg-[#FF4E00]/90",
              isAnalyzing && "opacity-50 cursor-not-allowed"
            )}
            id="voice-trigger"
          >
            {isListening ? <MicOff className="w-3.5 h-3.5 text-red-500" /> : <Mic className="w-3.5 h-3.5 text-white" />}
            <span className={cn("text-[9px] font-bold uppercase tracking-widest", isListening ? "text-red-500" : "text-white")}>Activate Control</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header bar (Sleeker) */}
        <header className="h-14 border-b border-[#242427] bg-[#0A0A0B]/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-[#8E9299] uppercase">Asset Monitor</span>
              <span className="text-base font-bold text-white tracking-widest uppercase">{selectedSymbol}</span>
            </div>
            <div className="h-6 w-px bg-[#242427] mx-1" />
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#FF4E00]" />
              <span className="text-[9px] font-mono text-[#8E9299]">MSNR SCANNER: ACTIVE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-mono text-[#8E9299]">LST UPD: {lastUpdated}</span>
            <div className="p-1.5 rounded bg-[#1C1C1F] border border-[#242427]">
              <LayoutDashboard className="w-3.5 h-3.5 text-[#8E9299]" />
            </div>
          </div>
        </header>

        {/* Live Chart & Advice Area */}
        <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          {/* Main Chart Viewer */}
          <div className="flex-[3] transition-all duration-500 rounded-2xl overflow-hidden min-h-[400px] shadow-2xl relative group/chart">
             <TradingViewChart symbol={selectedSymbol} />
             
             {/* Strategic Price Level Overlay (Right-aligned Axis Markers) */}
             <AnimatePresence>
                {selectedAsset?.levels?.strategic && selectedAsset.levels.strategic.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute right-0 top-0 bottom-0 w-48 pointer-events-none z-10 flex flex-col justify-center gap-2 p-2"
                    >
                        {selectedAsset.levels.strategic.map((level, i) => (
                             <div key={i} className="flex items-center justify-end gap-1 pointer-events-auto group/marker cursor-help">
                                <div className="h-px flex-1 bg-[#FF4E00]/10 group-hover/marker:bg-[#FF4E00]/40 transition-colors" />
                                <div className="bg-[#1C1C1F]/90 backdrop-blur border border-[#FF4E00]/30 px-1.5 py-0.5 rounded text-[8px] font-mono whitespace-nowrap flex flex-col items-end shadow-lg transition-all group-hover/marker:border-[#FF4E00] group-hover/marker:bg-[#1C1C1F]">
                                   <div className="flex items-center gap-1">
                                      <span className="text-white font-bold tracking-tighter uppercase">{level.type}</span>
                                      <span className="text-[7px] text-[#8E9299]">{level.timeframe}</span>
                                   </div>
                                   <span className="text-[#FF4E00] font-bold leading-none">{level.price}</span>
                                </div>
                             </div>
                        ))}
                    </motion.div>
                )}
             </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {selectedAsset && (
              <motion.div 
                key={selectedSymbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 pb-4"
              >
                <div className="md:col-span-3 p-6 rounded-2xl bg-[#161618] border border-[#242427] relative group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-1.5 bg-[#FF4E00]/10 rounded">
                      <TrendingUp className="w-4 h-4 text-[#FF4E00]" />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">Market Context</h3>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed font-light italic">
                    {selectedAsset.advice}
                  </p>
                  
                  {/* Setup Callouts */}
                  {selectedAsset.setups.some(s => s.pattern !== "None") && (
                      <div className="mt-4 pt-4 border-t border-[#242427] flex flex-wrap gap-3">
                          {selectedAsset.setups.filter(s => s.pattern !== "None").map((setup, i) => (
                               <div key={i} className="px-3 py-2 rounded-lg bg-[#0A0A0B] border border-[#242427] flex items-center gap-2">
                                   <Zap className="w-3 h-3 text-[#FF4E00]" />
                                   <div>
                                     <span className="text-[9px] font-bold text-white uppercase">{setup.pattern}</span>
                                     <span className="text-[8px] text-[#8E9299] flex items-center gap-1">Strength: <b className="text-[#FF4E00]">{setup.significance}</b></span>
                                   </div>
                               </div>
                          ))}
                      </div>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-[#0A0A0B] border border-[#242427] flex flex-col justify-center">
                  <span className="text-[9px] font-mono text-[#8E9299] uppercase block mb-2 tracking-widest">Accuracy</span>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-bold text-white tracking-tighter">{selectedAsset.confidence}%</span>
                    <span className="text-[8px] font-mono text-green-500 mb-1">OPTIMIZED</span>
                  </div>
                  <div className="h-1 w-full bg-[#1C1C1F] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedAsset.confidence}%` }}
                      className="h-full bg-[#FF4E00]" 
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-1.5 rounded-lg bg-[#0A0A0B] border border-white/5 overflow-hidden">
      <span className="block text-[7px] font-mono text-[#8E9299] uppercase tracking-wider mb-0.5 truncate">{label}</span>
      <span className="text-[9px] font-mono text-white truncate block">{value}</span>
    </div>
  );
}
