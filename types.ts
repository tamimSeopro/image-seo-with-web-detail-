export interface AnalysisResult {
  title: string;
  subject: string;
  rating: number; // 1 to 5
  tags: string; // The semicolon separated string
  comments: string;
  caption: string;
  alternativeText: string;
}

export interface SeoData extends AnalysisResult {
  copyright: string;
  filename: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}