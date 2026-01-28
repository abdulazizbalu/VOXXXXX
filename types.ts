
export interface BriefingResult {
  transcription: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: string;
  emotions: string[];
  emotionsData: { name: string; value: number }[];
  mainThemes: string[];
}

export interface ProcessingStatus {
  step: 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'completed' | 'error';
  message: string;
}
