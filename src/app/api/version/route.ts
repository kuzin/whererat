import { NextResponse } from "next/server";
import versions from "../../../../versions.json";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    web: versions.web,
    api: versions.api,
    ios: { version: versions.ios, build: versions.iosBuild },
    android: { version: versions.android, versionCode: versions.androidBuild },
  });
}
