import { SrtCue, SrtMetaStats } from "../types";

/**
 * Parses raw SRT content into an array of SrtCue objects.
 * Robust against varied line-endings (CRLF / LF) and spaces.
 */
export function parseSrt(rawContent: string): SrtCue[] {
  if (!rawContent || !rawContent.trim()) return [];

  // Normalize line breaks
  const normalized = rawContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.trim().split(/\n\s*\n/);
  const cues: SrtCue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    // Line 1 might be cue ID or timestamp if ID was omitted
    let id = cues.length + 1;
    let timeIndex = 0;

    const parsedId = parseInt(lines[0].trim(), 10);
    if (!isNaN(parsedId) && lines[1] && lines[1].includes("-->")) {
      id = parsedId;
      timeIndex = 1;
    } else if (lines[0].includes("-->")) {
      timeIndex = 0;
    } else {
      continue;
    }

    const timeLine = lines[timeIndex];
    const match = timeLine.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
    if (!match) continue;

    const start = match[1].replace(".", ",");
    const end = match[2].replace(".", ",");
    const textLines = lines.slice(timeIndex + 1);
    const text = textLines.join("\n").trim();

    cues.push({
      id,
      start,
      end,
      text,
    });
  }

  return cues;
}

/**
 * Converts array of cues back to standard valid SRT text.
 */
export function formatSrt(cues: SrtCue[]): string {
  return cues
    .map((cue, idx) => {
      return `${idx + 1}\n${cue.start} --> ${cue.end}\n${cue.text}`;
    })
    .join("\n\n");
}

/**
 * Extracts all plain speech text from SRT for word count and reading.
 */
export function extractPlainText(cues: SrtCue[]): string {
  return cues
    .map((c) => c.text.replace(/<[^>]*>/g, "").trim())
    .filter(Boolean)
    .join(" ");
}

/**
 * Parses timestamp string HH:MM:SS,mmm to total seconds.
 */
function timestampToSeconds(ts: string): number {
  const parts = ts.split(":");
  if (parts.length < 3) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const secParts = parts[2].split(/[,.]/);
  const seconds = parseInt(secParts[0], 10) || 0;
  const millis = parseInt(secParts[1], 10) || 0;

  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

/**
 * Calculates subtitle metadata and reading metrics.
 */
export function calculateSrtStats(cues: SrtCue[]): SrtMetaStats {
  if (cues.length === 0) {
    return {
      cueCount: 0,
      durationFormatted: "00:00",
      wordCount: 0,
      charCount: 0,
    };
  }

  const lastCue = cues[cues.length - 1];
  const totalSeconds = timestampToSeconds(lastCue.end);

  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const durationFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  const fullText = extractPlainText(cues);
  const words = fullText.split(/\s+/).filter(Boolean);

  return {
    cueCount: cues.length,
    durationFormatted,
    wordCount: words.length,
    charCount: fullText.length,
  };
}

/**
 * Downloads a string as a clean `.srt` file.
 */
export function downloadSrtFile(content: string, filename: string = "sous-titres-corriges.srt") {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".srt") ? filename : `${filename}.srt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
