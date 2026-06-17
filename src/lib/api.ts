import axios from "axios";

const API_BASE_URL = "/api";

export interface AiInsight {
  category: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface AiInsightsData {
  ai_insights: AiInsight[];
  anomaly_score: number;
  risk_level: string;
  summary: string;
}

export interface SuspiciousFrame {
  frame_index: number;
  timestamp: number;
  confidence: number;
  verdict: string;
  image: string;
  heatmap: string | null;
}

export interface DetectionResponse {
  media_type: "image" | "video" | "audio" | "metadata" | "unknown";
  verdict: "AUTHENTIC" | "SUSPICIOUS" | "DEEPFAKE" | "ERROR";
  confidence: number;
  details: {
    detection?: {
      label: string;
      probs: { [key: string]: number };
      models_used: string[];
      face_detected: boolean;
      ela_score: number;
      analysis: string[];
    };
    metadata?: {
      has_exif: boolean;
      risk_score: number;
      ai_indicators: string[];
      details: string[];
      exif_data?: { [key: string]: string };
    };
    frame_results?: SuspiciousFrame[];
    analysis?: string[];
    ai_insights?: AiInsightsData;
    [key: string]: unknown;
  };
  file_info?: {
    filename: string;
    content_type?: string;
    size_bytes?: number;
    [key: string]: unknown;
  };
  forensics?: ForensicsData;
}

export interface ForensicsData {
  heatmap?: string;
  noisemap?: string;
  spectrogram?: string;
  audio_spectrogram?: string;
  waveform?: string;
  suspicious_frames?: SuspiciousFrame[];
  frame_confidence_timeline?: { frame: number; timestamp: number; confidence: number; verdict: string }[];
  annotated_video?: string;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const detectMedia = async (file: File, signal?: AbortSignal): Promise<DetectionResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<DetectionResponse>("/detect/full", formData, {
      ...(signal && { signal: signal as any }),
      timeout: 120000,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("API Error: ", error);
    if (axios.isAxiosError(error) && error.response && error.response.data) {
        throw new Error((error.response.data as Record<string, unknown>).detail as string || "An error occurred during detection");
    }
    const err = error as Error;
    throw new Error(err.message || "Failed to connect to the detection server.");
  }
};

export const getHeatmap = async (file: File, signal?: AbortSignal): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/detect/heatmap", formData, {
      ...(signal && { signal: signal as any }),
      timeout: 60000,
    });
    return response.data.heatmap || null;
  } catch (error: unknown) {
    console.error("Heatmap API Error: ", error);
    return null;
  }
};

export interface ReportResponse {
  report_path: string;
  download_url: string;
  report_id: string;
  verdict: string;
  confidence: number;
}

export const generateReport = async (file: File): Promise<ReportResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<ReportResponse>("/generate-report", formData, {
    timeout: 120000, // 2 minutes — report gen re-runs full pipeline + PDF
  });
  return response.data;
};

export const getReportDownloadUrl = (downloadPath: string): string => {
  let path = downloadPath;
  if (downloadPath.startsWith("http://") || downloadPath.startsWith("https://")) {
    try {
      const url = new URL(downloadPath);
      path = url.pathname + url.search;
    } catch (e) {
      // ignore
    }
  }
  return `/api/download-report?path=${encodeURIComponent(path)}`;
};

export interface BatchSummary {
  total_files: number;
  images: number;
  videos: number;
  audio: number;
  errors: number;
  deepfakes_detected: number;
  suspicious_files: number;
  authentic_files: number;
  average_confidence: number;
  average_authenticity_score: number;
  batch_verdict: string;
  total_processing_time: number;
}

export interface BatchResultItem {
  file_name: string;
  media_type: string;
  verdict: string;
  confidence: number;
  authenticity_score: number;
  risk_level: string;
  error?: string;
  [key: string]: unknown;
}

export interface BatchResponse {
  summary: BatchSummary;
  results: BatchResultItem[];
}

export const detectBatch = async (files: File[], signal?: AbortSignal): Promise<BatchResponse> => {
  try {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    const response = await apiClient.post<BatchResponse>("/detect/batch", formData, {
      ...(signal && { signal: signal as any }),
      timeout: 300000, // 5 minutes for batch
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Batch Detection API Error: ", error);
    if (axios.isAxiosError(error) && error.response && error.response.data) {
        throw new Error((error.response.data as Record<string, unknown>).detail as string || "An error occurred during batch detection");
    }
    const err = error as Error;
    throw new Error(err.message || "Failed to connect to the detection server.");
  }
};
