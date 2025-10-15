import React from "react";
import { downloadCSV, downloadXLSX, downloadPDF } from "../../utils/exporters";

export default function ExportMenu({ rows, meta }) {
    const safeRows = Array.isArray(rows) ? rows : [];
    const fileBase = `kpi_${(meta?.companyName || "general")
        .toLowerCase()
        .replace(/\s+/g, "-")}_${new Date(meta?.toISO || Date.now()).toISOString().slice(0, 10)}`;

    return (
        <div className="flex flex-wrap gap-2">
            <button
                className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
                onClick={() => downloadCSV(safeRows, `${fileBase}.csv`)}
            >
                CSV indir
            </button>
            <button
                className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
                onClick={() => downloadXLSX(safeRows, `${fileBase}.xlsx`)}
            >
                Excel (XLSX)
            </button>
            <button
                className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
                onClick={() => downloadPDF(safeRows, meta, `${fileBase}.pdf`)}
            >
                PDF indir
            </button>
        </div>
    );
}
