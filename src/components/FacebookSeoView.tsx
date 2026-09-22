import React, { useState } from "react";
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
  Video
} from "lucide-react";

interface FacebookSeoViewProps {
  facebookDescription: string;
  selectedTitle?: string;
  durationFormatted?: string;
}

export const FacebookSeoView: React.FC<FacebookSeoViewProps> = ({
  facebookDescription,
  selectedTitle = "Titre de votre vidéo",
  durationFormatted = "01:15",
}) => {
  const [description, setDescription] = useState(facebookDescription);
  const [copied, setCopied] = useState(false);

  // Sync if prop updates
  React.useEffect(() => {
    setDescription(facebookDescription);
  }, [facebookDescription]);

  const handleCopy = () => {
    navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Count sentences roughly based on punctuation . ! ?
  const sentenceCount = description
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3 && !s.startsWith("#")).length;

  const charCount = description.length;
  const hashtags = (description.match(/#[a-zA-Z0-9_À-ÿ]+/g) || []);

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
              Description Facebook optimisée SEO (1-2 phrases)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Format court calibré pour capter l'attention sans être masqué par le bouton "Voir plus".
          </p>
        </div>

        <button
          type="button"
          id="btn-copy-facebook-desc"
          onClick={handleCopy}
          className="self-start sm:self-auto inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-sm active:scale-95 transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1.5 text-white" />
              Copié dans le presse-papier !
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copier dans le presse-papier
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Editable description area & SEO diagnostics */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Texte prêt à publier (modifiable) :
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  {charCount} caractères
                </span>
                <button
                  type="button"
                  id="btn-copy-facebook-textarea"
                  onClick={handleCopy}
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
                      Copier dans le presse-papier
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

          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-blue-900 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Pourquoi ce format fonctionne sur Facebook :
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              L'algorithme de Facebook favorise les publications directes où la première ligne accroche le spectateur sans pavé textuel. Les mots-clés permettent au moteur de recherche vidéo de Facebook de recommander votre contenu.
            </p>
          </div>
        </div>

        {/* Facebook Feed Preview Mockup */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Aperçu dans le fil d'actualité Facebook</span>
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

              {/* Text content */}
              <div className="text-xs text-slate-900 leading-relaxed whitespace-pre-wrap mb-3 font-normal">
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
