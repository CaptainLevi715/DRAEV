import { NextRequest, NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/auth";
import { hasSameOrigin, originRejectedResponse } from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return originRejectedResponse();
  await destroyAdminSession();
  return NextResponse.json({ ok: true });
}
