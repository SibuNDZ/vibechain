import { Injectable, OnModuleInit, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

export interface UploadSignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  duration?: number;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  thumbnail_url?: string;
}

@Injectable()
export class UploadService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const cloudName = this.configService.get<string>("CLOUDINARY_CLOUD_NAME");
    const apiKey = this.configService.get<string>("CLOUDINARY_API_KEY");
    const apiSecret = this.configService.get<string>("CLOUDINARY_API_SECRET");

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

  private getCloudinaryConfig() {
    const cloudName = this.configService.get<string>("CLOUDINARY_CLOUD_NAME");
    const apiKey = this.configService.get<string>("CLOUDINARY_API_KEY");
    const apiSecret = this.configService.get<string>("CLOUDINARY_API_SECRET");

    const missing = [
      !cloudName ? "CLOUDINARY_CLOUD_NAME" : null,
      !apiKey ? "CLOUDINARY_API_KEY" : null,
      !apiSecret ? "CLOUDINARY_API_SECRET" : null,
    ].filter(Boolean);

    if (missing.length > 0) {
      throw new ServiceUnavailableException(
        `Cloudinary not configured. Missing ${missing.join(", ")}`
      );
    }

    return {
      cloudName: cloudName!,
      apiKey: apiKey!,
      apiSecret: apiSecret!,
    };
  }

  /**
   * Generate a signed upload signature for direct browser uploads
   * This allows the frontend to upload directly to Cloudinary without going through our server
   */
  generateUploadSignature(folder = "videos"): UploadSignature {
    const { cloudName, apiKey, apiSecret } = this.getCloudinaryConfig();
    const timestamp = Math.round(Date.now() / 1000);

    const paramsToSign = {
      timestamp,
      folder,
      // Enable automatic thumbnail generation
      eager: "c_thumb,w_1280,h_720,g_auto",
      eager_async: true,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret
    );

    return {
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder,
    };
  }

  /**
   * Generate thumbnail URL from a video public_id
   */
  getThumbnailUrl(publicId: string, options?: { width?: number; height?: number; timestamp?: number }): string {
    this.getCloudinaryConfig();
    const { width = 1280, height = 720, timestamp } = options || {};

    const transformations: string[] = [
      `c_thumb`,
      `w_${width}`,
      `h_${height}`,
      `g_auto`,
    ];

    // If timestamp provided, extract frame at that time
    if (timestamp !== undefined) {
      transformations.push(`so_${timestamp}`);
    }

    return cloudinary.url(publicId, {
      resource_type: "video",
      transformation: transformations.join(","),
      format: "jpg",
      secure: true,
    });
  }

  /**
   * Generate video URL with optional transformations
   */
  getVideoUrl(publicId: string, options?: { quality?: string; format?: string }): string {
    this.getCloudinaryConfig();
    const { quality = "auto", format = "mp4" } = options || {};

    return cloudinary.url(publicId, {
      resource_type: "video",
      transformation: [
        { quality },
        { fetch_format: format },
      ],
      secure: true,
    });
  }

  /**
   * Generate HLS streaming URL for adaptive bitrate streaming
   */
  getStreamingUrl(publicId: string): string {
    this.getCloudinaryConfig();
    return cloudinary.url(publicId, {
      resource_type: "video",
      format: "m3u8",
      streaming_profile: "auto",
      secure: true,
    });
  }

  /**
   * Delete a video from Cloudinary
   */
  async deleteVideo(publicId: string): Promise<void> {
    this.getCloudinaryConfig();
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });
  }

  /**
   * Get video details from Cloudinary
   */
  async getVideoDetails(publicId: string): Promise<CloudinaryUploadResult | null> {
    this.getCloudinaryConfig();
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: "video",
      });

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        duration: result.duration,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type,
      };
    } catch (error) {
      return null;
    }
  }
}
