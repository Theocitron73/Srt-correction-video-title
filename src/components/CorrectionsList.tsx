import React from "react";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { CorrectionItem } from "../types";

interface CorrectionsListProps {
  corrections?: CorrectionItem[];
  estimatedCount?: number;
}

export const CorrectionsList: React.FC<CorrectionsListProps> = ({
  corrections = [],
  estimatedCount,
}) => {
  if (!corrections || corrections.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
        <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
        <p className="font-semibold text-slate-700">Aucune faute majeure détectée ou texte déjà impeccable !</p>
        <p className="text-[11px] text-slate-500 mt-0.5">Le fichier respecte les règles d'orthographe et de grammaire.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <span className="font-semibold text-slate-800">
          Exemples de corrections orthographiques et grammaticales notables :
        </span>
        {estimatedCount !== undefined && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
            ~{estimatedCount} correction(s) au total
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
        {corrections.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-medium line-through">
                  {item.original}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                  {item.corrected}
                </span>
              </div>
            </div>

            {item.explanation && (
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                {item.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
