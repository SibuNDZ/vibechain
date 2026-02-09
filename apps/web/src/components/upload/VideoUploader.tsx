"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, Film, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface UploadSignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  duration: number;
  width: number;
  height: number;
  format: string;
  thumbnail_url?: string;
  eager?: Array<{ secure_url: string }>;
}

interface VideoUploaderProps {
  onUploadComplete: (data: {
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    cloudinaryPublicId: string;
  }) => void;
  onUploadStart?: () => void;
  maxSizeMB?: number;
}

type UploadStatus = "idle" | "uploading" | "processing" | "complete" | "error";

const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];

export function VideoUploader({
  onUploadComplete,
  onUploadStart,
  maxSizeMB = 500,
}: VideoUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<CloudinaryResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Cleanup blob URL on unmount or when preview changes to prevent memory leak
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return "Please upload a valid video file (MP4, WebM, MOV, AVI, MKV)";
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const uploadToCloudinary = async (file: File) => {
    setStatus("uploading");
    setProgress(0);
    setError(null);
    onUploadStart?.();

    try {
      // Step 1: Get upload signature from our API
      const signatureData = await api.get<UploadSignature>("/upload/signature");

      // Step 2: Prepare form data for Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", signatureData.timestamp.toString());
      formData.append("signature", signatureData.signature);
      formData.append("folder", signatureData.folder);
      formData.append("resource_type", "video");
      // Request thumbnail generation
      formData.append("eager", "c_thumb,w_400,h_225,g_auto");
      formData.append("eager_async", "true");

      // Step 3: Upload to Cloudinary with progress tracking
      const xhr = new XMLHttpRequest();
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`;

      const uploadPromise = new Promise<CloudinaryResponse>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
            if (percentComplete === 100) {
              setStatus("processing");
            }
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

        xhr.open("POST", cloudinaryUrl);
        xhr.send(formData);
      });

      const response = await uploadPromise;

      // Generate thumbnail URL from the video
      const thumbnailUrl =
        response.eager?.[0]?.secure_url ||
        response.secure_url.replace(/\.[^.]+$/, ".jpg");

      setUploadedData(response);
      setStatus("complete");

      onUploadComplete({
        videoUrl: response.secure_url,
        thumbnailUrl,
        duration: Math.round(response.duration),
        cloudinaryPublicId: response.public_id,
      });

      toast.success("Video uploaded successfully!");
    } catch (err) {
      setStatus("error");
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      toast.error(message);
    }
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setFileName(file.name);
    setError(null);

    // Revoke previous preview URL to prevent memory leak
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    // Create video preview
    const videoUrl = URL.createObjectURL(file);
    previewUrlRef.current = videoUrl;
    setPreview(videoUrl);

    // Start upload
    uploadToCloudinary(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleReset = () => {
    // Revoke preview URL to prevent memory leak
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setStatus("idle");
    setProgress(0);
    setError(null);
    setPreview(null);
    setFileName(null);
    setUploadedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {status === "idle" && (
        <div
          ref={dropZoneRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-orange-300 rounded-xl p-8 text-center cursor-pointer hover:border-red-500 hover:bg-orange-50 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <Upload className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-900 mb-2">
            Drag and drop your video here
          </p>
          <p className="text-slate-500 mb-4">or click to browse</p>
          <p className="text-sm text-slate-500">
            Supports MP4, WebM, MOV, AVI, MKV (max {maxSizeMB}MB)
          </p>
        </div>
      )}

      {(status === "uploading" || status === "processing") && (
        <div className="vc-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Film className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 font-medium truncate">{fileName}</p>
              <p className="text-sm text-slate-500">
                {status === "uploading" ? "Uploading..." : "Processing video..."}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative h-2 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-red-600 transition-all duration-300"
              style={{ width: `${status === "processing" ? 100 : progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-slate-500">
              {status === "processing" ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating thumbnail...
                </span>
              ) : (
                `${progress}%`
              )}
            </span>
          </div>
        </div>
      )}

      {status === "complete" && preview && (
        <div className="vc-card p-6">
          <div className="flex items-start gap-4">
            <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-orange-100 flex-shrink-0">
              <video
                src={preview}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Upload complete!</span>
              </div>
              <p className="text-slate-900 font-medium truncate mb-1">{fileName}</p>
              {uploadedData && (
                <p className="text-sm text-slate-500">
                  Duration: {Math.floor(uploadedData.duration / 60)}:
                  {String(Math.round(uploadedData.duration % 60)).padStart(2, "0")} •{" "}
                  {uploadedData.width}x{uploadedData.height}
                </p>
              )}
            </div>
            <button
              onClick={handleReset}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-orange-100 rounded-lg transition-colors"
              title="Upload a different video"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700 font-medium mb-1">Upload failed</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
