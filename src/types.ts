export interface SrtCue {
  id: number;
  start: string;
  end: string;
  text: string;
}

export interface TitleIdea {
  title: string;
  hookType: string;
  explanation?: string;
}

export interface FacebookDescriptionIdea {
  tone: string;
  text: string;
  explanation?: string;
}

export interface CorrectionItem {
  original: string;
  corrected: string;
  explanation?: string;
}

export interface SrtProcessResult {
  correctedSrt: string;
  titles: TitleIdea[];
  facebookDescription: string;
  facebookDescriptions?: FacebookDescriptionIdea[];
  summary: string;
  keyTopics?: string[];
  correctionsSample?: CorrectionItem[];
  stats?: {
    estimatedErrorsFixed?: number;
  };
}

export interface SrtMetaStats {
  cueCount: number;
  durationFormatted: string;
  wordCount: number;
  charCount: number;
}
