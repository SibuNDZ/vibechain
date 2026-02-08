"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Video,
  Clock,
  FileText,
  Image,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  CloudUpload,
} from "lucide-react";
import { api } from "@/lib/api";
import { VideoUploader } from "@/components/upload/VideoUploader";
import toast from "react-hot-toast";

interface CreateVideoResponse {
  id: string;
  title: string;
}

type UploadMode = "file" | "url";

export default function UploadPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>("file");
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string | null>(null);
  const [genre, setGenre] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("vibechain_token");
    if (!token) {
      router.replace("/login?redirect=/upload");
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router]);

  const handleUploadComplete = (data: {
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    cloudinaryPublicId: string;
  }) => {
    setVideoUrl(data.videoUrl);
    setThumbnailUrl(data.thumbnailUrl);
    setDuration(data.duration.toString());
    setCloudinaryPublicId(data.cloudinaryPublicId);
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!videoUrl) {
      setError("Please upload a video or provide a video URL");
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse duration for URL mode
      let durationSeconds = parseInt(duration, 10);
      if (duration.includes(":")) {
        const parts = duration.split(":");
        if (parts.length === 2) {
          durationSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        } else if (parts.length === 3) {
          durationSeconds =
            parseInt(parts[0], 10) * 3600 +
            parseInt(parts[1], 10) * 60 +
            parseInt(parts[2], 10);
        }
      }

      if (isNaN(durationSeconds) || durationSeconds < 1) {
        throw new Error("Please enter a valid duration");
      }

      const response = await api.post<CreateVideoResponse>("/videos", {
        title,
        description: description || undefined,
        videoUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        duration: durationSeconds,
        cloudinaryPublicId: cloudinaryPublicId || undefined,
        genre: genre || undefined,
      });

      toast.success("Video uploaded successfully!");
      router.push(`/videos/${response.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload video";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Videos
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload Video</h1>
          <p className="text-gray-400">Share your music video with the community</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-900/50 border border-red-700 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Upload Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setUploadMode("file")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              uploadMode === "file"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <CloudUpload className="w-5 h-5" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setUploadMode("url")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              uploadMode === "url"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <LinkIcon className="w-5 h-5" />
            Paste URL
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Upload/URL Section */}
          {uploadMode === "file" ? (
            <div className="bg-gray-800 rounded-xl p-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-4">
                <Video className="w-4 h-4 text-purple-400" />
                Video File *
              </label>
              <VideoUploader
                onUploadComplete={handleUploadComplete}
                onUploadStart={() => setIsUploading(true)}
                maxSizeMB={500}
              />
              {videoUrl && uploadMode === "file" && (
                <p className="mt-3 text-sm text-green-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  Video ready
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Video URL */}
              <div className="bg-gray-800 rounded-xl p-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Video className="w-4 h-4 text-purple-400" />
                  Video URL *
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Supports: MP4, HLS (.m3u8), YouTube, Vimeo URLs
                </p>
              </div>

              {/* Thumbnail URL (only for URL mode) */}
              <div className="bg-gray-800 rounded-xl p-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Image className="w-4 h-4 text-purple-400" />
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                {thumbnailUrl && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Preview:</p>
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail preview"
                      className="w-full max-w-xs h-auto rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Duration (only for URL mode) */}
              <div className="bg-gray-800 rounded-xl p-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  Duration *
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 180 (seconds) or 3:00 (mm:ss)"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Enter duration in seconds or mm:ss format
                </p>
              </div>
            </>
          )}

          {/* Title */}
          <div className="bg-gray-800 rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={100}
              placeholder="Enter video title"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Genre */}
          <div className="bg-gray-800 rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Select a genre (optional)</option>
              <option value="POP">Pop</option>
              <option value="ROCK">Rock</option>
              <option value="REGGAE">Reggae</option>
              <option value="GOSPEL_LOCAL">Gospel (Local)</option>
              <option value="GOSPEL_INTERNATIONAL">Gospel (International)</option>
              <option value="RNB">R&B</option>
              <option value="HIPHOP">Hip Hop</option>
            </select>
          </div>

          {/* Description */}
          <div className="bg-gray-800 rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Describe your video..."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
            />
            <p className="mt-2 text-xs text-gray-500">{description.length}/2000 characters</p>
          </div>

          {/* Thumbnail Preview for File Upload */}
          {uploadMode === "file" && thumbnailUrl && (
            <div className="bg-gray-800 rounded-xl p-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <Image className="w-4 h-4 text-purple-400" />
                Generated Thumbnail
              </label>
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full max-w-md h-auto rounded-lg object-cover"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isUploading || !videoUrl}
            className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publishing...
              </>
            ) : isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading video...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Publish Video
              </>
            )}
          </button>
        </form>

        {/* Guidelines */}
        <div className="mt-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Upload Guidelines</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              Videos must be music-related content
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              You must own or have rights to the content
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              Maximum file size: 500MB
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              Supported formats: MP4, WebM, MOV, AVI, MKV
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              High quality videos get more votes!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
