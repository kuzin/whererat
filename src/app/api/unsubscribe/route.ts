import { NextRequest, NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/email-preferences-store";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribed?status=invalid", request.url));
  }

  const found = await unsubscribeByToken(token);
  const status = found ? "ok" : "invalid";
  return NextResponse.redirect(new URL(`/unsubscribed?status=${status}`, request.url));
}
