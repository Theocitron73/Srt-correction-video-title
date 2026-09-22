import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy initialization of Gemini client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", hasApiKey: !!process.env.GEMINI_API_KEY });
});

// Process SRT endpoint
app.post("/api/process-srt", async (req, res) => {
  try {
    const { srtContent, customStyle } = req.body;

    if (!srtContent || typeof srtContent !== "string" || !srtContent.trim()) {
      return res.status(400).json({ error: "Le contenu du fichier SRT est vide ou invalide." });
    }

    const ai = getGenAI();

    const systemPrompt = `Tu es un expert linguiste francophone, relecteur professionnel et spécialiste en copywriting vidéo et SEO sur les réseaux sociaux.
L'utilisateur te fournit un fichier de sous-titres au format SRT standard.

Tes 3 missions absolues :
1. CORRECTION DU FICHIER SRT :
- Corrige méticuleusement toutes les fautes d'orthographe, de grammaire, d'accords (participes passés, pluriels), de ponctuation, d'apostrophes et de typographie française.
- RESPECTE STRICTEMENT LA STRUCTURE SRT : conserve exactement les mêmes index numériques (1, 2, 3...) et les mêmes timecodes à la milliseconde près (HH:MM:SS,mmm --> HH:MM:SS,mmm). Ne fusionne ni ne supprime aucun timecode sauf si une réplique était vide.
- Conserve le ton oral d'origine sans dénaturer le sens, mais avec une orthographe et une grammaire irréprochables.
- Relève les principales corrections notables effectuées (jusqu'à 10-15 exemples marquants de fautes corrigées).

2. IDÉES DE TITRES ACCROCHEURS :
- En te basant sur le texte et le message clé extrait du fichier SRT, propose 5 à 6 titres de vidéo percutants, modernes et accrocheurs (formats variés : Curiosité / Intrigue, Bénéfice direct, Question percutante, Contre-intuitif / Révélation, Format court / Réseaux sociaux).
- Chaque titre doit susciter le clic sans faire de fausse promesse (bon équilibre click-worthy et crédibilité).

3. DESCRIPTION FACEBOOK OPTIMISÉE SEO :
- Rédige une description pour Facebook d'exactement 1 ou 2 phrases concises, rythmées et très captivantes.
- Cette description doit comporter les mots-clés clés pour le SEO naturel et le moteur de recherche interne de Facebook, inciter au visionnage/partage, et se terminer par 3 à 5 hashtags ciblés.
- Assure-toi que la description fasse réellement 1 ou 2 phrases percutantes (pas un long pavé).`;

    const userPrompt = `Voici le contenu du fichier SRT à analyser et corriger :
\`\`\`srt
${srtContent.trim()}
\`\`\`

${customStyle ? `Consigne additionnelle de style ou de ton : ${customStyle}` : ""}`;

    const generatePayload = {
      contents: [{ text: userPrompt }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctedSrt: {
              type: Type.STRING,
              description: "Le fichier SRT complet corrigé avec timestamps préservés exactement à l'identique.",
            },
            titles: {
              type: Type.ARRAY,
              description: "5 à 6 propositions de titres de vidéos percutants",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Le titre proposé" },
                  hookType: { type: Type.STRING, description: "Le type d'accroche (ex: Curiosité, Promesse directe, Question choc, Révélation)" },
                  explanation: { type: Type.STRING, description: "Brève explication de pourquoi ce titre fonctionne" }
                },
                required: ["title", "hookType"]
              }
            },
            facebookDescription: {
              type: Type.STRING,
              description: "La description Facebook de 1 ou 2 phrases optimisée pour le SEO avec quelques hashtags pertinents",
            },
            summary: {
              type: Type.STRING,
              description: "Résumé concis en 1-2 phrases du contenu de la vidéo",
            },
            keyTopics: {
              type: Type.ARRAY,
              description: "3 à 6 thématiques ou mots-clés principaux extraits du texte",
              items: { type: Type.STRING }
            },
            correctionsSample: {
              type: Type.ARRAY,
              description: "Exemples de fautes corrigées avec l'avant et l'après",
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING, description: "Texte avec la faute" },
                  corrected: { type: Type.STRING, description: "Texte corrigé" },
                  explanation: { type: Type.STRING, description: "Explication de la règle ou de la correction" }
                },
                required: ["original", "corrected"]
              }
            },
            stats: {
              type: Type.OBJECT,
              properties: {
                estimatedErrorsFixed: { type: Type.INTEGER, description: "Nombre estimé de fautes corrigées" }
              }
            }
          },
          required: ["correctedSrt", "titles", "facebookDescription", "summary"]
        }
      }
    };

    // Resilient call with retries and fallback models
    const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let lastError: any = null;
    let response: any = null;

    for (const modelName of candidateModels) {
      // Up to 2 attempts per model
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            ...generatePayload,
          });
          if (response && response.text) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Attempt ${attempt} on model ${modelName} failed:`, err?.message || err);
          const errStr = String(err?.message || err);
          const isOverloaded = errStr.includes("503") || errStr.includes("UNAVAILABLE") || errStr.includes("429") || errStr.includes("high demand");
          if (isOverloaded && attempt < 2) {
            // Wait 1.2s before retry
            await new Promise((resolve) => setTimeout(resolve, 1200));
          } else {
            // Move to next candidate model
            break;
          }
        }
      }

      if (response && response.text) {
        break;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Le modèle IA est momentanément indisponible en raison d'une forte affluence. Veuillez réessayer.");
    }

    const outputText = response.text;
    const parsedData = JSON.parse(outputText);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error processing SRT:", error);
    let errorMessage = error?.message || "Une erreur est survenue lors du traitement du fichier SRT.";
    
    // Clean up raw JSON error messages if any
    if (errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("high demand")) {
      errorMessage = "Le service d'intelligence artificielle subit une forte affluence temporaire. Veuillez cliquer sur 'Réessayer' dans quelques secondes.";
    } else if (errorMessage.includes("429")) {
      errorMessage = "Trop de requêtes simultanées. Veuillez patienter quelques secondes avant de relancer.";
    }

    return res.status(500).json({ error: errorMessage });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
