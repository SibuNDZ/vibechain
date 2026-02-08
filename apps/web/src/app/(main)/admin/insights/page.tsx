"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, ShieldAlert } from "lucide-react";

interface DashboardSummary {
  id: string;
  name: string;
  description?: string | null;
  layout?: string | null;
  theme?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface DashboardWidget {
  id: string;
  type: "chart" | "metric" | "table";
  title: string;
  position?: { x: number; y: number; width: number; height: number };
  chart_svg?: string;
  metric_config?: {
    value: number;
    label: string;
    format?: string;
    trend?: { value: number; direction: "up" | "down" };
  };
  data?: unknown;
}

interface DashboardDetail {
  id: string;
  name: string;
  description?: string | null;
  layout?: string | null;
  theme?: string | null;
  created_at?: string;
  updated_at?: string;
  widgets: DashboardWidget[];
}

export default function AdminInsightsPage() {
  const [dashboards, setDashboards] = useState<DashboardSummary[]>([]);
  const [selected, setSelected] = useState<DashboardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const response = await api.get<{ dashboards: DashboardSummary[] }>(
          "/admin/analytics/dashboards"
        );
        setDashboards(response.dashboards || []);
      } catch (err: any) {
        if (err?.statusCode === 401 || err?.statusCode === 403) {
          setUnauthorized(true);
        } else {
          setError(err?.message || "Failed to load dashboards");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboards();
  }, []);

  const handleSelect = async (dashboardId: string) => {
    setIsLoadingDetail(true);
    setError(null);

    try {
      const response = await api.get<{ dashboard: DashboardDetail }>(
        `/admin/analytics/dashboards/${dashboardId}`
      );
      setSelected(response.dashboard);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-2 mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
            Admin Insights
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboards</h1>
          <p className="text-slate-600">
            Admin-only insights pulled from your predictive analytics API.
          </p>
        </div>

        {unauthorized && (
          <div className="vc-card p-6 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Admin access required
              </h2>
              <p className="text-slate-600">
                You don’t have permission to view analytics dashboards on this
                account.
              </p>
            </div>
          </div>
        )}

        {!unauthorized && (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="vc-card p-4">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Dashboards
              </h2>
              {isLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading dashboards...
                </div>
              ) : dashboards.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No dashboards yet. Create one in the analytics API.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {dashboards.map((dashboard) => (
                    <button
                      key={dashboard.id}
                      type="button"
                      onClick={() => handleSelect(dashboard.id)}
                      className={
                        "text-left rounded-xl border border-orange-200 px-4 py-3 transition-colors hover:border-orange-300 hover:bg-orange-50"
                      }
                    >
                      <p className="font-semibold text-slate-900">
                        {dashboard.name}
                      </p>
                      {dashboard.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {dashboard.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="vc-card p-6">
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {isLoadingDetail && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading dashboard...
                </div>
              )}

              {!selected && !isLoadingDetail && (
                <div className="text-sm text-slate-600">
                  Select a dashboard to view analytics widgets.
                </div>
              )}

              {selected && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      {selected.name}
                    </h2>
                    {selected.description && (
                      <p className="text-slate-600 mt-2">
                        {selected.description}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {selected.widgets.map((widget) => (
                      <div
                        key={widget.id}
                        className="vc-card-muted p-4 bg-white"
                      >
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">
                          {widget.title}
                        </h3>

                        {widget.type === "metric" && widget.metric_config ? (
                          <div className="space-y-1">
                            <p className="text-2xl font-bold text-slate-900">
                              {widget.metric_config.value}
                            </p>
                            <p className="text-xs text-slate-500">
                              {widget.metric_config.label}
                            </p>
                          </div>
                        ) : widget.type === "chart" && widget.chart_svg ? (
                          <div
                            className="w-full overflow-x-auto"
                            dangerouslySetInnerHTML={{
                              __html: widget.chart_svg,
                            }}
                          />
                        ) : (
                          <p className="text-sm text-slate-500">
                            No data available for this widget.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
