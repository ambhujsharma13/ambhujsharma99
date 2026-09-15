// DEV ONLY — delete before production
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const LEGACY_IDS = [
  '83574073-6400-4a28-9fc6-ac3cbfc1b89c',
  '94120cd8-4757-4bc6-9fbb-a3759be27e18',
  '6a3f4519-d297-47ff-8a8c-6f5a0890bf38',
  'ebdd562e-485b-47de-8b0b-d430e0733273',
  '77a3e916-9d27-4533-af78-7df62b8c6ef2',
];

export async function POST(request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }
  const { email } = await request.json();
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Add requires_phone_verify column if missing and set legacy accounts
  await admin.from("profiles").select("id").limit(1); // warm up connection
  
  // Confirm user email
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });
  const user = users.find(u => u.email === email);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  
  const { error } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark legacy accounts as not requiring phone verify
  for (const id of LEGACY_IDS) {
    await admin.from("profiles").update({ requires_phone_verify: false }).eq("id", id);
  }

  return NextResponse.json({ ok: true, userId: user.id, confirmed: true, legacyUpdated: LEGACY_IDS.length });
}
