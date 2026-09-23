import React, { useState } from "react";
import { Header } from "./components/Header";
import { SrtDropzone } from "./components/SrtDropzone";
import { ResultsContainer } from "./components/ResultsContainer";
import { SrtCue, SrtMetaStats, SrtProcessResult } from "./types";
import { parseSrt, calculateSrtStats } from "./utils/srtParser";
import { 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  FileCheck2, 
  HelpCircle,
  RefreshCw
} from "lucide-react";

export default function App() {
  const [rawSrt, setRawSrt] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [cues, setCues] = useState<SrtCue[]>([]);
  const [stats, setStats] = useState<SrtMetaStats>({
    cueCount: 0,
    durationFormatted: "00:00",
    wordCount: 0,
    charCount: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SrtProcessResult | null>(null);
  const [correctedCues, setCorrectedCues] = useState<SrtCue[]>([]);

  const handleSrtLoaded = (content: string, name: string) => {
    try {
      const parsed = parseSrt(content);
      if (parsed.length === 0) {
        setErrorMessage("Le fichier ne contient aucun timecode SRT reconnaissable.");
        return;
      }

      const calculatedStats = calculateSrtStats(parsed);
      setRawSrt(content);
      setFileName(name);
      setCues(parsed);
      setStats(calculatedStats);
      setErrorMessage(null);
      setResult(null);
      setCorrectedCues([]);
    } catch (err: any) {
      setErrorMessage("Erreur lors de l'analyse du fichier SRT.");
    }
  };

  const handleClear = () => {
    setRawSrt("");
    setFileName("");
    setCues([]);
    setStats({
      cueCount: 0,
      durationFormatted: "00:00",
      wordCount: 0,
      charCount: 0,
    });
    setResult(null);
    setCorrectedCues([]);
    setErrorMessage(null);
  };

  const handleProcess = async (customStyle?: string) => {
    if (!rawSrt.trim()) {
      setErrorMessage("Veuillez charger un fichier SRT avant de lancer l'analyse.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/process-srt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          srtContent: rawSrt,
          customStyle,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Une erreur est survenue lors du traitement.");
      }

      const processData: SrtProcessResult = json.data;
      setResult(processData);

      // Parse the corrected SRT into cues
      const parsedCorrected = parseSrt(processData.correctedSrt);
      setCorrectedCues(parsedCorrected.length > 0 ? parsedCorrected : cues);

      // Scroll smoothly down to results container
      setTimeout(() => {
        document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || "Impossible de joindre le service de correction. Vérifiez votre connexion."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const [isRerollingTitles, setIsRerollingTitles] = useState(false);
  const [isRerollingDescriptions, setIsRerollingDescriptions] = useState(false);

  const handleRerollTitles = async () => {
    if (!result) return;
    setIsRerollingTitles(true);
    try {
      const response = await fetch("/api/reroll-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          srtContent: result.correctedSrt || rawSrt,
          summary: result.summary,
          keyTopics: result.keyTopics,
          existingTitles: result.titles.map((t) => t.title),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Impossible de régénérer les titres.");
      }
      setResult((prev) => (prev ? { ...prev, titles: data.titles } : prev));
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Erreur lors du reroll des titres.");
    } finally {
      setIsRerollingTitles(false);
    }
  };

  const handleRerollDescriptions = async () => {
    if (!result) return;
    setIsRerollingDescriptions(true);
    try {
      const response = await fetch("/api/reroll-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          srtContent: result.correctedSrt || rawSrt,
          summary: result.summary,
          keyTopics: result.keyTopics,
          existingDescriptions: result.facebookDescriptions?.map((d) => d.text) || [result.facebookDescription],
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Impossible de régénérer les descriptions.");
      }
      setResult((prev) =>
        prev
          ? {
              ...prev,
              facebookDescriptions: data.facebookDescriptions,
              facebookDescription: data.facebookDescriptions[0]?.text || prev.facebookDescription,
            }
          : prev
      );
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Erreur lors du reroll des descriptions.");
    } finally {
      setIsRerollingDescriptions(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Intro banner */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Nettoyez vos sous-titres & Boostez vos vidéos
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Téléversez votre fichier <span className="font-semibold text-slate-900">.srt</span> : l'IA corrige l'orthographe et la grammaire sans décaler aucun timecode, puis vous propose des titres accrocheurs et une description Facebook prête à poster.
          </p>
        </div>

        {/* Upload and input section */}
        <section id="upload-section">
          <SrtDropzone
            cues={cues}
            stats={stats}
            fileName={fileName}
            rawSrt={rawSrt}
            isLoading={isLoading}
            onSrtLoaded={handleSrtLoaded}
            onClear={handleClear}
            onSubmit={handleProcess}
          />
        </section>

        {/* Loading state indicator */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-indigo-100 p-8 text-center shadow-sm space-y-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Analyse linguistique et génération en cours...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Vérification des accords, correction des fautes d'orthographe, conservation des timecodes, réflexion sur les titres percutants et rédaction de la description Facebook SEO.
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-900">Anomalie temporaire :</p>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            {rawSrt && (
              <button
                type="button"
                id="btn-retry-process"
                onClick={() => handleProcess()}
                disabled={isLoading}
                className="self-start sm:self-auto flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition active:scale-95 shadow-xs whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Réessayer maintenant</span>
              </button>
            )}
          </div>
        )}

        {/* Results section */}
        {result && (
          <section id="results-section" className="scroll-mt-20">
            <ResultsContainer
              originalCues={cues}
              correctedCues={correctedCues}
              result={result}
              stats={stats}
              fileName={fileName}
              onRerollTitles={handleRerollTitles}
              isRerollingTitles={isRerollingTitles}
              onRerollDescriptions={handleRerollDescriptions}
              isRerollingDescriptions={isRerollingDescriptions}
            />
          </section>
        )}

        {/* How it works guidance */}
        {!result && !isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs mb-2.5">
                1
              </div>
              <h4 className="text-xs font-bold text-slate-800 mb-1">
                Timecodes 100% intacts
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Les sous-titres sont synchronisés exactement avec votre vidéo. Seul le texte est révisé et corrigé.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs mb-2.5">
                2
              </div>
              <h4 className="text-xs font-bold text-slate-800 mb-1">
                Titres à fort taux de clic
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                L'IA analyse le contenu réel de votre intervention pour créer des angles percutants (intrigue, bénéfice, question choc).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs mb-2.5">
                3
              </div>
              <h4 className="text-xs font-bold text-slate-800 mb-1">
                Optimisé Facebook SEO
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Une description courte de 1 à 2 phrases intégrant les mots-clés stratégiques et hashtags sans être tronquée.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>Correcteur SRT & Générateur de Titres Vidéo • Powered by Google Gemini</p>
      </footer>
    </div>
  );
}
