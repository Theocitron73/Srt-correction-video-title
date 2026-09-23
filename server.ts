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

// Helper for resilient Gemini calls with retry and model fallback
async function callGeminiResilient(ai: any, payload: any): Promise<any> {
  const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;
  let response: any = null;

  for (const modelName of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          ...payload,
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Attempt ${attempt} on model ${modelName} failed:`, err?.message || err);
        const errStr = String(err?.message || err);
        const isOverloaded =
          errStr.includes("503") ||
          errStr.includes("UNAVAILABLE") ||
          errStr.includes("429") ||
          errStr.includes("high demand");
        if (isOverloaded && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        } else {
          break;
        }
      }
    }
    if (response && response.text) {
      break;
    }
  }

  if (!response || !response.text) {
    throw (
      lastError ||
      new Error("Le modèle IA est momentanément indisponible en raison d'une forte affluence. Veuillez réessayer.")
    );
  }

  return JSON.parse(response.text);
}

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

2. 6 IDÉES DE TITRES ACCROCHEURS SUR DES TONS DISTINCTS :
Propose exactement 6 titres percutants, chacun incarnant un ton / angle d'accroche bien différent :
- Ton 1 : Curiosité & Intrigue (susciter un fort questionnement ou mystère)
- Ton 2 : Bénéfice direct & Pratique (promesse claire et utilité immédiate)
- Ton 3 : Contre-intuitif & Révélation (bousculer une idée reçue ou révéler une vérité)
- Ton 4 : Storytelling & Émotionnel (dimension humaine, vécu ou anecdote captivante)
- Ton 5 : Court & Punchline (moins de 50 caractères, rythmé, impactant)
- Ton 6 : Humoristique & Second degré (ton décalé, autodérision ou clin d'œil complice adapté au sujet de la vidéo)

3. 5 À 6 DESCRIPTIONS FACEBOOK OPTIMISÉES SEO SUR DES TONS DIFFÉRENTS :
Propose 5 à 6 versions de descriptions Facebook prêtes à publier.
Chaque description doit :
- Faire STRICTEMENT 1 ou 2 phrases concises (pas de pavé long pour ne pas être coupé sur mobile).
- Adopter un ton bien typé :
  * Option 1 : Storytelling & Émotionnel
  * Option 2 : Court & Percutant (Punchline directe)
  * Option 3 : Éducatif & Bénéfice direct
  * Option 4 : Curiosité & Intrigue
  * Option 5 : Humoristique & Second degré (accroche amusante, ironie bienveillante ou autodérision tirée de la situation)
  * Option 6 : Engageant & Communautaire (question ouverte incitant au commentaire et au partage)
- Intégrer les mots-clés stratégiques pour le SEO Facebook naturel et se terminer par 3 à 5 hashtags ciblés.`;

    const userPrompt = `Voici le contenu du fichier SRT à analyser et corriger :
\`\`\`srt
${srtContent.trim()}
\`\`\`

${customStyle ? `Consigne additionnelle de style ou de ton : ${customStyle}` : ""}`;

    const generatePayload = {
      contents: [{ text: userPrompt }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.35,
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
              description: "6 propositions de titres de vidéos percutants sur 6 tons différents",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Le titre proposé" },
                  hookType: { type: Type.STRING, description: "Le ton ou type d'accroche (Curiosité & Intrigue, Bénéfice direct, Contre-intuitif & Révélation, Storytelling & Émotionnel, Court & Punchline, Humoristique & Second degré)" },
                  explanation: { type: Type.STRING, description: "Brève explication de pourquoi ce titre fonctionne" }
                },
                required: ["title", "hookType"]
              }
            },
            facebookDescriptions: {
              type: Type.ARRAY,
              description: "5 à 6 propositions de descriptions Facebook de 1 ou 2 phrases sur des tons différents avec hashtags",
              items: {
                type: Type.OBJECT,
                properties: {
                  tone: { type: Type.STRING, description: "Le ton (Storytelling & Émotionnel, Court & Percutant, Éducatif & Bénéfice direct, Curiosité & Intrigue, Humoristique & Second degré, Engageant & Communautaire)" },
                  text: { type: Type.STRING, description: "La description exacte d'une ou deux phrases avec 3-5 hashtags" },
                  explanation: { type: Type.STRING, description: "Brève explication de l'angle éditorial" }
                },
                required: ["tone", "text"]
              }
            },
            facebookDescription: {
              type: Type.STRING,
              description: "La description Facebook principale (version sélectionnée par défaut)",
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
          required: ["correctedSrt", "titles", "summary"]
        }
      }
    };

    const parsedData = await callGeminiResilient(ai, generatePayload);

    // Ensure fallback if facebookDescription or facebookDescriptions is missing
    if (!parsedData.facebookDescriptions || parsedData.facebookDescriptions.length === 0) {
      if (parsedData.facebookDescription) {
        parsedData.facebookDescriptions = [
          {
            tone: "Éducatif & Bénéfice direct",
            text: parsedData.facebookDescription,
            explanation: "Format optimisé SEO pour le fil d'actualité",
          },
        ];
      }
    }
    if (!parsedData.facebookDescription && parsedData.facebookDescriptions?.[0]?.text) {
      parsedData.facebookDescription = parsedData.facebookDescriptions[0].text;
    }

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error processing SRT:", error);
    let errorMessage = error?.message || "Une erreur est survenue lors du traitement du fichier SRT.";
    if (errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("high demand")) {
      errorMessage = "Le service d'intelligence artificielle subit une forte affluence temporaire. Veuillez cliquer sur 'Réessayer' dans quelques secondes.";
    } else if (errorMessage.includes("429")) {
      errorMessage = "Trop de requêtes simultanées. Veuillez patienter quelques secondes avant de relancer.";
    }
    return res.status(500).json({ error: errorMessage });
  }
});

// Reroll Titles endpoint
app.post("/api/reroll-titles", async (req, res) => {
  try {
    const { srtContent, summary, keyTopics, existingTitles, customStyle } = req.body;

    if (!srtContent && !summary) {
      return res.status(400).json({ error: "Contenu manquant pour régénérer les titres." });
    }

    const ai = getGenAI();

    const systemPrompt = `Tu es un expert en copywriting vidéo viral et accroches YouTube/Facebook/TikTok.
Ta mission : proposer 6 NOUVELLES idées de titres de vidéos ultra-percutants basés sur le contenu.

Chaque titre doit incarner un ton / angle bien distinct :
1. Curiosité & Intrigue (ouvrir une boucle de curiosité irrésistible)
2. Bénéfice direct & Pratique (résultat concret et promesse immédiate)
3. Contre-intuitif & Révélation (casser un mythe ou annoncer une vérité inattendue)
4. Storytelling & Émotionnel (dimension narrative et humaine forte)
5. Format court & Punchline (percutant, direct, moins de 50 caractères)
6. Humoristique & Second degré (clin d'œil complice, dérision ou formule souriante)

RÈGLE IMPÉRATIVE : Tu ne dois ABSOLUMENT PAS répéter ou paraphraser de trop près les titres déjà existants suivants :
${Array.isArray(existingTitles) && existingTitles.length > 0 ? existingTitles.map((t) => `- "${t}"`).join("\n") : "Aucun"}`;

    const contextText = summary ? `Résumé du contenu : ${summary}\nMots-clés : ${(keyTopics || []).join(", ")}` : srtContent.slice(0, 3000);
    const userPrompt = `Génère 6 nouveaux titres originaux sur 6 tons différents pour ce contenu :
${contextText}

${customStyle ? `Style ou consigne complémentaire : ${customStyle}` : ""}`;

    const payload = {
      contents: [{ text: userPrompt }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7, // Higher temperature for more creative variety
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              description: "6 nouveaux titres de vidéos sur des tons variés dont humoristique",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Le titre proposé" },
                  hookType: { type: Type.STRING, description: "Le ton / type d'accroche (ex: Curiosité & Intrigue, Bénéfice direct, Contre-intuitif & Révélation, Storytelling & Émotionnel, Court & Punchline, Humoristique & Second degré)" },
                  explanation: { type: Type.STRING, description: "Brève explication de pourquoi ce titre fonctionne" }
                },
                required: ["title", "hookType"]
              }
            }
          },
          required: ["titles"]
        }
      }
    };

    const parsedData = await callGeminiResilient(ai, payload);
    return res.json({ success: true, titles: parsedData.titles });
  } catch (error: any) {
    console.error("Error rerolling titles:", error);
    return res.status(500).json({ error: error?.message || "Erreur lors de la régénération des titres." });
  }
});

// Reroll Facebook Descriptions endpoint
app.post("/api/reroll-descriptions", async (req, res) => {
  try {
    const { srtContent, summary, keyTopics, existingDescriptions, customStyle } = req.body;

    if (!srtContent && !summary) {
      return res.status(400).json({ error: "Contenu manquant pour régénérer les descriptions." });
    }

    const ai = getGenAI();

    const systemPrompt = `Tu es un expert en copywriting pour les réseaux sociaux et SEO Facebook.
Ta mission : proposer 5 à 6 NOUVELLES descriptions Facebook prêtes à publier basées sur le sujet de la vidéo.

Chaque description doit :
1. Faire EXACTEMENT 1 ou 2 phrases concises et captivantes (format court idéal pour le fil Facebook sans être tronqué).
2. Adopter un angle / ton bien distinct :
   - Ton 1 : Storytelling & Émotionnel (humaniser le message)
   - Ton 2 : Court & Percutant (Punchline directe)
   - Ton 3 : Éducatif & Bénéfice direct (ce que la personne apprend immédiatement)
   - Ton 4 : Curiosité & Intrigue (donner envie d'avoir la réponse dans la vidéo)
   - Ton 5 : Humoristique & Second degré (accroche drôle, autodérision ou situation cocasse tirée de la vidéo)
   - Ton 6 : Engageant & Communautaire (interpellation ou question ouverte incitant aux réactions et partages)
3. Intégrer les mots-clés du sujet pour le référencement naturel et se terminer par 3 à 5 hashtags pertinents.

RÈGLE IMPÉRATIVE : Ne reprends pas les descriptions déjà proposées suivantes :
${Array.isArray(existingDescriptions) && existingDescriptions.length > 0 ? existingDescriptions.map((d) => `- "${d}"`).join("\n") : "Aucune"}`;

    const contextText = summary ? `Résumé du sujet : ${summary}\nMots-clés : ${(keyTopics || []).join(", ")}` : srtContent.slice(0, 3000);
    const userPrompt = `Génère 5 à 6 nouvelles descriptions Facebook distinctes (1-2 phrases + hashtags) sur des tons variés dont humoristique pour ce contenu :
${contextText}

${customStyle ? `Consigne additionnelle : ${customStyle}` : ""}`;

    const payload = {
      contents: [{ text: userPrompt }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            facebookDescriptions: {
              type: Type.ARRAY,
              description: "5 à 6 propositions de descriptions Facebook de 1 ou 2 phrases sur des tons différents avec hashtags",
              items: {
                type: Type.OBJECT,
                properties: {
                  tone: { type: Type.STRING, description: "Nom du ton (Storytelling & Émotionnel, Court & Percutant, Éducatif & Bénéfice direct, Curiosité & Intrigue, Humoristique & Second degré, Engageant & Communautaire)" },
                  text: { type: Type.STRING, description: "Texte complet d'1 ou 2 phrases avec hashtags" },
                  explanation: { type: Type.STRING, description: "Brève explication de l'angle" }
                },
                required: ["tone", "text"]
              }
            }
          },
          required: ["facebookDescriptions"]
        }
      }
    };

    const parsedData = await callGeminiResilient(ai, payload);
    return res.json({ success: true, facebookDescriptions: parsedData.facebookDescriptions });
  } catch (error: any) {
    console.error("Error rerolling descriptions:", error);
    return res.status(500).json({ error: error?.message || "Erreur lors de la régénération des descriptions." });
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
