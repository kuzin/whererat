import { NextResponse } from "next/server";
import { closeDbPool, getDbPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = getDbPool();
    const result = await pool.query("select now() as now");
    return NextResponse.json(
      {
        ok: true,
        timestamp: result.rows[0]?.now ?? null,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown DB error",
      },
      { status: 500 },
    );
  } finally {
    // Keep long-lived pool only in production runtime; close quickly in local checks.
    if (process.env.NODE_ENV !== "production") {
      await closeDbPool();
    }
  }
}
