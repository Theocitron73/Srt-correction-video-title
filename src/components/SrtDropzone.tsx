import React, { useState, useRef, ChangeEvent, DragEvent } from "react";
import { 
  UploadCloud, 
  FileText, 
  Clock, 
  Hash, 
  Type, 
  Sparkles, 
  AlertCircle, 
  ClipboardPaste, 
  X,
  Play
} from "lucide-react";
import { SrtCue, SrtMetaStats } from "../types";
import { SAMPLE_SRT_WITH_ERRORS } from "../data/sampleSrt";

interface SrtDropzoneProps {
  cues: SrtCue[];
  stats: SrtMetaStats;
  fileName: string;
  rawSrt: string;
  isLoading: boolean;
  onSrtLoaded: (content: string, name: string) => void;
  onClear: () => void;
  onSubmit: (customStyle?: string) => void;
}

export const SrtDropzone: React.FC<SrtDropzoneProps> = ({
  cues,
  stats,
  fileName,
  rawSrt,
  isLoading,
  onSrtLoaded,
  onClear,
  onSubmit,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMessage(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".srt") && !file.name.toLowerCase().endsWith(".txt")) {
      setErrorMessage("Veuillez sélectionner un fichier .srt valide (format sous-titres SubRip).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && content.trim()) {
        onSrtLoaded(content, file.name);
      } else {
        setErrorMessage("Le fichier sélectionné semble vide.");
      }
    };
    reader.onerror = () => {
      setErrorMessage("Impossible de lire le fichier.");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleLoadSample = () => {
    setErrorMessage(null);
    onSrtLoaded(SAMPLE_SRT_WITH_ERRORS, "demo_video_avec_fautes.srt");
    setShowPasteArea(false);
  };

  const handleApplyPasted = () => {
    if (!pastedText.trim()) {
      setErrorMessage("Veuillez coller le contenu de vos sous-titres.");
      return;
    }
    setErrorMessage(null);
    onSrtLoaded(pastedText, "sous-titres-colles.srt");
    setShowPasteArea(false);
  };

  const hasFile = cues.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 transition-all">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Fichier source SRT</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Glissez votre fichier de sous-titres (.srt) ou chargez un exemple pour tester.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-load-sample"
            onClick={handleLoadSample}
            disabled={isLoading}
            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 transition-all border border-indigo-200/60"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Exemple démo (avec fautes)
          </button>

          <button
            type="button"
            id="btn-toggle-paste"
            onClick={() => setShowPasteArea(!showPasteArea)}
            disabled={isLoading}
            className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 active:scale-95 transition-all"
          >
            <ClipboardPaste className="w-3.5 h-3.5 mr-1" />
            {showPasteArea ? "Masquer saisie" : "Coller du texte"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Manual paste drawer if activated */}
      {showPasteArea && !hasFile && (
        <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Collez votre contenu SRT brut :
          </label>
          <textarea
            id="input-raw-srt-textarea"
            rows={6}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={`1\n00:00:01,000 --> 00:00:04,000\nVotre texte de sous-titre ici...`}
            className="w-full text-xs font-mono p-3 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setShowPasteArea(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
            >
              Annuler
            </button>
            <button
              type="button"
              id="btn-apply-paste"
              onClick={handleApplyPasted}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Valider ce texte
            </button>
          </div>
        </div>
      )}

      {/* Drop zone or File preview card */}
      {!hasFile ? (
        <div
          id="srt-drop-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
              : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept=".srt,.txt"
            className="hidden"
            id="srt-file-input"
          />
          <div className="w-12 h-12 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Déposez votre fichier <span className="text-indigo-600">.srt</span> ici, ou{" "}
            <span className="text-indigo-600 underline underline-offset-2">parcourez vos dossiers</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Fichiers sous-titres .srt jusqu'à 15 Mo supportés
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Loaded File Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-slate-800 truncate block">
                    {fileName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-700">
                    SRT valide
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center">
                    <Hash className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <strong>{stats.cueCount}</strong>&nbsp;répliques
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Durée :&nbsp;<strong>{stats.durationFormatted}</strong>
                  </span>
                  <span className="flex items-center">
                    <Type className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <strong>{stats.wordCount}</strong>&nbsp;mots
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/80 border border-slate-200 transition"
              >
                Changer de fichier
              </button>
              <button
                type="button"
                id="btn-clear-file"
                onClick={onClear}
                disabled={isLoading}
                title="Supprimer le fichier"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Optional Tone or Specific instructions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs">
            <span className="text-slate-600 font-medium whitespace-nowrap">
              Style souhaité pour les titres :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Dynamique & Curiosité",
                "Professionnel & Expert",
                "Éducatif / Tuto",
                "Grand public & Engageant",
              ].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setCustomStyle(customStyle === style ? "" : style)}
                  className={`px-2.5 py-1 rounded-full text-xs transition border ${
                    customStyle === style
                      ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              id="btn-process-srt"
              onClick={() => onSubmit(customStyle)}
              disabled={isLoading || !hasFile}
              className={`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm shadow-md transition-all ${
                isLoading
                  ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-500/25 active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Correction et génération en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Corriger l'orthographe & Générer les Titres / SEO</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
