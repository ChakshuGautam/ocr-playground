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
  id?: number;
  evaluation_id?: number;
  reference_word: string;
  transcribed_word?: string;
  match: boolean;
  reason_diff: string;
  word_position?: number;
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

export enum ProcessingStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCESS = "success",
  FAILED = "failed",
}

export enum DatasetStatus {
  DRAFT = "draft",
  VALIDATED = "validated",
  ARCHIVED = "archived",
}

export enum PromptStatus {
  DRAFT = "draft",
  STAGING = "staging",
  PRODUCTION = "production",
  ARCHIVED = "archived",
}

export enum VersionType {
  MAJOR = "major",
  MINOR = "minor",
  PATCH = "patch",
}

export interface Image {
  id: number;
  number: string;
  url: string;
  local_path?: string;
  reference_text: string;
  created_at: string;
  updated_at: string;
}

export interface ImageWithEvaluations extends Image {
  evaluations: Evaluation[];
}

export interface Evaluation {
  id: number;
  image_id: number;
  evaluation_run_id?: number;
  prompt_version: string;
  ocr_output?: string;
  accuracy?: number;
  correct_words?: number;
  total_words?: number;
  processing_status: ProcessingStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
  progress_percentage: number;
  current_step?: string;
  estimated_completion?: string;
  latency_ms?: number;
  cost_estimate?: number;
}

export interface EvaluationWithDetails extends Evaluation {
  image: Image;
  word_evaluations: WordEvaluation[];
}

export interface Dataset {
  id: number;
  name: string;
  description?: string;
  status: DatasetStatus;
  image_count: number;
  created_at: string;
  updated_at: string;
  last_used?: string;
}

export interface DatasetWithImages extends Dataset {
  images: Image[];
}

export interface DatasetCreate {
  name: string;
  description?: string;
  status?: DatasetStatus;
}

export interface PromptFamily {
  id: number;
  name: string;
  description?: string;
  tags: string[];
  production_version?: string;
  created_at: string;
}

export interface PromptVersion {
  id: number;
  family_id: number;
  version: string;
  prompt_text: string;
  changelog_message: string;
  status: PromptStatus;
  author?: string;
  created_at: string;
  last_evaluation_accuracy?: number;
}

export interface PromptFamilyWithVersions extends PromptFamily {
  versions: PromptVersion[];
}

export interface PromptVersionCreate {
  family_id: number;
  prompt_text: string;
  changelog_message: string;
  version_type: VersionType;
  status?: PromptStatus;
}

export interface PromptConfiguration {
  label: string;
  family_id: number;
  version: string;
}

export interface EvaluationRun {
  id: number;
  name: string;
  description?: string;
  hypothesis: string;
  dataset_ids: number[];
  status: ProcessingStatus;
  progress_percentage: number;
  current_step?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface EvaluationRunCreate {
  name: string;
  description?: string;
  hypothesis: string;
  dataset_ids: number[];
  prompt_configurations: PromptConfiguration[];
}

export interface EvaluationRunWithDetails extends EvaluationRun {
  datasets: Dataset[];
  prompt_configurations: PromptConfiguration[];
  evaluations: Evaluation[];
  comparison_results?: ComparisonResults;
}

export interface WordLevelComparison {
  image_filename: string;
  word_index: number;
  reference_word: string;
  control_output?: string;
  variation_output?: string;
  status: "improved" | "regression" | "match" | "mismatch";
  error_type?: string;
}

export interface ComparisonSummary {
  prompt_version: string;
  label: string;
  overall_accuracy: number;
  character_error_rate: number;
  avg_latency_ms: number;
  estimated_cost_per_1k: number;
  error_breakdown: Record<string, number>;
}

export interface ComparisonResults {
  evaluation_run_id: number;
  summary_metrics: ComparisonSummary[];
  word_comparisons: WordLevelComparison[];
  winner?: string;
  confidence_level?: number;
}

export interface EvaluationProgress {
  evaluation_id: number;
  processing_status: ProcessingStatus;
  progress_percentage: number;
  current_step?: string;
  estimated_completion?: string;
  created_at: string;
  updated_at: string;
}

export interface LiveProgressUpdate {
  evaluation_run_id: number;
  overall_progress: number;
  prompt_progress: Record<string, number>;
  current_image?: string;
  log_entries: string[];
}

export interface TrendDataPoint {
  evaluation_run_id: number;
  timestamp: string;
  accuracy: number;
  dataset_name: string;
}

export interface RegressionAlert {
  detected_at: string;
  threshold_crossed: number;
  previous_average: number;
  current_average: number;
  severity: "warning" | "critical";
}

export interface PerformanceTrend {
  prompt_version: string;
  data_points: TrendDataPoint[];
  moving_average: number[];
  regression_alerts: RegressionAlert[];
}

export interface APIKey {
  id: number;
  key_name: string;
  key_preview: string;
  created_at: string;
  last_used?: string;
  usage_count: number;
  is_active: boolean;
  actual_key?: string;
}

export interface APIUsageStats {
  api_key_id: number;
  total_calls: number;
  calls_today: number;
  calls_this_month: number;
  error_rate: number;
  avg_response_time_ms: number;
}

export interface DashboardStats {
  total_images: number;
  total_evaluations: number;
  pending_evaluations: number;
  successful_evaluations: number;
  failed_evaluations: number;
  average_accuracy?: number;
  accuracy_by_prompt_version: Record<string, number>;
}

export interface AccuracyDistribution {
  high_accuracy: number;
  medium_accuracy: number;
  low_accuracy: number;
  total_processed: number;
}

export interface PaginationParams {
  skip: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface ImageFilter {
  has_evaluations?: boolean;
  processing_status?: string;
  prompt_version?: string;
  accuracy_min?: number;
  accuracy_max?: number;
  created_after?: string;
  created_before?: string;
}

export interface CSVImportResponse {
  imported_count: number;
  updated_count: number;
  errors: string[];
  message: string;
}

export interface BatchProcessRequest {
  image_ids: number[];
  prompt_version: string;
  force_reprocess?: boolean;
}

export interface BatchProcessResponse {
  queued_count: number;
  message: string;
  job_id?: string;
}
