import React from "react";
import { Subtitles, Sparkles, CheckCircle2 } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Subtitles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                SRT Clean & Boost
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <Sparkles className="w-3 h-3 mr-1" />
                IA Gemini 3.8
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Correction orthographique SRT • Titres accrocheurs • Description Facebook SEO
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-4 text-xs text-slate-600 font-medium">
          <div className="flex items-center space-x-1.5 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Timecodes 100% préservés</span>
          </div>
        </div>
      </div>
    </header>
  );
};
