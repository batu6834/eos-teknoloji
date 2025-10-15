// src/utils/exporters.js
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ---------- CSV ---------- */
export function downloadCSV(rows, filename = "kpi.csv") {
    if (!rows?.length) {
        alert("İndirilecek veri yok.");
        return;
    }
    const headers = Object.keys(rows[0]);
    const escape = (v) => {
        const s = v == null ? "" : String(v);
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

/* ---------- XLSX ---------- */
export function downloadXLSX(rows, filename = "kpi.xlsx", sheetName = "KPI") {
    if (!rows?.length) {
        alert("İndirilecek veri yok.");
        return;
    }
    const headers = Object.keys(rows[0]);
    const data = [headers, ...rows.map(r => headers.map(h => r[h]))];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFileXLSX(wb, filename);
}

/* ---------- PDF (jsPDF + autoTable) ---------- */
export function downloadPDF(rows, meta = {}, filename = "kpi.pdf") {
    const { fromISO, toISO, companyName } = meta || {};
    const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
    const marginX = 40;

    doc.setFontSize(18);
    doc.setTextColor(34, 99, 235);
    doc.text("Technician KPI Report", marginX, 40);

    doc.setFontSize(10);
    doc.setTextColor(70);
    const range = `${new Date(fromISO || Date.now() - 7 * 864e5).toLocaleDateString("tr-TR")} – ${new Date(toISO || Date.now()).toLocaleDateString("tr-TR")}`;
    doc.text(`Company: ${companyName || "General"}`, marginX, 58);
    doc.text(`Date: ${range}`, marginX, 72);

    if (!rows?.length) {
        doc.setTextColor(150);
        doc.text("Seçilen aralıkta veri yok.", marginX, 100);
        doc.save(filename);
        return;
    }

    const headers = Object.keys(rows[0]);
    const body = rows.map(r => headers.map(h => r[h]));

    autoTable(doc, {
        startY: 90,
        head: [headers],
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: marginX, right: marginX },
    });

    doc.save(filename);
}
