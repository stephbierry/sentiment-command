/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  BarChart3, 
  LayoutDashboard, 
  Settings, 
  Sparkles, 
  Podcast, 
  History, 
  Bell, 
  Brain, 
  Trophy, 
  MessageSquare,
  Paperclip,
  Trash2,
  Zap,
  Code
} from 'lucide-react';

interface SentimentScores {
  positive: number;
  neutral: number;
  negative: number;
  insight: string;
}

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ text: string, scores: SentimentScores, date: string, timestamp: number }[]>([]);
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [scores, setScores] = useState<SentimentScores>({
    positive: 0,
    neutral: 0,
    negative: 0,
    insight: "Prêt pour une nouvelle analyse de sentiment."
  });

  const analyzeSentiment = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const prompt = `Analyze the sentiment of the following text and provide a result exactly in this JSON format:
{
  "positive": number (0-100),
  "neutral": number (0-100),
  "negative": number (0-100),
  "insight": "Short summary in French of why it's positive/negative"
}
The three numbers must add up exactly to 100.
Text: "${text}"`;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const resultText = response.text || '';
      const data = JSON.parse(resultText);
      setScores(data);
      
      setHistory(prev => [{ 
        text, 
        scores: data, 
        date: new Date().toLocaleString(),
        timestamp: Date.now() 
      }, ...prev]);
    } catch (error) {
      console.error('Failed to analyze sentiment', error);
      setScores({
        positive: 33,
        neutral: 34,
        negative: 33,
        insight: "Erreur lors de l'analyse. Veuillez réessayer."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setText(content);
      };
      reader.readAsText(file);
    }
  };

  const filteredHistory = history.filter(item => {
    // Sentiment filter: item is considered 'positive' if its positive score is the highest
    const dominantSentiment = () => {
      const { positive, neutral, negative } = item.scores;
      if (positive >= neutral && positive >= negative) return 'positive';
      if (neutral >= positive && neutral >= negative) return 'neutral';
      return 'negative';
    };

    const matchesSentiment = sentimentFilter === 'all' || dominantSentiment() === sentimentFilter;

    // Date filter
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = now - item.timestamp < oneDay;
    } else if (dateFilter === 'week') {
      matchesDate = now - item.timestamp < oneWeek;
    }

    return matchesSentiment && matchesDate;
  });

  return (
    <div className="bg-background text-on-background font-sans min-h-screen">
      {/* Top Navigation Bar */}
      <header className="bg-slate-950 text-emerald-400 fixed top-0 w-full z-50 border-b border-slate-800 flex items-center justify-between px-6 h-16 shadow-2xl">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-emerald-400 stroke-[3px]" size={24} />
          <h1 className="text-xl font-black text-emerald-400 italic tracking-tighter">SENTIMENT COMMAND</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 overflow-hidden shrink-0">
            <img alt="Executive User" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCU9CShCMiO3VLYYo1xWvN34TRZKbZCAvBGCDTysZpBrVUvBKGYIn6cXLT3KTPOcmhrXPQ6Ube7Z_9QS3DXUxzixPwO4D86Ge1zaxR9xn2TA_xDmtRwV5-Mla0a8IMBOkqkV0VAXIuU-r4B3oUHRAY-RQrvayHM2SSEgHX_dwIGyXdfQdrbFm7JYRDfmG1GbOOR3HqACJenIW9mwihIGPSJWkQIqzsRcXhmBm6MoN9eUX2WW-wxybYWFQg7yOqrOAsMVyBGcvsBYxFd" />
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-[280px] bg-slate-900 border-r border-slate-800 hidden md:flex flex-col pt-20 z-40">
        <nav className="flex flex-col gap-2 p-4">
          <SidebarNavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <SidebarNavItem 
            icon={<History size={20} />} 
            label="Historique" 
            active={view === 'history'} 
            onClick={() => setView('history')} 
          />
        </nav>
        <div className="mt-auto p-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-surface-container-high rounded-lg flex items-center justify-center border border-slate-800">
              <Trophy className="text-emerald-400" size={24} />
            </div>
            <div>
              <p className="font-lexend font-bold text-xs uppercase text-emerald-400">Athletic Intelligence</p>
              <p className="text-[10px] text-slate-500">v4.2.0-STABLE</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:pl-[280px] pt-16 pb-24 md:pb-8 min-h-screen overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-6 py-12 md:px-8">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header Section */}
                <div className="mb-12">
                  <h2 className="text-4xl md:text-5xl font-black text-on-surface uppercase mb-4 tracking-tighter">Analyse de Sentiment en Temps Réel</h2>
                  <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed"> Capturez l'essence de votre communauté. Collez les flux de commentaires sociaux pour transformer la voix des fans en données stratégiques exploitables.</p>
                </div>

                {/* Input Section */}
                <section className="bg-surface-container-low border border-slate-800 rounded-xl p-8 mb-12 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 transition-all group-focus-within:w-2" />
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2 tracking-widest" htmlFor="fan-comments">
                        <MessageSquare size={16} />
                        Coller les réactions ici
                      </label>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest bg-slate-900 px-2 py-1 rounded">Source : Multi-plateforme</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".txt,.md,.json,.csv"
                        onChange={handleFileUpload}
                      />
                      <textarea 
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-on-surface rounded-lg p-6 text-base transition-all resize-none placeholder:text-slate-800" 
                        id="fan-comments" 
                        placeholder="Insérez ici les réactions après le dernier match ou les annonces de transfert..." 
                        rows={8}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                      />
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700 transition-all hover:scale-110"
                        >
                          <Paperclip size={18} />
                        </button>
                        <button 
                          onClick={() => setText('')}
                          className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700 transition-all hover:scale-110"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Action Button Section */}
                <div className="flex justify-center mb-16">
                  <button 
                    onClick={analyzeSentiment}
                    disabled={loading || !text.trim()}
                    className={`pulse-effect px-12 py-5 rounded-full font-black text-xl uppercase tracking-widest flex items-center gap-4 transition-all shadow-[0_0_40px_rgba(0,255,102,0.15)] active:scale-95 ${
                      loading || !text.trim() 
                        ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700' 
                        : 'bg-primary-container text-on-primary-container hover:brightness-110 hover:shadow-[0_0_50px_rgba(0,255,102,0.25)]'
                    }`}
                  >
                    {loading ? (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-4 border-on-primary-container/30 border-t-on-primary-container rounded-full"
                      />
                    ) : (
                      <Zap size={32} fill="currentColor" />
                    )}
                    {loading ? 'ANALYSE EN COURS...' : "Analyser l'ambiance"}
                  </button>
                </div>

                {/* Dashboard Bento Grid / Gauges */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SentimentGauge 
                    value={scores.positive} 
                    color="text-emerald-500" 
                    label="Positif" 
                    sublabel="Efficacité"
                    desc="Vibe générale : Enthousiaste et confiante."
                  />
                  <SentimentGauge 
                    value={scores.neutral} 
                    color="text-slate-400" 
                    label="Neutre" 
                    sublabel="Stable"
                    desc="Observations factuelles sans émotion forte."
                  />
                  <SentimentGauge 
                    value={scores.negative} 
                    color="text-rose-500" 
                    label="Négatif" 
                    sublabel="Alerte"
                    desc="Points de friction et frustrations identifiés."
                  />
                </section>

                {/* Bottom Insight Card */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div 
                    layout
                    className="bg-surface-container-low border-l-4 border-emerald-500 p-6 rounded-xl shadow-xl border border-slate-900"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="text-emerald-400" size={24} />
                      <h4 className="text-xs font-black text-on-surface uppercase tracking-widest">Insight IA Athlétique</h4>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                      {scores.insight}
                    </p>
                  </motion.div>
                  <div className="bg-surface-container-low border border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-xl">
                    <div className="flex flex-col">
                      <h4 className="text-xs font-black text-on-surface uppercase tracking-widest mb-1">Dernière analyse</h4>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Flux synchronisé : Temps réel</p>
                      </div>
                    </div>
                    <div className="flex -space-x-4">
                      <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
                         <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2yl4pnYMHrGopuUiUCmOZRZgIWKoijg9f-Bj1yRnMl_dyljDDF7HJNoyNXIG65D9MrS1Qh46MrisC4uN2oUv6WEt3wIJu8wyJhr0NcRctQHF09kmz9-pswP7I2J2kbAEmfKOMSlAfWNBukZpKw7H8eYWyNVqirRRfCjsQsivI__VnHzqbXD9yaRz1JrNjPhwMOF2AMwal82r1ey9lLg45bsr2TYKiLII3FyGpYQcthIZIKMk95LJ9Fpy4A6TfqE8XYoRJRm4tKkS_" alt="User" />
                      </div>
                      <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
                         <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHSPjflhoue2ueCPnzQO4tFRy9lsWD6sVyMmkOW-B1fLH7f6RvjYyrG3clEnTDas0Y0oMZL_ABynNWpmdF_9e15uWunj7LA7XnGL65rmW_6jExDp7Js2l3n0RjCbBJglp5fDe6yy-lOK-ZWoz4GuXj2ABzDlmaNbRMDMbZz_rPyhPlLKAo4IOt4vl5-dJtVT4lxVNuvCM4cbt1rzO0vwyRgGeTJ8REvtbYkXNi874iIpeHD9TQFOjlgyA_wiic4WITf0xES1tdmbH3" alt="User" />
                      </div>
                      <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-emerald-500 flex items-center justify-center text-[10px] font-black text-black ring-2 ring-slate-900">+240</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto w-full flex flex-col gap-8 pb-12"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                  <h2 className="text-4xl font-black text-on-surface uppercase tracking-tighter">Historique Command</h2>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setHistory([])}
                      className="text-[10px] font-black uppercase text-slate-500 hover:text-rose-500 transition-colors tracking-[0.2em]"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Sentiment:</span>
                    <FilterButton 
                      label="Tous" 
                      active={sentimentFilter === 'all'} 
                      onClick={() => setSentimentFilter('all')} 
                    />
                    <FilterButton 
                      label="Positif" 
                      active={sentimentFilter === 'positive'} 
                      onClick={() => setSentimentFilter('positive')} 
                      color="hover:text-emerald-400"
                    />
                    <FilterButton 
                      label="Neutre" 
                      active={sentimentFilter === 'neutral'} 
                      onClick={() => setSentimentFilter('neutral')} 
                      color="hover:text-slate-300"
                    />
                    <FilterButton 
                      label="Négatif" 
                      active={sentimentFilter === 'negative'} 
                      onClick={() => setSentimentFilter('negative')} 
                      color="hover:text-rose-500"
                    />
                  </div>
                  <div className="w-px h-6 bg-slate-800 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Période:</span>
                    <FilterButton 
                      label="Tout" 
                      active={dateFilter === 'all'} 
                      onClick={() => setDateFilter('all')} 
                    />
                    <FilterButton 
                      label="24h" 
                      active={dateFilter === 'today'} 
                      onClick={() => setDateFilter('today')} 
                    />
                    <FilterButton 
                      label="7 Jours" 
                      active={dateFilter === 'week'} 
                      onClick={() => setDateFilter('week')} 
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-6 custom-scrollbar pr-2 h-[calc(100vh-450px)] overflow-y-auto">
                  {filteredHistory.length === 0 ? (
                    <div className="bg-surface-container-low border border-slate-800 rounded-2xl p-16 text-center flex flex-col items-center gap-6">
                      <History className="w-20 h-20 text-slate-800 opacity-50" />
                      <div>
                        <p className="text-on-surface font-black uppercase tracking-widest">Aucun résultat</p>
                        <p className="text-slate-500 text-sm mt-2 font-medium">Ajustez vos filtres ou effectuez une nouvelle analyse.</p>
                      </div>
                    </div>
                  ) : (
                    filteredHistory.map((item, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-surface-container-low border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row gap-8 group hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded tracking-[0.15em] border border-emerald-500/20">{item.date}</span>
                          </div>
                          <p className="text-base text-on-surface line-clamp-2 italic leading-relaxed">"{item.text}"</p>
                          <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{item.scores.insight}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 sm:gap-8 shrink-0 bg-slate-900 p-6 rounded-xl border border-slate-800 items-center justify-around md:min-w-[280px]">
                          <MiniScore value={item.scores.positive} color="text-emerald-500" label="POS" />
                          <div className="w-px h-8 bg-slate-800" />
                          <MiniScore value={item.scores.neutral} color="text-slate-400" label="NEU" />
                          <div className="w-px h-8 bg-slate-800" />
                          <MiniScore value={item.scores.negative} color="text-rose-500" label="NEG" />
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950/95 backdrop-blur-xl flex justify-around items-center px-4 pb-4 pt-4 border-t border-slate-800 z-50">
        <MobileNavItem 
          icon={<Brain size={24} />} 
          label="Analyse" 
          active={view === 'dashboard'} 
          onClick={() => setView('dashboard')} 
        />
        <MobileNavItem 
          icon={<History size={24} />} 
          label="History" 
          active={view === 'history'} 
          onClick={() => setView('history')} 
        />
        <MobileNavItem 
          icon={<Bell size={24} />} 
          label="Alertes" 
        />
      </nav>
    </div>
  );
}

function SidebarNavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`px-6 py-4 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-300 cursor-pointer rounded-lg ${
        active 
          ? 'text-emerald-400 bg-emerald-500/10 border-l-4 border-emerald-500 shadow-[inset_0_0_20px_rgba(0,255,102,0.05)]' 
          : 'text-slate-500 hover:text-white hover:bg-slate-800 hover:translate-x-2'
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

function MobileNavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-4 rounded-xl transition-all duration-300 ${
        active ? 'text-emerald-400 scale-110' : 'text-slate-500'
      }`}
    >
      {icon}
      <span className="text-[8px] font-black uppercase tracking-widest mt-1">{label}</span>
    </div>
  );
}

function MiniScore({ value, color, label }: { value: number, color: string, label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[60px]">
      <span className={`text-2xl font-black ${color} tracking-tighter`}>{value}%</span>
      <span className="text-[10px] font-black tracking-[0.3em] text-slate-600 mt-1">{label}</span>
    </div>
  );
}

function FilterButton({ label, active, onClick, color = "hover:text-white" }: { label: string, active: boolean, onClick: () => void, color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-[0.1em] border transition-all ${
        active 
          ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
          : `bg-slate-950 border-slate-800 text-slate-500 ${color} hover:border-slate-700`
      }`}
    >
      {label}
    </button>
  );
}

function SentimentGauge({ value, color, label, sublabel, desc }: { value: number, color: string, label: string, sublabel: string, desc: string }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="bg-surface-container-low border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center group hover:border-emerald-500/50 transition-all hover:-translate-y-2 shadow-xl">
      <div className="relative mb-8">
        <svg className="w-48 h-48 transform -rotate-90">
          <circle 
            className="text-slate-900" 
            cx="96" cy="96" fill="transparent" r={radius} 
            stroke="currentColor" strokeWidth="8" 
          />
          <motion.circle 
            className={`gauge-ring ${color}`}
            cx="96" cy="96" fill="transparent" r={radius} 
            stroke="currentColor" strokeWidth="12" 
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={`text-6xl font-black ${color} tracking-tighter`}
            key={value}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {value}%
          </motion.span>
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${color}/40`}>{sublabel}</span>
        </div>
      </div>
      <h3 className="text-2xl font-black text-on-surface uppercase mb-3 tracking-widest">{label}</h3>
      <p className="text-slate-500 text-xs font-medium leading-relaxed italic">"{desc}"</p>
    </div>
  );
}
