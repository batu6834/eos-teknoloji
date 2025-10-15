// src/components/ProtectedAdminRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import supabaseAdmin from '../supabaseAdminClient'; // ← sadece admin client

export default function ProtectedAdminRoute({ children }) {
    const [state, setState] = useState({ loading: true, allowed: false });

    useEffect(() => {
        let alive = true;
        (async () => {
            // 1) Admin oturumu var mı? (admin storage key: eos-admin-auth)
            const { data: { session } } = await supabaseAdmin.auth.getSession();
            if (!session) {
                if (alive) setState({ loading: false, allowed: false });
                return;
            }

            // 2) Bu kullanıcının profili admin mi?
            const { data: prof, error } = await supabaseAdmin
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (!alive) return;
            if (error || prof?.role !== 'admin') {
                setState({ loading: false, allowed: false });
            } else {
                setState({ loading: false, allowed: true });
            }
        })();

        return () => { alive = false; };
    }, []);

    if (state.loading) {
        return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
    }
    if (!state.allowed) {
        return <Navigate to="/admin/login" replace />;
    }
    return children;
}
