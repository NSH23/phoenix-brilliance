import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronDown, ChevronUp, Loader2, TrendingUp } from "lucide-react";
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
import {
  getWpAnalytics,
  getWpEventTypeCounts,
  getWpSourceBreakdown,
  getWpWeeklyLeadComparison,
  type WpAnalyticsRow,
} from "@/services/wpAgent";
import { toast } from "sonner";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "hsl(var(--secondary))"];

export default function WpAnalyticsPage() {
  const [rows, setRows] = useState<WpAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [dailyExpanded, setDailyExpanded] = useState(false);

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

  // Daily breakdown helpers
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRow = rows.find((r) => r.date === todayStr);

  const activeRows = useMemo(() => {
    return [...rows]
      .filter((r) => (r.total_leads ?? 0) > 0 || (r.converted_leads ?? 0) > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [rows]);

  const formatDay = (dateStr: string) => {
    const d = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    const isToday = dateStr === todayStr;
    const label = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    return isToday ? `Today (${label})` : label;
  };

  return (
    <AdminLayout title="WP Analytics" subtitle="Lead trends and conversions.">
      <div className="mb-5 sm:mb-6">
        <p className="text-xs sm:text-sm text-muted-foreground">Live data from your WhatsApp leads.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
            <Card className="rounded-2xl sm:rounded-lg border border-border/60 max-md:min-h-[92px]">
              <CardHeader className="pb-2 px-4 pt-4 max-md:px-3 max-md:pt-3">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-2 font-medium text-muted-foreground">
                  <BarChart3 className="w-4 h-4 shrink-0 text-foreground" /> <span className="leading-tight">Total (14d)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-xl sm:text-2xl font-bold tabular-nums max-md:px-3 max-md:pb-3">{totals.total}</CardContent>
            </Card>
            <Card className="rounded-2xl sm:rounded-lg border border-border/60 max-md:min-h-[92px]">
              <CardHeader className="pb-2 px-4 pt-4 max-md:px-3 max-md:pt-3">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-2 font-medium text-muted-foreground">
                  <TrendingUp className="w-4 h-4 shrink-0 text-foreground" /> <span className="leading-tight">Contacted</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-xl sm:text-2xl font-bold tabular-nums max-md:px-3 max-md:pb-3">{totals.contacted}</CardContent>
            </Card>
            <Card className="rounded-2xl sm:rounded-lg border border-border/60 max-md:col-span-2 max-md:min-h-[88px]">
              <CardHeader className="pb-2 px-4 pt-4 max-md:px-3 max-md:pt-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Conversion rate</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-xl sm:text-2xl font-bold tabular-nums max-md:px-3 max-md:pb-3">{conversionRate}%</CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5 sm:mb-6">
            <Card className="rounded-2xl sm:rounded-lg border border-border/60 overflow-hidden">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                <CardTitle className="text-sm sm:text-base">Source breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-[220px] sm:h-[280px] px-2 sm:px-6 pb-4">
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

            <Card className="rounded-2xl sm:rounded-lg border border-border/60 overflow-hidden">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                <CardTitle className="text-sm sm:text-base">Weekly summary</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6">
                {chartsLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="rounded-xl border border-border/60 p-3.5 sm:p-4 bg-muted/10">
                      <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">This week</p>
                      <p className="text-2xl sm:text-3xl font-bold tabular-nums">{weekly.thisWeek}</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-2 leading-snug">New leads (Mon–Sun)</p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-3.5 sm:p-4 bg-muted/10">
                      <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Last week</p>
                      <p className="text-2xl sm:text-3xl font-bold tabular-nums">{weekly.lastWeek}</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-2 leading-snug">Previous Mon–Sun</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl sm:rounded-lg border border-border/60 mb-5 sm:mb-6 overflow-hidden">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-sm sm:text-base">Leads by event type</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px] w-full sm:h-[320px] px-0 sm:px-2 pb-2 overflow-x-auto">
              {chartsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
              ) : barData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No event types recorded.</p>
              ) : (
                <div className="h-[240px] sm:h-[300px] min-w-[300px] w-full max-w-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 9 }} className="max-sm:[&_text]:text-[9px]" />
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
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl sm:rounded-lg border border-border/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setDailyExpanded((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div>
                <p className="text-sm sm:text-base font-semibold">Daily breakdown</p>
                {!dailyExpanded && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Today:&nbsp;
                    <span className="font-medium text-foreground">{todayRow?.total_leads ?? 0} leads</span>
                    {(todayRow?.converted_leads ?? 0) > 0 && (
                      <span className="ml-2 text-green-600 dark:text-green-400">
                        {todayRow!.converted_leads} converted
                      </span>
                    )}
                  </p>
                )}
              </div>
              {dailyExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </button>

            {dailyExpanded && (
              <CardContent className="px-3 pb-4 sm:px-6 pt-0">
                {activeRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No lead activity in the last 14 days.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">Date</th>
                        <th className="py-2 px-2 font-medium text-right">Leads</th>
                        <th className="py-2 px-2 font-medium text-right">Contacted</th>
                        <th className="py-2 pl-2 font-medium text-right">Converted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRows.map((row) => {
                        const leads = row.total_leads ?? 0;
                        const contacted = row.contacted_leads ?? 0;
                        const converted = row.converted_leads ?? 0;
                        const rate = leads > 0 ? Math.round((converted / leads) * 100) : 0;
                        const isToday = row.date === todayStr;
                        return (
                          <tr
                            key={row.date}
                            className={`border-b border-border/40 last:border-0 ${isToday ? "bg-primary/5" : ""}`}
                          >
                            <td className={`py-2.5 pr-3 ${isToday ? "font-semibold text-primary" : "font-medium"}`}>
                              {formatDay(row.date)}
                            </td>
                            <td className="py-2.5 px-2 text-right tabular-nums">{leads}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums">{contacted}</td>
                            <td className="py-2.5 pl-2 text-right tabular-nums">
                              {converted}
                              {leads > 0 && (
                                <span className="text-[11px] text-muted-foreground ml-1">({rate}%)</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            )}
          </Card>
        </>
      )}
    </AdminLayout>
  );
}
