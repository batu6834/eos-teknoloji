import { useEffect, useState } from "react";
import supabaseAdmin from "../supabaseAdminClient";

export function useOutlierTickets10BD({ from, to, companyName, technicianId }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true); setError(null);
                const start = new Date(from); start.setHours(0, 0, 0, 0);
                const end = new Date(to); end.setHours(0, 0, 0, 0);

                const { data, error } = await supabaseAdmin.rpc("outlier_tickets_10bd", {
                    p_from: start.toISOString(),
                    p_to: end.toISOString(),
                    p_company_name: companyName || null,
                    p_technician_id: technicianId || null,
                });
                if (cancelled) return;
                if (error) throw error;
                setRows(data || []);
            } catch (e) {
                if (!cancelled) setError(e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [from, to, companyName, technicianId]);

    return { rows, loading, error };
}
