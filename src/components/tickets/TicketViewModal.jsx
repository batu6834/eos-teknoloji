// src/components/tickets/TicketViewModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import supabaseAdmin from "../../supabaseAdminClient";
import { supabase } from "../../supabaseClient";
import {
    X, Pencil, Save, Trash2, Loader2, User2, Factory,
    Clock, CheckCircle, Paperclip
} from "lucide-react";

const BUCKET = process.env.REACT_APP_TICKET_BUCKET || "ticket-attachments";
const CATEGORY_OPTIONS = ["Donanım", "Yazılım", "Sarf", "Diğer"];
const PRIORITY_OPTIONS = ["Düşük", "Normal", "Yüksek"];

export default function TicketViewModal({ ticketId, open, onClose, onUpdated }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [err, setErr] = useState(null);

    const [row, setRow] = useState(null);               // support_tickets
    const [attachments, setAttachments] = useState([]); // [{id, url, path, created_at}]
    const [techs, setTechs] = useState([]);             // [{id, display_name}]
    const [printers, setPrinters] = useState([]);       // [{id, asset_code, ...}]

    // Olay günlüğü
    const [events, setEvents] = useState([]);
    const [actors, setActors] = useState({});
    const [tab, setTab] = useState("events");           // events | details

    // Edit modu + form alanları
    const [edit, setEdit] = useState(false);
    const [fSubject, setFSubject] = useState("");
    const [fCategory, setFCategory] = useState("Donanım");
    const [fPriority, setFPriority] = useState("Normal");
    const [fVisible, setFVisible] = useState(true);
    const [fPrinterId, setFPrinterId] = useState("");
    const [fAssigned, setFAssigned] = useState("");

    const companyId = useMemo(() => row?.user_id || row?.user_uuid || null, [row]);
    const currentPrinter = useMemo(
        () => printers.find(p => p.id === fPrinterId),
        [printers, fPrinterId]
    );
    const currentTech = useMemo(
        () => techs.find(t => t.id === fAssigned),
        [techs, fAssigned]
    );

    useEffect(() => {
        if (!open || !ticketId) return;

        let alive = true;
        (async () => {
            setLoading(true);
            setErr(null);

            // 1) Ticket
            const { data: st, error: stErr } = await supabaseAdmin
                .from("support_tickets")
                .select("id, created_at, status, subject, message, category, priority, visible_to_company, printer_id, assigned_to, assigned_at, user_id, user_uuid")
                .eq("id", ticketId)
                .single();

            if (!alive) return;
            if (stErr) { setErr(stErr.message); setLoading(false); return; }
            setRow(st);

            // 2) Attachments
            const { data: atts } = await supabaseAdmin
                .from("ticket_attachments")
                .select("id, ticket_id, path, created_at")
                .eq("ticket_id", ticketId)
                .order("created_at", { ascending: true });

            const mapped = (atts || []).map(a => {
                const { data: pu } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(a.path);
                return { id: a.id, path: a.path, url: pu?.publicUrl || "", created_at: a.created_at };
            });
            setAttachments(mapped);

            // 3) Techs
            const { data: techList } = await supabaseAdmin
                .from("profiles")
                .select("id, display_name")
                .eq("role", "tech");
            setTechs(techList || []);

            // 4) Printers (company yazıcıları)
            if (st.user_id || st.user_uuid) {
                const company = st.user_id || st.user_uuid;
                const { data: pList } = await supabaseAdmin
                    .from("company_printers")
                    .select("id, asset_code, model, department, floor")
                    .eq("company_id", company)
                    .order("asset_code", { ascending: true });
                setPrinters(pList || []);
            } else {
                setPrinters([]);
            }

            // 5) Form initial
            setFSubject(st.subject || "");
            setFCategory(st.category || "Donanım");
            setFPriority(st.priority || "Normal");
            setFVisible(!!st.visible_to_company);
            setFPrinterId(st.printer_id || "");
            setFAssigned(st.assigned_to || "");

            // 6) Events (timeline)
            const { data: evs } = await supabaseAdmin
                .from("ticket_events")
                .select("id, actor_id, actor_role, event_type, payload, visible_to_company, created_at")
                .eq("ticket_id", ticketId)
                .order("created_at", { ascending: true });

            setEvents(evs || []);

            // Aktör isim haritası
            const ids = [...new Set((evs || []).map(e => e.actor_id).filter(Boolean))];
            let map = {};
            if (ids.length) {
                const { data: profs } = await supabaseAdmin
                    .from("profiles")
                    .select("id, display_name, role")
                    .in("id", ids);
                for (const p of profs || []) {
                    map[p.id] = p.display_name?.trim() || `#${p.id.slice(0, 8)} (${p.role})`;
                }
            }
            setActors(map);

            setLoading(false);
        })();

        return () => { alive = false; };
    }, [open, ticketId]);

    const onSave = async () => {
        if (!row) return;
        setSaving(true);
        setErr(null);
        try {
            const updates = {};
            if (fSubject !== (row.subject || "")) updates.subject = fSubject.trim() || null;
            if (fCategory !== (row.category || "Donanım")) updates.category = fCategory;
            if (fPriority !== (row.priority || "Normal")) updates.priority = fPriority;
            if (!!fVisible !== !!row.visible_to_company) updates.visible_to_company = !!fVisible;

            const assignedChanged = (fAssigned || null) !== (row.assigned_to || null);
            if (assignedChanged) {
                updates.assigned_to = fAssigned || null;
                updates.assigned_at = fAssigned ? new Date().toISOString() : null;
            }

            const printerChanged = (fPrinterId || null) !== (row.printer_id || null);
            if (printerChanged) updates.printer_id = fPrinterId || null;

            if (Object.keys(updates).length === 0) { setEdit(false); setSaving(false); return; }

            // Aktörü damgala (admin/tech oturumu anon client'tan)
            const { data: { user } } = await supabase.auth.getUser();
            const actorId = user?.id || null;

            const { error: upErr } = await supabaseAdmin
                .from("support_tickets")
                .update({ ...updates, last_actor: actorId })
                .eq("id", row.id);

            if (upErr) throw upErr;

            setEdit(false);
            onUpdated?.();

            // Refresh
            const { data: st2 } = await supabaseAdmin
                .from("support_tickets")
                .select("id, created_at, status, subject, message, category, priority, visible_to_company, printer_id, assigned_to, assigned_at, user_id, user_uuid")
                .eq("id", ticketId)
                .single();
            setRow(st2 || row);

            const { data: evs2 } = await supabaseAdmin
                .from("ticket_events")
                .select("id, actor_id, actor_role, event_type, payload, visible_to_company, created_at")
                .eq("ticket_id", ticketId)
                .order("created_at", { ascending: true });
            setEvents(evs2 || []);
        } catch (e) {
            setErr(e?.message || "Güncelleme başarısız.");
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        if (!row) return;
        if (!window.confirm("Bu talebi kalıcı olarak silmek istiyor musunuz?")) return;

        setDeleting(true);
        setErr(null);
        try {
            // (opsiyonel) silmeden önce last_actor damgası
            const { data: { user } } = await supabase.auth.getUser();
            const actorId = user?.id || null;
            await supabaseAdmin.from("support_tickets").update({ last_actor: actorId }).eq("id", row.id);

            const { error } = await supabaseAdmin.from("support_tickets").delete().eq("id", row.id);
            if (error) throw error;

            onUpdated?.();
            onClose();
        } catch (e) {
            setErr(e?.message || "Silme başarısız.");
        } finally {
            setDeleting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            {/* Panel */}
            <div className="absolute inset-y-0 right-0 w-full max-w-3xl bg-white shadow-xl flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                            Talep Detayı #{row ? (row.id || "").toString().slice(0, 8) : ""}
                        </h3>
                        {row && <StatusBadge status={row.status} />}
                    </div>
                    <div className="flex items-center gap-2">
                        {!edit ? (
                            <button
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border hover:bg-gray-50"
                                onClick={() => setEdit(true)}
                                disabled={loading}
                                title="Düzenle"
                            >
                                <Pencil size={16} /> Düzenle
                            </button>
                        ) : (
                            <>
                                <button
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border hover:bg-gray-50"
                                    onClick={() => {
                                        setEdit(false);
                                        if (row) {
                                            setFSubject(row.subject || "");
                                            setFCategory(row.category || "Donanım");
                                            setFPriority(row.priority || "Normal");
                                            setFVisible(!!row.visible_to_company);
                                            setFPrinterId(row.printer_id || "");
                                            setFAssigned(row.assigned_to || "");
                                        }
                                    }}
                                    disabled={saving}
                                >
                                    Vazgeç
                                </button>
                                <button
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-white ${saving ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
                                    onClick={onSave}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    Kaydet
                                </button>
                            </>
                        )}
                        <button
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border hover:bg-gray-50"
                            onClick={onClose}
                            title="Kapat"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Tablar */}
                <div className="px-5 pt-3 flex gap-2 border-b">
                    <button
                        onClick={() => setTab("events")}
                        className={`px-3 py-2 rounded-t-lg ${tab === "events" ? "bg-gray-900 text-white" : "bg-gray-100"}`}
                    >
                        Olaylar
                    </button>
                    <button
                        onClick={() => setTab("details")}
                        className={`px-3 py-2 rounded-t-lg ${tab === "details" ? "bg-gray-900 text-white" : "bg-gray-100"}`}
                    >
                        Detaylar
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-gray-500">
                            <Loader2 size={24} className="animate-spin mr-2" /> Yükleniyor…
                        </div>
                    ) : err ? (
                        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 p-3">{err}</div>
                    ) : !row ? (
                        <div className="text-gray-500">Kayıt bulunamadı.</div>
                    ) : tab === "events" ? (
                        <EventsList events={events} actors={actors} />
                    ) : (
                        <DetailsView
                            row={row}
                            edit={edit}
                            attachments={attachments}
                            printers={printers}
                            techs={techs}
                            currentPrinter={currentPrinter}
                            currentTech={currentTech}
                            fSubject={fSubject} setFSubject={setFSubject}
                            fCategory={fCategory} setFCategory={setFCategory}
                            fPriority={fPriority} setFPriority={setFPriority}
                            fVisible={fVisible} setFVisible={setFVisible}
                            fPrinterId={fPrinterId} setFPrinterId={setFPrinterId}
                            fAssigned={fAssigned} setFAssigned={setFAssigned}
                            onDelete={onDelete}
                            deleting={deleting}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/* --------- Alt bileşenler --------- */

function StatusBadge({ status }) {
    const map = {
        OPEN: { bg: "bg-gray-100", text: "text-gray-800", label: "Açık" },
        IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-800", label: "Devam Ediyor" },
        WAITING_PARTS: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Parça/Onay Bekliyor" },
        RESOLVED: { bg: "bg-green-100", text: "text-green-800", label: "Çözüldü" },
        SHIPPED: { bg: "bg-purple-100", text: "text-purple-800", label: "Kargolandı" },
    };
    const s = map[status] || map.OPEN;
    return (
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${s.bg} ${s.text}`}>
            {s.label}
        </span>
    );
}

function EventsList({ events, actors }) {
    if (!events?.length) return <div className="text-gray-500">Olay bulunamadı.</div>;
    return (
        <ul className="space-y-4">
            {events.map(e => (
                <li key={e.id} className="flex items-start gap-3">
                    <div className="mt-0.5">
                        {e.event_type === "status_changed" ? (
                            <CheckCircle className="text-green-600" size={18} />
                        ) : e.event_type === "assigned" ? (
                            <User2 className="text-purple-600" size={18} />
                        ) : e.event_type === "attachment_added" ? (
                            <Paperclip className="text-slate-600" size={18} />
                        ) : (
                            <Clock className="text-gray-500" size={18} />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="text-sm">
                            <span className="font-medium">
                                {actors[e.actor_id] || (e.actor_role ? e.actor_role : "system")}
                            </span>{" "}
                            {renderEventTitle(e)}
                        </div>
                        <div className="text-xs text-gray-500">
                            {new Date(e.created_at).toLocaleString("tr-TR")}
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

function renderEventTitle(e) {
    const p = e.payload || {};
    switch (e.event_type) {
        case "created":
            return <>talebi oluşturdu</>;
        case "status_changed":
            return <>durumu <b>{p.from || "—"}</b> → <b>{p.to || "—"}</b> olarak değiştirdi</>;
        case "assigned":
            return <>teknisyen ataması yaptı</>;
        case "printer_changed":
            return <>ilişkili yazıcıyı değiştirdi</>;
        case "subject_changed":
            return <>konuyu güncelledi</>;
        case "visibility_changed":
            return <>görünürlüğü güncelledi</>;
        case "attachment_added":
            return <>ek dosya yüklendi</>;
        default:
            return <>işlem yaptı</>;
    }
}

function DetailsView(props) {
    const {
        row, edit, attachments, printers, techs, currentPrinter, currentTech,
        fSubject, setFSubject,
        fCategory, setFCategory,
        fPriority, setFPriority,
        fVisible, setFVisible,
        fPrinterId, setFPrinterId,
        fAssigned, setFAssigned,
        onDelete,
        deleting
    } = props;

    return (
        <div className="space-y-6">
            {/* Üst Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Konu */}
                <div>
                    <div className="text-xs text-gray-500 mb-1">Konu</div>
                    {!edit ? (
                        <div className="text-sm font-medium">{row.subject || "—"}</div>
                    ) : (
                        <input
                            className="w-full border rounded px-2 py-1.5"
                            value={fSubject}
                            onChange={e => setFSubject(e.target.value)}
                            placeholder="Konu"
                        />
                    )}
                </div>

                {/* Görünürlük */}
                <div>
                    <div className="text-xs text-gray-500 mb-1">Görünürlük</div>
                    {!edit ? (
                        <div className="text-sm">
                            {row.visible_to_company ? "Firmaya görünür" : "Sadece iç ekip"}
                        </div>
                    ) : (
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={fVisible} onChange={e => setFVisible(e.target.checked)} />
                            Firmaya görünür olsun
                        </label>
                    )}
                </div>

                {/* Kategori */}
                <div>
                    <div className="text-xs text-gray-500 mb-1">Kategori</div>
                    {!edit ? (
                        <div className="text-sm">{row.category || "—"}</div>
                    ) : (
                        <select className="w-full border rounded px-2 py-1.5" value={fCategory} onChange={e => setFCategory(e.target.value)}>
                            {CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    )}
                </div>

                {/* Öncelik */}
                <div>
                    <div className="text-xs text-gray-500 mb-1">Öncelik</div>
                    {!edit ? (
                        <div className="text-sm">{row.priority || "Normal"}</div>
                    ) : (
                        <select className="w-full border rounded px-2 py-1.5" value={fPriority} onChange={e => setFPriority(e.target.value)}>
                            {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    )}
                </div>

                {/* Yazıcı */}
                <div>
                    <div className="text-xs text-gray-500 mb-1">Yazıcı</div>
                    {!edit ? (
                        currentPrinter ? (
                            <div className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                <Factory size={14} /> {currentPrinter.asset_code}
                            </div>
                        ) : <div className="text-sm text-gray-500">—</div>
                    ) : (
                        <select className="w-full border rounded px-2 py-1.5" value={fPrinterId} onChange={e => setFPrinterId(e.target.value)}>
                            <option value="">— seçilmedi —</option>
                            {printers.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.asset_code} {p.model ? `• ${p.model}` : ""} {p.department ? `• ${p.department}` : ""} {p.floor ? `• ${p.floor}` : ""}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Teknisyen */}
                <div>
                    <div className="text-xs text-gray-500 mb-1">Teknisyen</div>
                    {!edit ? (
                        currentTech ? (
                            <div className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                <User2 size={14} /> {currentTech.display_name || `#${currentTech.id.slice(0, 8)}`}
                            </div>
                        ) : <div className="text-sm text-gray-500">Atanmamış</div>
                    ) : (
                        <select className="w-full border rounded px-2 py-1.5" value={fAssigned} onChange={e => setFAssigned(e.target.value)}>
                            <option value="">— seçilmedi —</option>
                            {techs.map(t => (
                                <option key={t.id} value={t.id}>{t.display_name?.trim() ? t.display_name : `#${t.id.slice(0, 8)}`}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Tarihler */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Oluşturulma</div>
                        <div className="text-sm">{row.created_at ? new Date(row.created_at).toLocaleString("tr-TR") : "—"}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Atanma</div>
                        <div className="text-sm">{row.assigned_at ? new Date(row.assigned_at).toLocaleString("tr-TR") : "—"}</div>
                    </div>
                </div>
            </div>

            {/* Mesaj */}
            <div>
                <div className="text-xs text-gray-500 mb-1">Mesaj</div>
                <div className="bg-gray-50 border rounded p-3 whitespace-pre-wrap text-sm">
                    {row.message || "—"}
                </div>
            </div>

            {/* Ekler */}
            <div>
                <div className="text-xs text-gray-500 mb-2">Ekler</div>
                {attachments.length === 0 ? (
                    <div className="text-sm text-gray-500">—</div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {attachments.map(a => {
                            const isImg = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(a.path);
                            return (
                                <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="inline-block" title={a.path}>
                                    {isImg ? (
                                        <img src={a.url} alt="" className="w-20 h-20 object-cover rounded border" />
                                    ) : (
                                        <div className="text-xs px-2 py-1 border rounded bg-white">Dosya</div>
                                    )}
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Tehlikeli alan */}
            <div className="pt-3 border-t">
                <button
                    onClick={onDelete}
                    disabled={deleting}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-red-600 hover:bg-red-50 ${deleting ? "opacity-60" : ""}`}
                    title="Kalıcı olarak sil"
                >
                    {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    Talebi Sil
                </button>
            </div>
        </div>
    );
}
