export default function KpiCard({ label, value, hint }) {
    return (
        <div className="rounded-2xl shadow-lg p-4 bg-white min-w-[180px]">
            <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
            <div className="text-2xl font-semibold mt-1">{value ?? "-"}</div>
            {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
        </div>
    );
}
