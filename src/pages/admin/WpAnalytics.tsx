import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getWpAnalytics,
  getWpEventTypeCounts,
  getWpSourceBreakdown,
  getWpWeeklyLeadComparison,
  refreshWpDailyStats,
  type WpAnalyticsRow,
} from "@/services/wpAgent";
import { toast } from "sonner";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "hsl(var(--secondary))"];

export default function WpAnalyticsPage() {
  const [rows, setRows] = useState<WpAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [sourceBreakdown, setSourceBreakdown] = useState({ website: 0, whatsapp: 0, other: 0 });
  const [eventTypes, setEventTypes] = useState<{ label: string; count: number }[]>([]);
  const [weekly, setWeekly] = useState({ thisWeek: 0, lastWeek: 0 });

  const loadDaily = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await getWpAnalytics(14));
    } catch (err) {
      toast.error("Failed to load analytics", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCharts = useCallback(async () => {
    setChartsLoading(true);
    try {
      const [src, ev, wk] = await Promise.all([
        getWpSourceBreakdown(),
        getWpEventTypeCounts(),
        getWpWeeklyLeadComparison(),
      ]);
      setSourceBreakdown(src);
      setEventTypes(ev);
      setWeekly(wk);
    } catch (err) {
      toast.error("Failed to load charts", { description: (err as Error).message });
    } finally {
      setChartsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDaily();
    void loadCharts();
  }, [loadDaily, loadCharts]);

  const onRefreshStats = async () => {
    setRefreshing(true);
    try {
      await refreshWpDailyStats(30);
      toast.success("Stats refreshed");
      await loadDaily();
      await loadCharts();
    } catch (err) {
      toast.error("Refresh failed", { description: (err as Error).message });
    } finally {
      setRefreshing(false);
    }
  };

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += row.total_leads || 0;
        acc.contacted += row.contacted_leads || 0;
        acc.converted += row.converted_leads || 0;
        return acc;
      },
      { total: 0, contacted: 0, converted: 0 }
    );
  }, [rows]);

  const conversionRate = totals.total > 0 ? Math.round((totals.converted / totals.total) * 100) : 0;

  const pieData = useMemo(() => {
    const items = [
      { name: "Website", value: sourceBreakdown.website },
      { name: "WhatsApp", value: sourceBreakdown.whatsapp },
    ];
    if (sourceBreakdown.other > 0) items.push({ name: "Other", value: sourceBreakdown.other });
    return items.filter((d) => d.value > 0);
  }, [sourceBreakdown]);

  const barData = useMemo(
    () => eventTypes.slice(0, 12).map((e) => ({ name: e.label.length > 22 ? `${e.label.slice(0, 20)}…` : e.label, full: e.label, count: e.count })),
    [eventTypes]
  );

  return (
    <AdminLayout title="WP Agent Analytics" subtitle="Daily lead trend and conversion metrics for WhatsApp agent">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <p className="text-sm text-muted-foreground">Charts use live wp_leads aggregates; daily table uses wp_daily_stats.</p>
        <Button className="h-11 sm:h-10 shrink-0" variant="outline" onClick={() => void onRefreshStats()} disabled={refreshing}>
          {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh stats
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <Card className="rounded-2xl sm:rounded-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Total Leads (14d)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{totals.total}</CardContent>
            </Card>
            <Card className="rounded-2xl sm:rounded-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Contacted
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{totals.contacted}</CardContent>
            </Card>
            <Card className="rounded-2xl sm:rounded-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{conversionRate}%</CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="rounded-2xl sm:rounded-lg">
              <CardHeader>
                <CardTitle className="text-base">Source breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                {chartsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  </div>
                ) : pieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No leads yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={2}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="hsl(var(--border))" strokeWidth={1} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl sm:rounded-lg">
              <CardHeader>
                <CardTitle className="text-base">Weekly summary</CardTitle>
              </CardHeader>
              <CardContent>
                {chartsLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/60 p-4">
                      <p className="text-xs text-muted-foreground mb-1">This week</p>
                      <p className="text-3xl font-bold tabular-nums">{weekly.thisWeek}</p>
                      <p className="text-xs text-muted-foreground mt-2">New leads (Mon–Sun)</p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-4">
                      <p className="text-xs text-muted-foreground mb-1">Last week</p>
                      <p className="text-3xl font-bold tabular-nums">{weekly.lastWeek}</p>
                      <p className="text-xs text-muted-foreground mt-2">Previous Mon–Sun</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl sm:rounded-lg mb-6">
            <CardHeader>
              <CardTitle className="text-base">Leads by event type</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] w-full">
              {chartsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
              ) : barData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No event types recorded.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: number) => [value, "Leads"]}
                      labelFormatter={(_, payload) => {
                        const p = payload?.[0]?.payload as { full?: string } | undefined;
                        return p?.full ?? "";
                      }}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl sm:rounded-lg">
            <CardHeader>
              <CardTitle>Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No analytics data available.</p>
              ) : (
                rows.map((row) => (
                  <div
                    key={row.date}
                    className="border border-border/50 rounded-xl p-3 sm:p-0 sm:border-0 sm:rounded-none sm:grid sm:grid-cols-4 sm:gap-2 sm:text-sm sm:border-b sm:py-2"
                  >
                    <div className="font-medium mb-2 sm:mb-0">{row.date}</div>
                    <div className="text-sm sm:text-inherit text-muted-foreground sm:text-foreground">Total: {row.total_leads}</div>
                    <div className="text-sm sm:text-inherit text-muted-foreground sm:text-foreground">
                      Contacted: {row.contacted_leads}
                    </div>
                    <div className="text-sm sm:text-inherit text-muted-foreground sm:text-foreground">
                      Converted: {row.converted_leads}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AdminLayout>
  );
}
