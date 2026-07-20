import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const KID_EMAIL_DOMAIN = "kidsday.app";

// Starter tasks seeded for every newly created kid. Parent can edit/delete
// or add more later via Parent Dashboard.
const INITIAL_KID_TASKS: Array<{
  title: string;
  title_ru: string;
  category:
    | "Hygiene"
    | "Chores"
    | "Self-Education"
    | "Reading"
    | "Piano"
    | "Chess"
    | "Sports"
    | "Creative";
  coins: number;
  frequency: "daily" | "weekly";
  days_of_week: number[];
  schedule_type: "school_days" | "holidays" | "always";
}> = [
  {
    title: "Early wake-up (6–7 AM)",
    title_ru: "Ранний подъём (6–7 утра)",
    category: "Hygiene",
    coins: 10,
    frequency: "daily",
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    schedule_type: "always",
  },
  {
    title: "Workout or morning exercise",
    title_ru: "Тренировка или зарядка",
    category: "Sports",
    coins: 10,
    frequency: "daily",
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    schedule_type: "always",
  },
  {
    title: "Book notes / summary of today's reading",
    title_ru: "Конспект прочитанного за день",
    category: "Reading",
    coins: 15,
    frequency: "daily",
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    schedule_type: "always",
  },
  {
    title: "Home responsibility (chore around the house)",
    title_ru: "Домашняя обязанность",
    category: "Chores",
    coins: 10,
    frequency: "daily",
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    schedule_type: "always",
  },
  {
    title: "Creative project (make something by hand)",
    title_ru: "Творческий проект своими руками",
    category: "Creative",
    coins: 15,
    frequency: "daily",
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    schedule_type: "always",
  },
];

const createKidSchema = z.object({
  name: z.string().min(1).max(60),
  emoji: z.string().min(1).max(8).default("🙂"),
  pin: z.string().regex(/^\d{6}$/, "PIN must be 6 digits"),
});

export const createKidFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createKidSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Find current parent profile id
    const { data: parentProfile, error: pErr } = await context.supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", context.userId)
      .eq("role", "parent")
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!parentProfile) throw new Error("Parent profile not found");

    // Ensure PIN unique (check the private kid_secrets table).
    const { data: existing } = await supabaseAdmin
      .from("kid_secrets" as never)
      .select("profile_id")
      .eq("pin_code", data.pin)
      .maybeSingle();
    if (existing) throw new Error("PIN already in use, pick another");

    const email = `kid-${crypto.randomUUID()}@${KID_EMAIL_DOMAIN}`;
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.pin,
      email_confirm: true,
      user_metadata: { kind: "kid", name: data.name, parent_id: parentProfile.id },
    });
    if (cErr || !created.user) throw new Error(cErr?.message ?? "Failed to create auth user");

    const { data: profile, error: insErr } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: created.user.id,
        parent_id: parentProfile.id,
        role: "kid",
        name: data.name,
        emoji: data.emoji,
      })
      .select("*")
      .single();
    if (insErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(insErr.message);
    }

    const { error: secErr } = await supabaseAdmin
      .from("kid_secrets" as never)
      .insert({ profile_id: profile.id, pin_code: data.pin } as never);
    if (secErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(secErr.message);
    }

    // Seed starter tasks for this kid (per-kid, not per-family).
    const taskRows = INITIAL_KID_TASKS.map((t) => ({
      ...t,
      parent_id: parentProfile.id,
      assignee_id: profile.id,
    }));
    const { error: seedErr } = await supabaseAdmin.from("tasks").insert(taskRows);
    if (seedErr) {
      // Non-fatal: kid was created successfully; log and continue.
      console.error("[createKidFn] failed to seed starter tasks", seedErr);
    }

    return { profile };
  });

const deleteKidSchema = z.object({ kidId: z.string().uuid() });

export const deleteKidFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteKidSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: kid } = await context.supabase
      .from("profiles")
      .select("id, user_id")
      .eq("id", data.kidId)
      .maybeSingle();
    if (!kid) throw new Error("Kid not found");
    if (kid.user_id) {
      await supabaseAdmin.auth.admin.deleteUser(kid.user_id);
    }
    // kid_secrets row is removed by ON DELETE CASCADE on profile deletion.
    const { error } = await supabaseAdmin.from("profiles").delete().eq("id", data.kidId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const regenPinSchema = z.object({
  kidId: z.string().uuid(),
  pin: z.string().regex(/^\d{6}$/),
});

export const regenerateKidPinFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => regenPinSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: kid } = await context.supabase
      .from("profiles")
      .select("id, user_id, parent_id")
      .eq("id", data.kidId)
      .maybeSingle();
    if (!kid || !kid.user_id) throw new Error("Kid not found");

    const { data: dup } = await supabaseAdmin
      .from("kid_secrets" as never)
      .select("profile_id")
      .eq("pin_code", data.pin)
      .neq("profile_id", data.kidId)
      .maybeSingle();
    if (dup) throw new Error("PIN already in use");

    const { error: aErr } = await supabaseAdmin.auth.admin.updateUserById(kid.user_id, {
      password: data.pin,
    });
    if (aErr) throw new Error(aErr.message);
    const { error: uErr } = await supabaseAdmin
      .from("kid_secrets" as never)
      .upsert({ profile_id: data.kidId, pin_code: data.pin } as never, {
        onConflict: "profile_id",
      });
    if (uErr) throw new Error(uErr.message);
    return { ok: true };
  });

const pinLookupSchema = z.object({ pin: z.string().regex(/^\d{6}$/) });

// Public — no auth required. Looks up the technical email by PIN
// so the client can sign in with email+password (password === pin).
export const lookupKidEmailByPinFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => pinLookupSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: secret, error } = await supabaseAdmin
      .from("kid_secrets" as never)
      .select("profile_id")
      .eq("pin_code", data.pin)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const profileId = (secret as { profile_id?: string } | null)?.profile_id;
    if (!profileId) throw new Error("Invalid PIN");
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, role")
      .eq("id", profileId)
      .eq("role", "kid")
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile?.user_id) throw new Error("Invalid PIN");
    const { data: userRes, error: uErr } = await supabaseAdmin.auth.admin.getUserById(
      profile.user_id,
    );
    if (uErr || !userRes.user?.email) throw new Error("Kid account missing");
    return { email: userRes.user.email, name: profile.name };
  });
