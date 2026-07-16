import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { enqueuer } from "@/lib/pipeline/queue";
import { executerScan } from "@/lib/pipeline/run-scan";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "non_authentifie" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const secteur = typeof body?.secteur === "string" ? body.secteur.trim() : "";
  const ville = typeof body?.ville === "string" ? body.ville.trim() : "";
  const rayonKm = Number(body?.rayon_km);

  if (!secteur || !ville || !Number.isFinite(rayonKm) || rayonKm <= 0) {
    return NextResponse.json(
      { error: "parametres_invalides" },
      { status: 400 },
    );
  }

  const scan = await prisma.scan.create({
    data: {
      secteur,
      ville,
      rayon_km: Math.round(rayonKm),
      statut: "en_attente",
    },
  });

  enqueuer(() => executerScan(scan.id));

  return NextResponse.json({ id: scan.id }, { status: 201 });
}
