export enum ProcessStatus {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface SubtitleResult {
  fileName: string;
  content: string;
  language: string;
  source?: 'AI' | 'TheSubDB' | 'OpenSubtitles';
}

export interface VideoMetadata {
  name: string;
  size: number;
  type: string;
  url: string;
}
