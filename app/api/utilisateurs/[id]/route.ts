import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.est_admin) {
    return NextResponse.json({ error: "non_autorise" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (typeof body?.actif !== "boolean") {
    return NextResponse.json({ error: "parametres_invalides" }, { status: 400 });
  }

  if (id === session.user.id && body.actif === false) {
    return NextResponse.json(
      { error: "auto_desactivation_interdite" },
      { status: 400 },
    );
  }

  const cible = await prisma.utilisateur.findUnique({ where: { id } });
  if (!cible) {
    return NextResponse.json({ error: "utilisateur_introuvable" }, { status: 404 });
  }

  if (cible.est_admin && body.actif === false) {
    const nombreAdminsActifs = await prisma.utilisateur.count({
      where: { est_admin: true, actif: true },
    });
    if (nombreAdminsActifs <= 1) {
      return NextResponse.json(
        { error: "dernier_admin_actif" },
        { status: 400 },
      );
    }
  }

  const utilisateur = await prisma.utilisateur.update({
    where: { id },
    data: { actif: body.actif },
    select: { id: true, actif: true },
  });

  return NextResponse.json(utilisateur);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.est_admin) {
    return NextResponse.json({ error: "non_autorise" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "auto_suppression_interdite" },
      { status: 400 },
    );
  }

  const cible = await prisma.utilisateur.findUnique({ where: { id } });
  if (!cible) {
    return NextResponse.json({ error: "utilisateur_introuvable" }, { status: 404 });
  }

  if (cible.est_admin && cible.actif) {
    const nombreAdminsActifs = await prisma.utilisateur.count({
      where: { est_admin: true, actif: true },
    });
    if (nombreAdminsActifs <= 1) {
      return NextResponse.json(
        { error: "dernier_admin_actif" },
        { status: 400 },
      );
    }
  }

  await prisma.utilisateur.delete({ where: { id } });

  return NextResponse.json({ id });
}
