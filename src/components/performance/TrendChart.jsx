// src/components/performance/TrendChart.jsx
import { useEffect, useMemo } from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";

export const METRIC_OPTIONS = [
    { key: "total_tickets", label: "Total" },
    { key: "open_count", label: "Open" },
    { key: "in_progress_count", label: "In Progress" },
    { key: "waiting_count", label: "Waiting" },
    { key: "closed_count", label: "Closed" },
    { key: "assigned_count", label: "Assigned" },
    { key: "high_priority_count", label: "High Priority" },
    { key: "reopened_count", label: "Reopened" },
    { key: "avg_first_response_hours", label: "Avg First Response (h)" },
    { key: "avg_resolution_hours", label: "Avg Resolution (h)" },
];

function WeekendDot(props) {
    const { cx, cy, payload } = props;
    if (payload?.isWeekend) return <circle cx={cx} cy={cy} r={4} fill="#9ca3af" stroke="none" />;
    return <circle cx={cx} cy={cy} r={4} />;
}

export default function TrendChart({ data = [], metric, setMetric }) {
    // Saat ortalaması metrikleri (…_hours) tüm satırlarda null ise gizle
    const metricOptions = useMemo(() => {
        const hasAny = (key) => Array.isArray(data) && data.some((r) => r?.[key] != null);
        return METRIC_OPTIONS.filter((m) => !m.key.endsWith("_hours") || hasAny(m.key));
    }, [data]);

    // Seçili metric gizlendiyse güvenli birine düş
    useEffect(() => {
        if (!metricOptions.some((m) => m.key === metric)) {
            const fallback = metricOptions[0]?.key || "total_tickets";
            setMetric(fallback);
        }
    }, [metricOptions, metric, setMetric]);

    const isDuration = metric?.includes("_hours");

    const chartData = useMemo(() => {
        return (data || []).map((r) => {
            const d = new Date(r.day);
            const dow = d.getDay();
            const raw = r?.[metric];
            const num = Number(raw);
            return {
                ...r,
                dayDate: d,
                isWeekend: dow === 0 || dow === 6,
                dayLabel: d.toLocaleDateString("tr-TR"),
                value: Number.isFinite(num) ? num : 0,
            };
        });
    }, [data, metric]);

    const tickFormatter = (label, index) => {
        const row = chartData[index];
        if (!row) return label;
        return row.isWeekend ? `${label} (HS)` : label;
    };

    const tooltipFormatter = (v) =>
        typeof v === "number" ? (isDuration ? v.toFixed(2) : Math.round(v)) : v;

    const hasData = chartData.some((d) => d.value !== 0);

    return (
        <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Trend</h3>
                <select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm"
                >
                    {metricOptions.map((m) => (
                        <option key={m.key} value={m.key}>
                            {m.label}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ width: "100%", height: 320 }}>
                {!chartData.length ? (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                        Gösterilecek veri yok.
                    </div>
                ) : (
                    <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="dayLabel" tickFormatter={tickFormatter} interval="preserveStartEnd" />
                            <YAxis allowDecimals={isDuration} domain={[0, "auto"]} />
                            <Tooltip formatter={tooltipFormatter} />
                            <Line
                                type="monotone"
                                dataKey="value"
                                name="Değer"
                                dot={<WeekendDot />}
                                activeDot={{ r: 5 }}
                                stroke="#2563eb"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
                Not: Etiketinde “(HS)” olan günler hafta sonudur; noktalar griyle vurgulanır.
            </p>

            {!hasData && chartData.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">Seçilen metrikte tüm günler 0 görünüyor.</div>
            )}
        </div>
    );
}
