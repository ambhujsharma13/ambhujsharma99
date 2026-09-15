import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  revalidatePath("/");
  revalidatePath("/member/admin/review");
  return NextResponse.json({ revalidated: true });
}
