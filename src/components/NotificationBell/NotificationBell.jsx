// src/components/NotificationBell/NotificationBell.jsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FiInbox } from "react-icons/fi";

export default function NotificationBell() {
    const { supabase, user } = useAuth();
    const [items, setItems] = useState([]);
    const [companyName, setCompanyName] = useState(null);
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const btnRef = useRef(null);

    useEffect(() => {
        if (!user?.id) return;
        let channel;

        (async () => {
            const { data: me } = await supabase
                .from("profiles")
                .select("id, company_name")
                .eq("id", user.id)
                .single();

            if (!me?.company_name) return;
            setCompanyName(me.company_name);

            const { data: initial } = await supabase
                .from("notifications")
                .select("*")
                .eq("target_company", me.company_name)
                .order("created_at", { ascending: false });
            if (initial) setItems(initial);

            channel = supabase
                .channel("realtime:notifications")
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                        filter: `target_company=eq.${me.company_name}`,
                    },
                    (payload) => setItems((prev) => [payload.new, ...prev])
                )
                .subscribe();
        })();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [user?.id, supabase]);

    const markAsRead = async (id) => {
        const { data, error } = await supabase
            .from("notifications")
            .update({ read_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();
        if (!error && data) {
            setItems((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read_at: data.read_at } : n))
            );
        }
    };

    const markAllAsRead = async () => {
        const unreadIds = items.filter((n) => !n.read_at).map((n) => n.id);
        if (unreadIds.length === 0) return;
        const now = new Date().toISOString();

        const { error } = await supabase
            .from("notifications")
            .update({ read_at: now })
            .in("id", unreadIds);

        if (!error) {
            setItems((prev) => prev.map((n) => ({ ...n, read_at: now })));
        }
    };

    useEffect(() => {
        const onDown = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        const onClick = (e) => {
            if (
                open &&
                menuRef.current &&
                !menuRef.current.contains(e.target) &&
                btnRef.current &&
                !btnRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        window.addEventListener("keydown", onDown);
        window.addEventListener("mousedown", onClick);
        return () => {
            window.removeEventListener("keydown", onDown);
            window.removeEventListener("mousedown", onClick);
        };
    }, [open]);

    const typeStyles = {
        STATUS: { icon: "🔄", color: "text-blue-600" },
        ASSIGNMENT: { icon: "👨‍🔧", color: "text-orange-600" },
        MESSAGE: { icon: "✉️", color: "text-gray-600" },
        GENERAL: { icon: "ℹ️", color: "text-green-600" },
    };

    const unreadCount = items.filter((n) => !n.read_at).length;

    return (
        <div className="relative">
            <button
                ref={btnRef}
                className="relative rounded-full p-2"
                title={companyName || "Bildirimler"}
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() => setOpen((s) => !s)}
            >
                <FiInbox className="text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    ref={menuRef}
                    role="menu"
                    className="absolute right-0 mt-2 w-80 rounded-xl border bg-white p-2 shadow-xl z-50"
                >
                    <div className="flex justify-between items-center px-2 pb-2 text-xs font-semibold text-gray-500">
                        <span>Bildirimler</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-blue-600 hover:underline"
                            >
                                Tümünü okundu yap
                            </button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className="px-3 py-6 text-sm text-gray-500">
                            Henüz bildirim yok.
                        </div>
                    ) : (
                        <ul className="max-h-96 overflow-auto">
                            {items.map((n) => (
                                <li
                                    key={n.id}
                                    className={`flex items-start gap-2 rounded-lg p-2 hover:bg-gray-50 ${n.read_at
                                            ? "bg-gray-100 text-gray-500"
                                            : "bg-blue-50 text-black font-medium"
                                        }`}
                                >
                                    <div
                                        className={`mt-0.5 text-lg ${typeStyles[n.type]?.color || "text-gray-600"
                                            }`}
                                    >
                                        {typeStyles[n.type]?.icon || "💬"}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-medium">{n.type}</div>
                                        <div className="text-sm">{n.message}</div>
                                        <div className="mt-1 text-xs text-gray-400">
                                            {new Date(n.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    {!n.read_at && (
                                        <button
                                            onClick={() => markAsRead(n.id)}
                                            className="rounded-md border px-2 py-1 text-xs hover:bg-gray-100 text-black"
                                        >
                                            Okundu
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
