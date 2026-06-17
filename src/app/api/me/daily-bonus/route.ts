import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/me/daily-bonus — claim the once-per-JST-day login bonus. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("claim_daily_bonus");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}
