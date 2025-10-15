// src/pages/PerformancePage.jsx
import { useMemo, useState } from "react";
import FilterBar from "../components/performance/FilterBar";
import KpiCard from "../components/performance/KpiCard";
import { useTechnicianKPIs } from "../hooks/useTechnicianKPIs";
import { useOutlierTickets10BD } from "../hooks/useOutlierTickets10BD"; // ⬅️ yeni
import TrendChart from "../components/performance/TrendChart";
import EmailReportButton from "../components/performance/EmailReportButton";
import ExportMenu from "../components/performance/ExportMenu";

export default function PerformancePage() {
    const [filters, setFilters] = useState(() => {
        const from = new Date(Date.now() - 7 * 864e5).toISOString();
        const to = new Date().toISOString();
        return { from, to, technicianId: null, companyName: null };
    });

    const [metric, setMetric] = useState("closed_count");

    // KPI verisi
    const { data, loading, error } = useTechnicianKPIs(filters);
    const safeData = data || [];

    // 10 iş gününü aşanlar (uyarı bloğu için)
    const { rows: outliers, loading: ol, error: oe } = useOutlierTickets10BD(filters);
    const [showOutliers, setShowOutliers] = useState(false);

    const totals = useMemo(() => {
        const acc = {
            total_tickets: 0,
            assigned_count: 0,
            open_count: 0,
            in_progress_count: 0,
            waiting_count: 0,
            closed_count: 0,
            high_priority_count: 0,
            avg_assignment_hours: null,
            // outlier kartları için toplamlar (view’de yoksa 0 kalır)
            first_outliers_10bd: 0,
            res_outliers_10bd: 0,
        };
        if (!safeData.length) return acc;

        let sumAssignHours = 0,
            nAssignHours = 0;

        for (const r of safeData) {
            acc.total_tickets += r.total_tickets ?? 0;
            acc.assigned_count += r.assigned_count ?? 0;
            acc.open_count += r.open_count ?? 0;
            acc.in_progress_count += r.in_progress_count ?? 0;
            acc.waiting_count += r.waiting_count ?? 0;
            acc.closed_count += r.closed_count ?? 0;
            acc.high_priority_count += r.high_priority_count ?? 0;

            // view v3'te varsa toplar, yoksa 0 kalır
            acc.first_outliers_10bd += r.first_response_outlier_10bd_count ?? 0;
            acc.res_outliers_10bd += r.resolution_outlier_10bd_count ?? 0;

            if (r.avg_assignment_hours != null) {
                const v = Number(r.avg_assignment_hours);
                if (Number.isFinite(v)) {
                    sumAssignHours += v;
                    nAssignHours += 1;
                }
            }
        }
        acc.avg_assignment_hours = nAssignHours ? sumAssignHours / nAssignHours : null;
        return acc;
    }, [safeData]);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Technician Performance</h1>

            <FilterBar onChange={setFilters} />

            {/* ⬇️ 10 iş gününü aşanlar için uyarı bloğu */}
            {oe && (
                <div className="text-red-600 text-sm">
                    Uyarı listesi yüklenemedi: {oe.message}
                </div>
            )}
            {!ol && outliers.length > 0 && (
                <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <b>{outliers.length}</b> kayıt <b>10 iş gününü</b> (hafta sonları hariç) aştı.
                        </div>
                        <button
                            onClick={() => setShowOutliers((v) => !v)}
                            className="text-sm underline"
                        >
                            {showOutliers ? "Gizle" : "Detayları göster"}
                        </button>
                    </div>

                    {showOutliers && (
                        <div className="mt-2 max-h-60 overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-yellow-100">
                                    <tr>
                                        <th className="px-2 py-1 text-left">ID</th>
                                        <th className="px-2 py-1 text-left">Firma</th>
                                        <th className="px-2 py-1 text-left">Teknisyen</th>
                                        <th className="px-2 py-1 text-left">Durum</th>
                                        <th className="px-2 py-1 text-left">Oluşturma</th>
                                        <th className="px-2 py-1 text-right">İş Günü</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {outliers.map((r) => (
                                        <tr key={r.id}>
                                            <td className="px-2 py-1 font-mono text-xs">
                                                {String(r.id).slice(0, 8)}
                                            </td>
                                            <td className="px-2 py-1">{r.company_name || "-"}</td>
                                            <td className="px-2 py-1">
                                                {r.technician_id ? String(r.technician_id).slice(0, 8) : "-"}
                                            </td>
                                            <td className="px-2 py-1">{r.status}</td>
                                            <td className="px-2 py-1">
                                                {new Date(r.created_at).toLocaleDateString("tr-TR")}
                                            </td>
                                            <td className="px-2 py-1 text-right">{r.business_days}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <ExportMenu
                rows={safeData.map((r) => ({
                    day: new Date(r.day).toLocaleDateString("tr-TR"),
                    total_tickets: r.total_tickets ?? 0,
                    assigned_count: r.assigned_count ?? 0,
                    open_count: r.open_count ?? 0,
                    in_progress_count: r.in_progress_count ?? 0,
                    waiting_count: r.waiting_count ?? 0,
                    closed_count: r.closed_count ?? 0,
                    high_priority_count: r.high_priority_count ?? 0,
                    avg_first_response_hours: r.avg_first_response_hours ?? "",
                    avg_resolution_hours: r.avg_resolution_hours ?? "",
                    reopened_count: r.reopened_count ?? "",
                    company_name: r.company_name ?? (filters.companyName || "Genel"),
                    technician_id: r.technician_id ?? (filters.technicianId || ""),
                }))}
                meta={{
                    fromISO: filters.from,
                    toISO: filters.to, // ExportMenu bu anahtarı kullanıyor
                    companyName: filters.companyName || "General",
                }}
            />

            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    Firma: <b>{filters.companyName || "Genel"}</b>
                </div>
                <EmailReportButton
                    fromISO={filters.from}
                    toISO={filters.to}
                    technicianId={filters.technicianId}
                    companyName={filters.companyName}
                />
            </div>

            {loading && <div className="text-gray-500">Loading…</div>}
            {error && <div className="text-red-600">Error: {error.message}</div>}

            {!loading && !error && (
                <>
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        <KpiCard label="Total Tickets" value={totals.total_tickets} />
                        <KpiCard label="Assigned" value={totals.assigned_count} />
                        <KpiCard label="Open" value={totals.open_count} />
                        <KpiCard label="In Progress" value={totals.in_progress_count} />
                        <KpiCard label="Waiting" value={totals.waiting_count} />
                        <KpiCard label="Closed" value={totals.closed_count} />
                        <KpiCard label="High Priority" value={totals.high_priority_count} />

                        {/* Outlier KPI kartları: >0 ise göster */}
                        {totals.first_outliers_10bd > 0 && (
                            <KpiCard
                                label=">10 İş Günü (İlk Yanıt)"
                                value={totals.first_outliers_10bd}
                            />
                        )}
                        {totals.res_outliers_10bd > 0 && (
                            <KpiCard
                                label=">10 İş Günü (Çözüm)"
                                value={totals.res_outliers_10bd}
                            />
                        )}
                    </div>

                    <div className="mt-8 overflow-auto">
                        {safeData.length === 0 ? (
                            <div className="text-sm text-gray-500 p-6 border rounded-lg bg-white">
                                Bu filtrelerle gösterilecek veri yok.
                            </div>
                        ) : (
                            <table className="min-w-[1000px] w-full border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <Th>Day</Th>
                                        <Th>Company</Th>
                                        <Th>Total</Th>
                                        <Th>Assigned</Th>
                                        <Th>Open</Th>
                                        <Th>In&nbsp;Progress</Th>
                                        <Th>Waiting</Th>
                                        <Th>Closed</Th>
                                        <Th>High&nbsp;Prio</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {safeData.map((r, i) => (
                                        <tr key={i} className="border-t">
                                            <Td>{new Date(r.day).toLocaleDateString("tr-TR")}</Td>
                                            <Td>{r.company_name || "-"}</Td>
                                            <Td>{r.total_tickets ?? 0}</Td>
                                            <Td>{r.assigned_count ?? 0}</Td>
                                            <Td>{r.open_count ?? 0}</Td>
                                            <Td>{r.in_progress_count ?? 0}</Td>
                                            <Td>{r.waiting_count ?? 0}</Td>
                                            <Td>{r.closed_count ?? 0}</Td>
                                            <Td>{r.high_priority_count ?? 0}</Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <TrendChart data={safeData} metric={metric} setMetric={setMetric} />
                </>
            )}
        </div>
    );
}

function Th({ children }) {
    return (
        <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">
            {children}
        </th>
    );
}
function Td({ children }) {
    return <td className="text-sm px-3 py-2 whitespace-nowrap">{children}</td>;
}
