import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const findUserByEmail = async (admin: ReturnType<typeof createClient>, email: string) => {
  const target = email.trim().toLowerCase();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const found = data.users.find((u) => u.email?.trim().toLowerCase() === target);
    if (found) return found;
    if (data.users.length < 1000) break;
    page += 1;
  }

  return null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden: admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { request_id, action } = await req.json();
    if (!request_id || !["approve", "reject", "revoke"].includes(action)) {
      return new Response(JSON.stringify({ error: "invalid payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: reqRow, error: reqErr } = await admin
      .from("signup_requests").select("*").eq("id", request_id).maybeSingle();
    if (reqErr || !reqRow) {
      return new Response(JSON.stringify({ error: "request not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke") {
      // Cancel/disable the user account: delete auth user and mark request rejected
      const target = await findUserByEmail(admin, reqRow.email);
      if (target) {
        await admin.auth.admin.deleteUser(target.id);
      }
      await admin.from("signup_requests").update({
        status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: user.id,
      }).eq("id", request_id);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (reqRow.status !== "pending") {
      return new Response(JSON.stringify({ error: "already reviewed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reject") {
      await admin.from("signup_requests").update({
        status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: user.id,
      }).eq("id", request_id);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Approve: create the user already confirmed. If the email already exists,
    // reuse that auth user and grant access instead of blocking the approval.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: reqRow.email,
      password: reqRow.password_hash, // stored plain (encrypted at rest); used once to create user
      email_confirm: true,
      user_metadata: { full_name: reqRow.full_name },
    });
    let approvedUser = created.user;

    if (createErr) {
      const alreadyExists = createErr.message.toLowerCase().includes("already") || createErr.message.toLowerCase().includes("registered");
      if (!alreadyExists) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      approvedUser = await findUserByEmail(admin, reqRow.email);
      if (!approvedUser) {
        return new Response(JSON.stringify({ error: "Usuário já existe, mas não foi possível localizá-lo para liberar o acesso." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await admin.auth.admin.updateUserById(approvedUser.id, {
        password: reqRow.password_hash,
        email_confirm: true,
        user_metadata: { ...(approvedUser.user_metadata ?? {}), full_name: reqRow.full_name },
      });
      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!approvedUser) {
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert({ user_id: approvedUser.id, role: "user" }, { onConflict: "user_id,role" });
    if (roleErr) {
      return new Response(JSON.stringify({ error: roleErr.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apply clinic identity from the request to the user's profile
    if (reqRow.clinic_name || reqRow.clinic_logo_url) {
      await admin.from("profiles").update({
        clinic_name: reqRow.clinic_name ?? null,
        clinic_logo_url: reqRow.clinic_logo_url ?? null,
      }).eq("id", approvedUser.id);
    }

    await admin.from("signup_requests").update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      password_hash: "", // clear stored password after use
    }).eq("id", request_id);

    return new Response(JSON.stringify({ ok: true, user_id: approvedUser.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
