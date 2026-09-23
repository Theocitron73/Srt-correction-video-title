import React, { useState } from "react";
import { 
  Subtitles, 
  Flame, 
  Share2, 
  CheckCircle2, 
  Download, 
  Copy, 
  Check
} from "lucide-react";
import { SrtCue, SrtProcessResult, SrtMetaStats } from "../types";
import { SubtitlesView } from "./SubtitlesView";
import { TitlesView } from "./TitlesView";
import { FacebookSeoView } from "./FacebookSeoView";
import { CorrectionsList } from "./CorrectionsList";
import { downloadSrtFile } from "../utils/srtParser";

interface ResultsContainerProps {
  originalCues: SrtCue[];
  correctedCues: SrtCue[];
  result: SrtProcessResult;
  stats: SrtMetaStats;
  fileName: string;
  onRerollTitles?: () => void;
  isRerollingTitles?: boolean;
  onRerollDescriptions?: () => void;
  isRerollingDescriptions?: boolean;
}

export const ResultsContainer: React.FC<ResultsContainerProps> = ({
  originalCues,
  correctedCues,
  result,
  stats,
  fileName,
  onRerollTitles,
  isRerollingTitles = false,
  onRerollDescriptions,
  isRerollingDescriptions = false,
}) => {
  const [activeTab, setActiveTab] = useState<"subtitles" | "titles" | "facebook" | "corrections">("subtitles");
  const [copiedAll, setCopiedAll] = useState(false);

  const selectedTitle = result.titles?.[0]?.title || "Titre de la vidéo";

  const handleDownloadSrt = () => {
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    downloadSrtFile(result.correctedSrt, `${baseName}_propre.srt`);
  };

  const handleCopyFullBundle = () => {
    let bundleText = `=== SOUS-TITRES SRT CORRIGÉS ===\n${result.correctedSrt}\n\n` +
      `=== IDÉES DE TITRES ACCROCHEURS (${result.titles.length} TONS) ===\n` +
      result.titles.map((t, i) => `${i + 1}. [${t.hookType}] ${t.title}`).join("\n") +
      `\n\n=== DESCRIPTIONS FACEBOOK SEO ===\n`;

    if (result.facebookDescriptions && result.facebookDescriptions.length > 0) {
      bundleText += result.facebookDescriptions
        .map((d, i) => `--- Ton ${i + 1} : ${d.tone} ---\n${d.text}`)
        .join("\n\n");
    } else {
      bundleText += result.facebookDescription;
    }

    navigator.clipboard.writeText(bundleText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-6">
      {/* Top Header with Tabs & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            id="tab-subtitles"
            onClick={() => setActiveTab("subtitles")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "subtitles"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
            }`}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>Sous-titres corrigés (.srt)</span>
          </button>

          <button
            type="button"
            id="tab-titles"
            onClick={() => setActiveTab("titles")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "titles"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Titres accrocheurs ({result.titles.length})</span>
          </button>

          <button
            type="button"
            id="tab-facebook"
            onClick={() => setActiveTab("facebook")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "facebook"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Description Facebook SEO</span>
          </button>

          {result.correctionsSample && result.correctionsSample.length > 0 && (
            <button
              type="button"
              id="tab-corrections"
              onClick={() => setActiveTab("corrections")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "corrections"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Fautes relevées ({result.correctionsSample.length})</span>
            </button>
          )}
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            id="btn-copy-all-bundle"
            onClick={handleCopyFullBundle}
            className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition active:scale-95"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Tout copié !
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copier tout le pack
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-download-corrected-srt"
            onClick={handleDownloadSrt}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm shadow-indigo-500/20 active:scale-95"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Télécharger le fichier corrigé
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === "subtitles" && (
          <SubtitlesView
            originalCues={originalCues}
            correctedCues={correctedCues}
            rawCorrectedSrt={result.correctedSrt}
            originalFileName={fileName}
          />
        )}

        {activeTab === "titles" && (
          <TitlesView
            titles={result.titles}
            videoSummary={result.summary}
            keyTopics={result.keyTopics}
            onReroll={onRerollTitles}
            isRerolling={isRerollingTitles}
          />
        )}

        {activeTab === "facebook" && (
          <FacebookSeoView
            facebookDescription={result.facebookDescription}
            facebookDescriptions={result.facebookDescriptions}
            selectedTitle={selectedTitle}
            durationFormatted={stats.durationFormatted}
            onReroll={onRerollDescriptions}
            isRerolling={isRerollingDescriptions}
          />
        )}

        {activeTab === "corrections" && (
          <CorrectionsList
            corrections={result.correctionsSample}
            estimatedCount={result.stats?.estimatedErrorsFixed}
          />
        )}
      </div>

      {/* Bottom Download Card */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">
              Votre sous-titre est prêt pour vos montages
            </p>
            <p className="text-[11px] text-slate-500">
              Format .srt nettoyé compatible Premiere Pro, DaVinci Resolve, CapCut, Final Cut et YouTube.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-download-corrected-srt-bottom"
          onClick={handleDownloadSrt}
          className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm shadow-indigo-500/20 active:scale-95"
        >
          <Download className="w-4 h-4 mr-2" />
          Télécharger le fichier corrigé
        </button>
      </div>
    </div>
  );
};
