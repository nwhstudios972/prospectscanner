import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { StatutSuivi } from "@/lib/generated/prisma/enums";

const STATUTS_VALIDES: StatutSuivi[] = [
  "nouveau",
  "contacte",
  "en_negociation",
  "converti",
  "perdu",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "non_authentifie" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const statutSuivi = body?.statut_suivi;

  if (
    typeof statutSuivi !== "string" ||
    !STATUTS_VALIDES.includes(statutSuivi as StatutSuivi)
  ) {
    return NextResponse.json({ error: "statut_invalide" }, { status: 400 });
  }

  try {
    const prospect = await prisma.prospect.update({
      where: { id },
      data: { statut_suivi: statutSuivi as StatutSuivi },
    });

    return NextResponse.json({ id: prospect.id, statut_suivi: prospect.statut_suivi });
  } catch {
    return NextResponse.json({ error: "prospect_introuvable" }, { status: 404 });
  }
}
