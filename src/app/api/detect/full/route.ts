import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const filename = file?.name || "media_file.png";
    const fileType = file?.type || "image/png";

    // Determine media type
    const isVideo = fileType.startsWith("video/") || filename.endsWith(".mp4") || filename.endsWith(".avi");
    const isAudio = fileType.startsWith("audio/") || filename.endsWith(".mp3") || filename.endsWith(".wav");

    // Simulate short network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (isVideo) {
      return NextResponse.json({
        media_type: "video",
        verdict: "DEEPFAKE",
        confidence: 0.94,
        details: {
          detection: {
            label: "Temporal Manipulation Detected",
            probs: { "Real": 0.06, "Fake": 0.94 },
            models_used: ["ViT-Forensic Ensemble", "Temporal ResNet-3D"],
            face_detected: true,
            ela_score: 82.1,
            analysis: [
              "Smart Frame Sampling detected scene transitions with high anomaly metrics.",
              "Temporal inconsistency found across frame 45 to 80.",
              "Ensemble face cropping indicates localized GAN blending."
            ]
          },
          frame_results: [
            { frame_index: 24, timestamp: 1.0, confidence: 0.92, verdict: "DEEPFAKE", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=60", heatmap: null },
            { frame_index: 48, timestamp: 2.0, confidence: 0.96, verdict: "DEEPFAKE", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=60", heatmap: null },
            { frame_index: 72, timestamp: 3.0, confidence: 0.94, verdict: "DEEPFAKE", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=60", heatmap: null }
          ],
          ai_insights: {
            ai_insights: [
              { category: "Temporal", description: "Jitter and blending mismatch in nose boundary during rotation.", severity: "critical" },
              { category: "Scene", description: "Abrupt frame energy fluctuations across compression boundaries.", severity: "medium" }
            ],
            anomaly_score: 94.5,
            risk_level: "CRITICAL",
            summary: "Video demonstrates clear temporal synthetic modification with face-swapping patterns."
          }
        },
        file_info: {
          filename,
          content_type: fileType,
          size_bytes: file?.size || 4096000
        },
        forensics: {
          suspicious_frames: [
            { frame: 24, timestamp: 1.0, confidence: 0.92, verdict: "DEEPFAKE" },
            { frame: 48, timestamp: 2.0, confidence: 0.96, verdict: "DEEPFAKE" },
            { frame: 72, timestamp: 3.0, confidence: 0.94, verdict: "DEEPFAKE" }
          ],
          frame_confidence_timeline: [
            { frame: 10, timestamp: 0.4, confidence: 0.12, verdict: "AUTHENTIC" },
            { frame: 24, timestamp: 1.0, confidence: 0.92, verdict: "DEEPFAKE" },
            { frame: 35, timestamp: 1.4, confidence: 0.15, verdict: "AUTHENTIC" },
            { frame: 48, timestamp: 2.0, confidence: 0.96, verdict: "DEEPFAKE" },
            { frame: 60, timestamp: 2.5, confidence: 0.18, verdict: "AUTHENTIC" },
            { frame: 72, timestamp: 3.0, confidence: 0.94, verdict: "DEEPFAKE" }
          ]
        }
      });
    }

    if (isAudio) {
      return NextResponse.json({
        media_type: "audio",
        verdict: "DEEPFAKE",
        confidence: 0.87,
        details: {
          detection: {
            label: "Synthetic Voice Modulation",
            probs: { "Real": 0.13, "Fake": 0.87 },
            models_used: ["Wav2Vec 2.0 Acoustic Ensemble"],
            face_detected: false,
            ela_score: 0,
            analysis: [
              "Wav2Vec 2.0 acoustic analyzer detected synthetic pitch modulation.",
              "Acoustic spectrogram shows lack of high frequency background micro-noise.",
              "Phase incoherence found in syllable transition points."
            ]
          },
          ai_insights: {
            ai_insights: [
              { category: "Acoustic", description: "Robotic/flat resonance signatures in transition bounds.", severity: "high" },
              { category: "Noise", description: "Artificial silence floors inside deep syllables.", severity: "medium" }
            ],
            anomaly_score: 87.0,
            risk_level: "HIGH",
            summary: "Audio segment has high features of AI-cloned voices with flattened temporal frequency patterns."
          }
        },
        file_info: {
          filename,
          content_type: fileType,
          size_bytes: file?.size || 512000
        },
        forensics: {
          spectrogram: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60",
          waveform: "https://images.unsplash.com/photo-1557683316-973673baf926?w=600&auto=format&fit=crop&q=60"
        }
      });
    }

    // Default: Image
    return NextResponse.json({
      media_type: "image",
      verdict: "DEEPFAKE",
      confidence: 0.89,
      details: {
        detection: {
          label: "Manipulated (Deepfake)",
          probs: { "Real": 0.11, "Fake": 0.89 },
          models_used: ["ViT-Forensic Ensemble", "Swin-Transformer Anomaly-Detector"],
          face_detected: true,
          ela_score: 78.4,
          analysis: [
            "Facial texture inconsistencies detected in the mouth region.",
            "Error Level Analysis shows high frequency byte-level modifications indicating local editing.",
            "Transformer attention maps show atypical focus on eyes and chin boundaries."
          ]
        },
        metadata: {
          has_exif: false,
          risk_score: 95.0,
          ai_indicators: ["Missing EXIF tags", "Generative signature present"],
          details: ["No camera manufacturer metadata found", "Software footprint indicates manipulation"]
        },
        ai_insights: {
          ai_insights: [
            { category: "Face", description: "Local blending artifacts around the lips and nose.", severity: "critical" },
            { category: "Compression", description: "High JPEG compression noise mismatch in facial crop.", severity: "medium" }
          ],
          anomaly_score: 89.2,
          risk_level: "CRITICAL",
          summary: "This image exhibits high probability of deepfake manipulation with severe pixel-level inconsistencies around facial landmarks."
        }
      },
      file_info: {
        filename,
        content_type: fileType,
        size_bytes: file?.size || 1048576
      },
      forensics: {
        heatmap: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=60",
        noisemap: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=60"
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
