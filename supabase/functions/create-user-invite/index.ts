// supabase/functions/create-user-invite/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { URL, SERVICE_ROLE_KEY, FRONTEND_URL } = Deno.env.toObject();
        const admin = createClient(URL!, SERVICE_ROLE_KEY!);
        const redirectTo = FRONTEND_URL || "http://localhost:3000/auth/callback";

        // Basit kontrol (opsiyonel)
        const authHeader = req.headers.get("authorization") ?? "";
        if (!authHeader) {
            return new Response("Missing Authorization", { status: 401, headers: corsHeaders });
        }

        const { email, role = "company", company_name, display_name } = await req.json();
        if (!email) {
            return new Response("email gerekli", { status: 400, headers: corsHeaders });
        }

        // 1) Invite dene
        const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
            email,
            { data: { role, company_name: company_name ?? null, display_name: display_name ?? null } },
        );

        let userId: string | undefined;
        let mode: "invite_sent" | "existing_user_recovery_sent";
        let action_link: string | undefined;

        if (inviteErr) {
            // 1.a) Kullanıcı zaten varsa: recovery link üret
            if (inviteErr.message?.includes("already registered")) {
                const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
                    type: "recovery",
                    email,
                    options: { redirectTo },
                });
                if (linkErr) {
                    return new Response(linkErr.message, { status: 400, headers: corsHeaders });
                }
                userId = linkData.user?.id;
                if (!userId) {
                    return new Response("Kullanıcı bulunamadı", { status: 400, headers: corsHeaders });
                }

                // profiles upsert
                const { error: upsertErr } = await admin
                    .from("profiles")
                    .upsert(
                        role === "company"
                            ? { id: userId, role: "company", company_name, approved: false }
                            : { id: userId, role: "tech", display_name, is_active: true },
                        { onConflict: "id" },
                    );
                if (upsertErr) {
                    return new Response(upsertErr.message, { status: 400, headers: corsHeaders });
                }

                mode = "existing_user_recovery_sent";
                action_link = linkData.properties?.action_link;
            } else {
                // başka hata
                return new Response(inviteErr.message, { status: 400, headers: corsHeaders });
            }
        } else {
            // 1.b) Invite başarılı: userId al + davet linkini özellikle üret (action_link döndürmek için)
            userId = inviteData.user?.id;
            if (!userId) {
                return new Response("user_id alınamadı", { status: 400, headers: corsHeaders });
            }

            const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
                type: "invite",
                email,
                options: { redirectTo },
            });
            if (linkErr) {
                return new Response(linkErr.message, { status: 400, headers: corsHeaders });
            }
            action_link = linkData.properties?.action_link;

            // profiles upsert
            const { error: upsertErr } = await admin
                .from("profiles")
                .upsert(
                    role === "company"
                        ? { id: userId, role: "company", company_name, approved: false }
                        : { id: userId, role: "tech", display_name, is_active: true },
                    { onConflict: "id" },
                );
            if (upsertErr) {
                return new Response(upsertErr.message, { status: 400, headers: corsHeaders });
            }

            mode = "invite_sent";
        }

        return new Response(
            JSON.stringify({ user_id: userId, mode, action_link }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    } catch (e) {
        return new Response(e?.message ?? "Unexpected error", {
            status: 500,
            headers: corsHeaders,
        });
    }
});
