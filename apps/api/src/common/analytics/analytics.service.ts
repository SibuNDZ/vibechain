import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface AnalyticsEventPayload {
  event: string;
  user_id?: string | null;
  timestamp?: string;
  properties?: Record<string, unknown>;
  video_id?: string;
  campaign_id?: string;
  amount?: number;
  genre?: string | null;
  method?: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly apiUrl?: string;
  private readonly apiKey?: string;
  private readonly sourceName: string;
  private readonly sourceType: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>("ANALYTICS_API_URL");
    this.apiKey = this.configService.get<string>("ANALYTICS_API_KEY");
    this.sourceName = this.configService.get<string>(
      "ANALYTICS_SOURCE_NAME",
      "vibechain_events"
    );
    this.sourceType = this.configService.get<string>(
      "ANALYTICS_SOURCE_TYPE",
      "events"
    );
    this.timeoutMs = parseInt(
      this.configService.get<string>("ANALYTICS_TIMEOUT_MS", "2500"),
      10
    );
  }

  isConfigured() {
    return Boolean(this.apiUrl && this.apiKey);
  }

  async track(event: AnalyticsEventPayload) {
    if (!this.apiUrl || !this.apiKey) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.apiUrl}/api/events/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify({
          source_name: this.sourceName,
          source_type: this.sourceType,
          source: "vibechain",
          events: [
            {
              ...event,
              timestamp: event.timestamp || new Date().toISOString(),
              properties: event.properties || {},
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(
          `Analytics event failed (${response.status}) for ${event.event}`
        );
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        this.logger.warn(`Analytics event error for ${event.event}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  async listDashboards() {
    return this.requestJson("/api/dashboard/list");
  }

  async getDashboard(dashboardId: string) {
    return this.requestJson(`/api/dashboard/${dashboardId}`);
  }

  private async requestJson(path: string) {
    if (!this.apiUrl || !this.apiKey) {
      throw new Error("ANALYTICS_NOT_CONFIGURED");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.apiUrl}${path}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error || data?.message || "Analytics API error";
        throw new Error(message);
      }

      return data;
    } finally {
      clearTimeout(timeout);
    }
  }
}
