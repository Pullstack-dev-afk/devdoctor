import { NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth-server";

export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    return NextResponse.json({ email: user?.email ?? null, isAdmin: user ? isAdmin(user.id) : false });
  } catch {
    return NextResponse.json({ email: null, isAdmin: false });
  }
}