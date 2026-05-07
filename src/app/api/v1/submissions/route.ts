import { NextResponse, type NextRequest } from "next/server";

import { executePublicSightingSubmit } from "@/lib/public-sighting-submit";

export const dynamic = "force-dynamic";

function clientIpFromRequest(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Submit a moderation-queue sighting (same fields as `/submit` HTML form).
 * Multipart upload; field names documented in native client `postSightingSubmission`.
 */
export async function POST(request: NextRequest) {
  const ct = request.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().includes("multipart/form-data")) {
    return NextResponse.json(
      {
        ok: false,
        error: "unsupported_media_type",
        message: "Use multipart/form-data (same shape as web submit).",
      },
      { status: 415 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_request", message: "Could not parse form body." },
      { status: 400 },
    );
  }

  const ip = clientIpFromRequest(request);
  const result = await executePublicSightingSubmit(formData, ip);

  if (!result.ok) {
    const status =
      result.code === "rate-limited"
        ? 429
        : result.code === "missing" || result.code === "no-imdb"
          ? 422
          : 500;
    return NextResponse.json(
      {
        ok: false,
        error: result.code,
        message: result.message ?? result.code,
      },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    submissionId: result.submissionId,
    catalogSlug: result.catalogMatchSlug ?? null,
  });
}
