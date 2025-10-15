// supabase/functions/send-kpi-report/index.ts
import { Resend } from "https://esm.sh/resend@3";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "https://esm.sh/pdf-lib@1.17.1";

/* ----------------------- CORS ----------------------- */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/* ----------------------- ENV ------------------------ */
const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const resend = new Resend(RESEND_KEY || "");
const admin = createClient(SUPABASE_URL!, SERVICE_ROLE!);

/* -------------------- Helpers ----------------------- */
// WinAnsi (Helvetica) Türkçe karakterleri desteklemez.
// PDF’e yazmadan önce güvenli ASCII’ye indirgeriz.
function asciiSafe(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ü/g, "u").replace(/Ü/g, "U");
}

function toBase64(u8: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin);
}

/** QuickChart ile çizgi grafik PNG’si üretir (legend kapalı, dar yükseklik) */
async function fetchChartImage(rows: any[], metric = "closed_count"): Promise<Uint8Array> {
  const labels = rows.map(r => r.day);
  const data = rows.map(r => Number(r[metric] ?? 0));

  const chartConfig = {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Kapali Tickets",
        data,
        borderColor: "rgb(37,99,235)",
        backgroundColor: "rgba(37,99,235,0.25)",
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxRotation: 0, autoSkip: true } },
        y: { beginAtZero: true }
      }
    },
  };

  const res = await fetch("https://quickchart.io/chart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ width: 740, height: 200, format: "png", chart: chartConfig }),
  });
  return new Uint8Array(await res.arrayBuffer());
}

/** PDF üretimi (landscape A4, üstte başlık + tablo, altta grafik) */
async function createKpiPdf(
  rows: any[],
  fromISO: string,
  toISO: string,
  companyName?: string | null,
  metricForChart: string = "closed_count",
): Promise<Uint8Array> {
  // Landscape A4
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  let y = height - 40;

  // Header
  page.drawText("Technician KPI Report", {
    x: 40, y, size: 18, font, color: rgb(0.15, 0.35, 0.9),
  });
  y -= 18;

  const rangeText = `${new Date(fromISO).toLocaleDateString("tr-TR")} – ${new Date(toISO).toLocaleDateString("tr-TR")}`;
  page.drawText(`Date: ${asciiSafe(rangeText)}`, { x: 40, y, size: 10, font, color: rgb(0.25, 0.25, 0.25) });
  y -= 14;
  page.drawText(`Company: ${asciiSafe(companyName || "General")}`, { x: 40, y, size: 10, font, color: rgb(0.25, 0.25, 0.25) });
  y -= 18;

  // Table header
  const cols = [
    { key: "day", label: "Day", w: 76 },
    { key: "total_tickets", label: "Total", w: 46 },
    { key: "assigned_count", label: "Appointed", w: 60 },
    { key: "open_count", label: "Open", w: 42 },
    { key: "in_progress_count", label: "Next", w: 48 },
    { key: "waiting_count", label: "Wait", w: 42 },
    { key: "closed_count", label: "Closed", w: 50 },
    { key: "high_priority_count", label: "High", w: 42 },
    { key: "avg_first_response_hours", label: "FirstAns(h)", w: 68 },
    { key: "avg_resolution_hours", label: "Solution(h)", w: 68 },
    { key: "reopened_count", label: "Again", w: 50 },
  ];
  let x = 40;

  // Header bar
  page.drawRectangle({
    x: x - 2,
    y: y - 3,
    width: cols.reduce((s, c) => s + c.w, 0) + 4,
    height: 16,
    color: rgb(0.15, 0.35, 0.9),
  });
  cols.forEach(c => {
    page.drawText(c.label, { x, y, size: 9, font, color: rgb(1, 1, 1) });
    x += c.w;
  });
  y -= 18;

  // Rows (zebra)
  const maxRows = 18;
  for (let i = 0; i < Math.min(rows.length, maxRows); i++) {
    const r = rows[i];
    x = 40;

    // zebra bg
    if (i % 2 === 0) {
      page.drawRectangle({
        x: x - 2,
        y: y - 2,
        width: cols.reduce((s, c) => s + c.w, 0) + 4,
        height: 14,
        color: rgb(0.96, 0.97, 0.99),
      });
    }

    cols.forEach(c => {
      const v = c.key === "day" ? asciiSafe(r.day) : String(r[c.key] ?? "");
      page.drawText(v, { x, y, size: 8, font: mono, color: rgb(0, 0, 0) });
      x += c.w;
    });
    y -= 14;
  }
  if (rows.length > maxRows) {
    page.drawText(`+${rows.length - maxRows} more...`, { x: 40, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 14;
  }

  // Chart at bottom
  try {
    const png = await fetchChartImage(rows, metricForChart);
    const img = await pdf.embedPng(png);
    const targetW = width - 80;
    const scale = targetW / img.width;
    const targetH = img.height * scale;
    page.drawImage(img, {
      x: 40,
      y: 40,
      width: targetW,
      height: Math.min(targetH, y - 20),
    });
  } catch {
    page.drawText("Chart could not be generated.", { x: 40, y: 48, size: 10, font, color: rgb(0.8, 0, 0) });
  }

  return await pdf.save();
}

/* --------------------- Server ----------------------- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Body/Query
    let payload: any = {};
    if (req.method === "POST") {
      try { payload = await req.json(); } catch { }
    } else {
      const url = new URL(req.url);
      payload.toEmail = url.searchParams.get("toEmail");
      payload.from = url.searchParams.get("from");
      payload.to = url.searchParams.get("to");
      payload.tech = url.searchParams.get("tech");
      payload.companyName = url.searchParams.get("companyName");
      payload.metric = url.searchParams.get("metric");
    }

    const toEmail = payload?.toEmail as string | null;
    const fromISO: string = payload?.from ?? new Date(Date.now() - 7 * 864e5).toISOString();
    const toISO: string = payload?.to ?? new Date().toISOString();
    const technicianId: string | null = payload?.tech ?? null;
    const companyName: string | null = payload?.companyName ?? null; // filtre + başlık
    const metric: string = payload?.metric || "closed_count";

    if (!toEmail) {
      return new Response(JSON.stringify({ ok: false, error: "toEmail is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Veriyi v_technician_kpis_v2’den çek
    let q = admin
      .from("v_technician_kpis_v2")
      .select("*")
      .gte("day", fromISO)
      .lte("day", toISO)
      .order("day", { ascending: true });

    if (technicianId) q = q.eq("technician_id", technicianId);
    if (companyName) q = q.eq("company_name", companyName);

    const { data, error } = await q;
    if (error) throw error;

    const rows = (data ?? []).map((r: any) => ({
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
    }));

    // PDF üret
    const pdfBytes = await createKpiPdf(rows, fromISO, toISO, companyName, metric);
    const pdfB64 = toBase64(pdfBytes);

    // Mail gönder
    const { error: mailErr } = await resend.emails.send({
      // Domain doğruladıktan sonra: from: "reports@senin-domainin.com"
      from: "onboarding@resend.dev",
      to: [toEmail],
      subject: "KPI Report",
      html: "<p>Rapor ektedir.</p>",
      attachments: [
        { filename: "kpi-report.pdf", content: pdfB64, type: "application/pdf" },
      ],
    });
    if (mailErr) throw mailErr;

    return new Response(JSON.stringify({ ok: true, sentTo: toEmail, count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Function error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
