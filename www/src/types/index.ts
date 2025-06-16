export interface CSVRow {
  "#": string;
  Link: string;
  Text: string;
  "OCR Output (Gemini - Flash)"?: string;
  "Word Evaluations"?: string;
  Accuracy?: string;
  "Correct Words"?: string;
  "Total Words"?: string;
  "Evaluation JSON"?: string;
  "Local Image"?: string;
  "Processing Status"?: string;
}

export interface WordEvaluation {
  reference_word: string;
  transcribed_word: string | null;
  match: boolean;
  reason_diff: string;
}

export interface EvaluationData {
  image_info: {
    number: string;
    url: string;
    reference_text: string;
    timestamp: string;
    local_image_path?: string;
  };
  evaluation: {
    full_text: string;
    word_evaluations: WordEvaluation[];
    metrics: {
      total_words: number;
      correct_words: number;
      accuracy: number;
    };
  };
}

export interface ProcessingStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  accuracy_avg: number;
}
