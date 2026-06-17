import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** POST /api/admin/markets/:id/resolve  body: { outcome: "YES"|"NO", settlementSource?: string } */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdminSecret(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { outcome, settlementSource } = body as {
    outcome?: string;
    settlementSource?: string;
  };
  if (outcome !== "YES" && outcome !== "NO") {
    return NextResponse.json({ error: "outcome must be YES or NO" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("resolve_market", {
    p_market_id: id,
    p_outcome: outcome,
    p_settlement_source: settlementSource ?? "admin",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}
