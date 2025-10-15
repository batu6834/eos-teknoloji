// supabase/functions/send-kpi-report/pdf.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Basit PDF oluşturucu
export function createKpiPdf(rows: any[], fromISO: string, toISO: string) {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Technician KPI Report", 14, 20);
    doc.setFontSize(10);
    doc.text(
        `${new Date(fromISO).toLocaleDateString("tr-TR")} - ${new Date(toISO).toLocaleDateString("tr-TR")}`,
        14,
        28
    );

    // Tabloya dönüştür
    if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        const body = rows.map((r) => headers.map((h) => r[h] ?? ""));
        autoTable(doc, {
            head: [headers],
            body,
            startY: 35,
        });
    } else {
        doc.text("Seçilen aralıkta veri bulunamadı.", 14, 40);
    }

    return doc.output("arraybuffer"); // PDF'i ArrayBuffer olarak döndür
}
