import React, { useState } from "react";
import { 
  Flame, 
  Copy, 
  Check, 
  Sparkles, 
  Lightbulb, 
  Share2, 
  Layers
} from "lucide-react";
import { TitleIdea } from "../types";

interface TitlesViewProps {
  titles: TitleIdea[];
  videoSummary?: string;
  keyTopics?: string[];
}

export const TitlesView: React.FC<TitlesViewProps> = ({
  titles,
  videoSummary,
  keyTopics,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const handleCopyTitle = (title: string, index: number) => {
    navigator.clipboard.writeText(title);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const handleCopyAll = () => {
    const text = titles.map((t, i) => `${i + 1}. [${t.hookType}] ${t.title}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  const getHookBadgeColor = (hookType: string) => {
    const lower = hookType.toLowerCase();
    if (lower.includes("curiosité") || lower.includes("intrigue")) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }
    if (lower.includes("bénéfice") || lower.includes("direct") || lower.includes("promesse")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (lower.includes("question") || lower.includes("choc")) {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    if (lower.includes("révélation") || lower.includes("secret") || lower.includes("contre-intuitif")) {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  return (
    <div className="space-y-4">
      {/* Top summary & topics */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {titles.length} Idées de titres percutants
            </h3>
          </div>
          {videoSummary && (
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              <strong>Sujet extrait :</strong> {videoSummary}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopyAll}
          className="self-start sm:self-auto inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 active:scale-95 transition"
        >
          {allCopied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Tous copiés dans le presse-papier !
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1" />
              Copier tous les titres
            </>
          )}
        </button>
      </div>

      {keyTopics && keyTopics.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Mots-clés détectés :</span>
          {keyTopics.map((topic, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/80 text-[11px]"
            >
              #{topic}
            </span>
          ))}
        </div>
      )}

      {/* Grid of Title Ideas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {titles.map((idea, index) => {
          const isCopied = copiedIndex === index;
          return (
            <div
              key={index}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${getHookBadgeColor(
                      idea.hookType
                    )}`}
                  >
                    {idea.hookType}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Option {index + 1}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug mb-2 group-hover:text-indigo-950">
                  {idea.title}
                </h4>

                {idea.explanation && (
                  <p className="text-[11px] text-slate-500 flex items-start gap-1 leading-relaxed mb-3">
                    <Lightbulb className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{idea.explanation}</span>
                  </p>
                )}
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-slate-400">
                  {idea.title.length} caractères
                </span>
                <button
                  type="button"
                  id={`btn-copy-title-${index}`}
                  onClick={() => handleCopyTitle(idea.title, index)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 border ${
                    isCopied
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border-indigo-200/70"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      Copier dans le presse-papier
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
