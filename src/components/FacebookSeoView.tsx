import React, { useState, useEffect } from "react";
import { 
  Copy, 
  Check, 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  Globe, 
  Sparkles, 
  Search, 
  Info,
  CheckCircle,
  Video,
  RefreshCw,
  Lightbulb
} from "lucide-react";
import { FacebookDescriptionIdea } from "../types";

interface FacebookSeoViewProps {
  facebookDescription: string;
  facebookDescriptions?: FacebookDescriptionIdea[];
  selectedTitle?: string;
  durationFormatted?: string;
  onReroll?: () => void;
  isRerolling?: boolean;
}

export const FacebookSeoView: React.FC<FacebookSeoViewProps> = ({
  facebookDescription,
  facebookDescriptions,
  selectedTitle = "Titre de votre vidéo",
  durationFormatted = "01:15",
  onReroll,
  isRerolling = false,
}) => {
  // Normalize items
  const items: FacebookDescriptionIdea[] = 
    facebookDescriptions && facebookDescriptions.length > 0
      ? facebookDescriptions
      : [
          {
            tone: "Éducatif & Bénéfice direct",
            text: facebookDescription,
            explanation: "Format optimisé pour le fil d'actualité et la recherche Facebook",
          },
        ];

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [description, setDescription] = useState<string>(items[0]?.text || facebookDescription);
  const [copied, setCopied] = useState(false);
  const [copiedCardIndex, setCopiedCardIndex] = useState<number | null>(null);

  // Sync when prop updates
  useEffect(() => {
    const current = items[selectedIndex]?.text || facebookDescription;
    setDescription(current);
  }, [facebookDescriptions, facebookDescription, selectedIndex]);

  const handleSelectTone = (index: number) => {
    setSelectedIndex(index);
    if (items[index]) {
      setDescription(items[index].text);
    }
  };

  const handleCopyCurrent = () => {
    navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCard = (text: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCardIndex(index);
    setTimeout(() => setCopiedCardIndex(null), 1800);
  };

  const sentenceCount = description
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3 && !s.startsWith("#")).length;

  const charCount = description.length;
  const hashtags = description.match(/#[a-zA-Z0-9_À-ÿ]+/g) || [];

  const getToneBadgeStyle = (tone: string) => {
    const lower = tone.toLowerCase();
    if (lower.includes("storytelling") || lower.includes("émotion")) {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    if (lower.includes("court") || lower.includes("punchline") || lower.includes("percutant")) {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }
    if (lower.includes("éducatif") || lower.includes("bénéfice") || lower.includes("pratique")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (lower.includes("curiosité") || lower.includes("intrigue")) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }
    if (lower.includes("humour") || lower.includes("humoristique") || lower.includes("dérision") || lower.includes("second degré")) {
      return "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200";
    }
    if (lower.includes("engageant") || lower.includes("communautaire") || lower.includes("débat")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Copy */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-xs font-bold font-mono">
              f
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {items.length} Descriptions Facebook ({items.length} tons différents)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Format 1 à 2 phrases courtes avec SEO & hashtags, calibré pour capter l'attention sans être masqué par "Voir plus".
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onReroll && (
            <button
              type="button"
              id="btn-reroll-descriptions"
              onClick={onReroll}
              disabled={isRerolling}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white shadow-xs active:scale-95 transition"
              title="Générer de nouvelles descriptions Facebook sur des tons différents sans toucher au SRT"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRerolling ? "animate-spin" : ""}`} />
              <span>{isRerolling ? "Génération..." : "Reroll les descriptions"}</span>
            </button>
          )}

          <button
            type="button"
            id="btn-copy-facebook-desc"
            onClick={handleCopyCurrent}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-xs active:scale-95 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-white" />
                Copié dans le presse-papier !
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copier la sélection
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tone Selection Tabs / Pills */}
      {items.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Choisissez un ton pour votre publication :</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {items.map((idea, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectTone(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? "bg-amber-400" : "bg-slate-300"
                    }`}
                  />
                  <span>{idea.tone}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Editable description area & SEO diagnostics */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getToneBadgeStyle(
                    items[selectedIndex]?.tone || "Ton standard"
                  )}`}
                >
                  {items[selectedIndex]?.tone || "Ton standard"}
                </span>
                <label className="text-xs font-semibold text-slate-700">
                  Texte éditable :
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  {charCount} caractères
                </span>
                <button
                  type="button"
                  id="btn-copy-facebook-textarea"
                  onClick={handleCopyCurrent}
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold transition active:scale-95 border ${
                    copied
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-emerald-600" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copier
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              id="facebook-description-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] leading-relaxed text-slate-800 font-sans"
            />

            {items[selectedIndex]?.explanation && (
              <p className="text-[11px] text-slate-500 mt-2 flex items-start gap-1 leading-relaxed">
                <Lightbulb className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                <span><strong>Objectif de cet angle :</strong> {items[selectedIndex].explanation}</span>
              </p>
            )}

            {/* SEO Diagnostics pill list */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-[11px]">
              <div className="flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                <span>{sentenceCount <= 2 ? "1 à 2 phrases (idéal feed mobile)" : `${sentenceCount} phrases`}</span>
              </div>
              <div className="flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                <span>{hashtags.length} hashtag(s) ciblés</span>
              </div>
              <div className="flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                <Search className="w-3 h-3 mr-1 text-blue-600" />
                <span>Mots-clés vidéo intégrés</span>
              </div>
            </div>
          </div>

          {/* Cards for all proposed tones to easily compare and copy */}
          {items.length > 1 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Toutes les déclinaisons ({items.length} tons) :
              </h4>
              <div className="space-y-2">
                {items.map((idea, idx) => {
                  const isCurrent = selectedIndex === idx;
                  const isCardCopied = copiedCardIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectTone(idx)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                        isCurrent
                          ? "bg-blue-50/50 border-blue-300 ring-1 ring-blue-300"
                          : "bg-white hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getToneBadgeStyle(
                            idea.tone
                          )}`}
                        >
                          {idea.tone}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyCard(idea.text, idx, e)}
                          className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold border transition active:scale-95 ${
                            isCardCopied
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {isCardCopied ? (
                            <>
                              <Check className="w-3 h-3 mr-1 text-emerald-600" />
                              Copié !
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copier
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed font-normal">
                        {idea.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Facebook Feed Preview Mockup */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden sticky top-4">
            <div className="p-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Aperçu en direct dans le fil Facebook</span>
              <span className="text-[10px] text-slate-400 font-mono">Mobile & Desktop</span>
            </div>

            <div className="p-4">
              {/* Header */}
              <div className="flex items-center space-x-2.5 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  V
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-none">
                    Votre Page Vidéo
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-0.5">
                    <span>Il y a 10 min</span>
                    <span>•</span>
                    <Globe className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Text content preview */}
              <div className="text-xs text-slate-900 leading-relaxed whitespace-pre-wrap mb-3 font-normal min-h-[40px]">
                {description}
              </div>

              {/* Video Mockup Preview */}
              <div className="rounded-lg bg-slate-900 text-white overflow-hidden aspect-video relative flex flex-col justify-between p-3 border border-slate-800">
                <div className="flex justify-between items-center text-[10px] text-slate-300">
                  <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                    <Video className="w-2.5 h-2.5 text-blue-400" />
                    Vidéo
                  </span>
                  <span className="bg-black/60 px-1.5 py-0.5 rounded font-mono font-medium">
                    {durationFormatted}
                  </span>
                </div>

                <div className="my-auto flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:scale-105 transition-transform">
                    <div className="w-0 h-0 border-y-6 border-y-transparent border-l-10 border-l-white ml-0.5" />
                  </div>
                </div>

                <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent -mx-3 -mb-3 p-3 pt-6">
                  <p className="text-xs font-bold text-white line-clamp-1">
                    {selectedTitle}
                  </p>
                </div>
              </div>

              {/* Fake Social Interaction Bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-around text-xs text-slate-500 font-medium">
                <button type="button" className="flex items-center gap-1.5 hover:text-slate-800 py-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                  <span>J'aime</span>
                </button>
                <button type="button" className="flex items-center gap-1.5 hover:text-slate-800 py-1">
                  <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Commenter</span>
                </button>
                <button type="button" className="flex items-center gap-1.5 hover:text-slate-800 py-1">
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Partager</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
