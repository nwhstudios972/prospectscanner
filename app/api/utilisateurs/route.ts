import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { estEmailValide } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.est_admin) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "non_autorise" }, { status: 403 });
  }

  const utilisateurs = await prisma.utilisateur.findMany({
    select: {
      id: true,
      email: true,
      est_admin: true,
      actif: true,
      date_creation: true,
    },
    orderBy: { date_creation: "asc" },
  });

  return NextResponse.json(utilisateurs);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "non_autorise" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const estAdmin = Boolean(body?.est_admin);

  if (!email || password.length < 8 || !estEmailValide(email)) {
    return NextResponse.json(
      { error: "parametres_invalides" },
      { status: 400 },
    );
  }

  const existant = await prisma.utilisateur.findUnique({ where: { email } });
  if (existant) {
    return NextResponse.json({ error: "email_deja_utilise" }, { status: 409 });
  }

  const mot_de_passe_hash = await bcrypt.hash(password, 12);

  const utilisateur = await prisma.utilisateur.create({
    data: { email, mot_de_passe_hash, est_admin: estAdmin },
    select: {
      id: true,
      email: true,
      est_admin: true,
      actif: true,
      date_creation: true,
    },
  });

  return NextResponse.json(utilisateur, { status: 201 });
}
