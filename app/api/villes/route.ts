import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getVillesSuggerees } from "@/lib/queries";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "non_authentifie" }, { status: 401 });
  }

  const villes = await getVillesSuggerees();
  return NextResponse.json(villes);
}
