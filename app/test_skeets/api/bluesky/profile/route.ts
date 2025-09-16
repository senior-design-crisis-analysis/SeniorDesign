// app/api/bluesky/profile/route.ts
import { NextResponse } from "next/server";
import { getProfile } from "../../bluesky";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle");

  if (!handle) {
    return NextResponse.json({ error: "Missing ?handle=" }, { status: 400 });
  }

  try {
    const profile = await getProfile(handle);
    return NextResponse.json(profile);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
