import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    [key: string]: any;
  };
  file_info?: {
    filename: string;
    content_type?: string;
    size_bytes?: number;
    [key: string]: any;
  };
}

export interface ForensicsData {
  heatmap?: string;
  noisemap?: string;
  spectrogram?: string;
  waveform?: string;
  suspicious_frames?: SuspiciousFrame[];
  frame_confidence_timeline?: { frame: number; timestamp: number; confidence: number; verdict: string }[];
  annotated_video?: string;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const detectMedia = async (file: File): Promise<DetectionResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<DetectionResponse>("/detect/auto", formData);
    return response.data;
  } catch (error: any) {
    console.error("Detection API Error: ", error);
    if (error.response && error.response.data) {
        throw new Error(error.response.data.detail || "An error occurred during detection");
    }
    throw new Error(error.message || "Failed to connect to the detection server.");
  }
};

export const getHeatmap = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/detect/heatmap", formData);
    return response.data.heatmap || null;
  } catch (error: any) {
    console.error("Heatmap API Error: ", error);
    return null;
  }
};

export const getForensics = async (file: File): Promise<ForensicsData> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/detect/forensics", formData);
    return response.data.forensics || {};
  } catch (error: any) {
    console.error("Forensics API Error: ", error);
    return {};
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
  return `${API_BASE_URL}${downloadPath}`;
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
  [key: string]: any;
}

export interface BatchResponse {
  summary: BatchSummary;
  results: BatchResultItem[];
}

export const detectBatch = async (files: File[]): Promise<BatchResponse> => {
  try {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    const response = await apiClient.post<BatchResponse>("/detect/batch", formData);
    return response.data;
  } catch (error: any) {
    console.error("Batch Detection API Error: ", error);
    if (error.response && error.response.data) {
        throw new Error(error.response.data.detail || "An error occurred during batch detection");
    }
    throw new Error(error.message || "Failed to connect to the detection server.");
  }
};
