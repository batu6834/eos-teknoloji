import { useState, useEffect, useCallback } from "react";
import supabaseAdmin from "../../supabaseAdminClient";

// yyyy-mm-dd (local)
const toDateInput = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};
// günün başı/sonu -> ISO
const startOfDayISO = (dateStr) => new Date(`${dateStr}T00:00:00`).toISOString();
const endOfDayISO = (dateStr) => new Date(`${dateStr}T23:59:59.999`).toISOString();

export default function FilterBar({ onChange }) {
    const today = new Date();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [from, setFrom] = useState(toDateInput(weekAgo));
    const [to, setTo] = useState(toDateInput(today));

    const [companies, setCompanies] = useState([]);     // [{id, name}]
    const [companyId, setCompanyId] = useState("");     // "" = All
    const [companyName, setCompanyName] = useState(""); // gösterim/geriye uyum için
    const [techs, setTechs] = useState([]);             // [{id, display_name}]
    const [technicianId, setTechnicianId] = useState("");

    const apply = useCallback(() => {
        // tarih doğrulama
        const fromD = new Date(from);
        const toD = new Date(to);
        const [safeFrom, safeTo] = fromD <= toD ? [from, to] : [to, from];

        onChange({
            from: startOfDayISO(safeFrom),
            to: endOfDayISO(safeTo),
            companyId: companyId || null,       // 🔧 sorgularda bunu kullan
            companyName: companyName || null,   // (opsiyonel, gösterim için)
            technicianId: technicianId || null,
        });
    }, [from, to, companyId, companyName, technicianId, onChange]);

    // Şirket listesi (id + ad)
    useEffect(() => {
        let alive = true;
        (async () => {
            const { data: profs, error } = await supabaseAdmin
                .from("profiles")
                .select("id, company_name, role, approved")
                .eq("role", "company")
                .eq("approved", true);

            let list = [];
            if (!error && profs?.length) {
                list = profs
                    .map(p => ({ id: p.id, name: (p.company_name || "").trim() }))
                    .filter(x => !!x.name);
            }

            // fallback: support_tickets.company_name (id yoksa)
            if (list.length === 0) {
                const { data: tickets } = await supabaseAdmin
                    .from("support_tickets")
                    .select("company_name");
                const names = Array.from(new Set((tickets || [])
                    .map(t => (t.company_name || "").trim())
                    .filter(Boolean)));
                list = names.map(n => ({ id: null, name: n }));
            }

            list.sort((a, b) => a.name.localeCompare(b.name, "tr"));
            if (alive) setCompanies(list);
        })();
        return () => { alive = false; };
    }, []);

    // Teknisyen listesi
    useEffect(() => {
        let alive = true;
        (async () => {
            const { data, error } = await supabaseAdmin
                .from("profiles")
                .select("id, display_name")
                .eq("role", "tech")
                .eq("is_active", true)
                .order("display_name", { ascending: true });
            if (alive) setTechs(error ? [] : (data || []));
        })();
        return () => { alive = false; };
    }, []); // 🔧 companyName bağımlılığını kaldırdık

    // ilk yükte uygula (istemiyorsan bu effect'i silebilirsin)
    useEffect(() => { apply(); /* eslint-disable-next-line */ }, []);

    // hızlı tarih kısayolları
    const setLastNDays = (n) => {
        const toD = new Date();
        const fromD = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
        setFrom(toDateInput(fromD));
        setTo(toDateInput(toD));
    };
    const setThisWeek = () => {
        const now = new Date();
        const first = new Date(now);
        first.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Pazartesi
        setFrom(toDateInput(first));
        setTo(toDateInput(now));
    };
    const setThisMonth = () => {
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        setFrom(toDateInput(first));
        setTo(toDateInput(now));
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-4 items-end">
            <div>
                <label className="block text-xs font-medium" htmlFor="f-from">From</label>
                <input
                    id="f-from" type="date" value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="border rounded px-2 py-1"
                />
            </div>

            <div>
                <label className="block text-xs font-medium" htmlFor="f-to">To</label>
                <input
                    id="f-to" type="date" value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="border rounded px-2 py-1"
                />
            </div>

            <div className="flex items-center gap-2">
                <button onClick={() => setLastNDays(7)} className="text-xs px-2 py-1 border rounded">Son 7g</button>
                <button onClick={() => setLastNDays(30)} className="text-xs px-2 py-1 border rounded">Son 30g</button>
                <button onClick={setThisWeek} className="text-xs px-2 py-1 border rounded">Bu Hafta</button>
                <button onClick={setThisMonth} className="text-xs px-2 py-1 border rounded">Bu Ay</button>
            </div>

            <div>
                <label className="block text-xs font-medium" htmlFor="f-company">Company</label>
                <select
                    id="f-company"
                    value={companyId ? `id:${companyId}` : companyName}
                    onChange={(e) => {
                        const v = e.target.value;
                        if (v.startsWith("id:")) {
                            setCompanyId(v.slice(3));
                            const found = companies.find(c => c.id === v.slice(3));
                            setCompanyName(found?.name || "");
                        } else {
                            setCompanyId("");
                            setCompanyName(v); // id yoksa isimle filtre
                        }
                    }}
                    className="border rounded px-2 py-1 min-w-[220px]"
                >
                    <option value="">All Companies</option>
                    {companies.map((c) => (
                        <option key={`${c.id || "name"}:${c.name}`} value={c.id ? `id:${c.id}` : c.name}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium" htmlFor="f-tech">Technician</label>
                <select
                    id="f-tech"
                    value={technicianId}
                    onChange={(e) => setTechnicianId(e.target.value)}
                    className="border rounded px-2 py-1 min-w-[220px]"
                >
                    <option value="">All Technicians</option>
                    {techs.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.display_name?.trim() || t.id}
                        </option>
                    ))}
                </select>
            </div>

            <div className="ml-auto flex items-center gap-2">
                <button
                    onClick={apply}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                    Apply
                </button>
                <button
                    onClick={() => {
                        setCompanyId(""); setCompanyName("");
                        setTechnicianId("");
                        setFrom(toDateInput(weekAgo)); setTo(toDateInput(today));
                        setTimeout(apply, 0);
                    }}
                    className="px-3 py-2 border rounded-md"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
