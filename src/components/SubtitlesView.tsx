import React, { useState } from "react";
import { 
  Download, 
  Copy, 
  Check, 
  Columns, 
  FileCode, 
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { SrtCue } from "../types";
import { downloadSrtFile } from "../utils/srtParser";
import { copyToClipboard } from "../utils/clipboard";

interface SubtitlesViewProps {
  originalCues: SrtCue[];
  correctedCues: SrtCue[];
  rawCorrectedSrt: string;
  originalFileName: string;
}

export const SubtitlesView: React.FC<SubtitlesViewProps> = ({
  originalCues,
  correctedCues,
  rawCorrectedSrt,
  originalFileName,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"side-by-side" | "raw" | "clean-list">("side-by-side");
  const [filterChangedOnly, setFilterChangedOnly] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(rawCorrectedSrt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const baseName = originalFileName.replace(/\.[^/.]+$/, "");
    downloadSrtFile(rawCorrectedSrt, `${baseName}_propre.srt`);
  };

  // Find cues where text changed
  const pairedCues = correctedCues.map((corrCue, idx) => {
    const origCue = originalCues[idx];
    const isDifferent = origCue && origCue.text.trim() !== corrCue.text.trim();
    return {
      index: idx + 1,
      start: corrCue.start,
      end: corrCue.end,
      originalText: origCue?.text || "",
      correctedText: corrCue.text,
      isDifferent,
    };
  });

  const modifiedCount = pairedCues.filter((c) => c.isDifferent).length;
  const displayCues = filterChangedOnly ? pairedCues.filter((c) => c.isDifferent) : pairedCues;

  return (
    <div className="space-y-4">
      {/* Top action toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100/80 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            {modifiedCount > 0 ? `${modifiedCount} réplique(s) corrigée(s)` : "Orthographe vérifiée"}
          </span>

          <button
            type="button"
            onClick={() => setFilterChangedOnly(!filterChangedOnly)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition ${
              filterChangedOnly
                ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {filterChangedOnly ? "Toutes les répliques" : "Afficher seulement les corrections"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode buttons */}
          <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("side-by-side")}
              className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                viewMode === "side-by-side"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Comparaison
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                viewMode === "raw"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Code SRT
            </button>
          </div>

          <button
            type="button"
            id="btn-copy-srt"
            onClick={handleCopy}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 active:scale-95 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Copié dans le presse-papier !
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copier dans le presse-papier
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-download-srt"
            onClick={handleDownload}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Télécharger le fichier corrigé
          </button>
        </div>
      </div>

      {/* Content depending on view mode */}
      {viewMode === "raw" ? (
        <div className="relative">
          <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed border border-slate-800">
            {rawCorrectedSrt}
          </pre>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
          {displayCues.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Aucune modification sur ces critères.
            </div>
          ) : (
            displayCues.map((item) => (
              <div
                key={item.index}
                className={`p-3 rounded-xl border transition-all ${
                  item.isDifferent
                    ? "bg-amber-50/40 border-amber-200/80 shadow-xs"
                    : "bg-white border-slate-200/70"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5 pb-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">#{item.index}</span>
                  <span>{item.start} ➔ {item.end}</span>
                  {item.isDifferent && (
                    <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                      Corrigé
                    </span>
                  )}
                </div>

                {viewMode === "side-by-side" && item.isDifferent ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-100">
                      <span className="text-[10px] font-bold text-rose-600 block mb-0.5 uppercase tracking-wider">
                        Original avec fautes
                      </span>
                      <p className="text-slate-700 font-medium whitespace-pre-wrap line-through decoration-rose-400 decoration-1">
                        {item.originalText}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-700 block mb-0.5 uppercase tracking-wider">
                        Version corrigée
                      </span>
                      <p className="text-slate-900 font-semibold whitespace-pre-wrap">
                        {item.correctedText}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-800 font-medium whitespace-pre-wrap">
                    {item.correctedText}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
