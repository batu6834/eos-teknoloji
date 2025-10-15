// src/hooks/useTechnicianKPIs.js
import { useEffect, useState } from "react";
import supabaseAdmin from "../supabaseAdminClient";

export function useTechnicianKPIs({ from, to, technicianId, companyName }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true); setError(null);

                const start = new Date(from); start.setHours(0, 0, 0, 0);
                const end = new Date(to); end.setHours(0, 0, 0, 0); end.setDate(end.getDate() + 1);

                let q = supabaseAdmin
                    .from("v_technician_kpis_v3")        // << v3
                    .select("*")
                    .gte("day", start.toISOString())
                    .lt("day", end.toISOString())        // << inclusive end-of-day
                    .order("day", { ascending: true });

                if (technicianId) q = q.eq("technician_id", technicianId);
                if (companyName) q = q.eq("company_name", companyName);

                const { data, error } = await q;
                if (cancelled) return;
                if (error) throw error;
                setData(data ?? []);
            } catch (e) {
                if (!cancelled) setError(e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [from, to, technicianId, companyName]);

    return { data, loading, error };
}
