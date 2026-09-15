import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import PhoneVerification from "../../components/PhoneVerification";

export const metadata = { title: "Verify Your Phone — InfinityVolume" };

export default async function VerifyPhonePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // If already verified, skip to member
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_verified, created_at")
    .eq("id", user.id)
    .single();

  // If already verified, or legacy account (requires_phone_verify explicitly false), skip
  if (profile?.phone_verified || profile?.requires_phone_verify === false) {
    redirect("/member");
  }

  return <PhoneVerification />;
}
