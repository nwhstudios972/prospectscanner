import nodemailer from "nodemailer";
import { dureeValiditeMinutes } from "@/lib/codes";
import {
  construireEmailHtml,
  paragrapheHtml,
  codeHtml,
  detailsHtml,
  alerteHtml,
} from "@/lib/notifications/email-template";

export interface TentativeConnexion {
  email: string;
  adresseIp: string;
}

let transporteur: ReturnType<typeof nodemailer.createTransport> | null = null;
let transporteurInitialise = false;

function getTransporteur(): ReturnType<typeof nodemailer.createTransport> | null {
  if (transporteurInitialise) return transporteur;
  transporteurInitialise = true;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !port || !user || !password) {
    return null;
  }

  transporteur = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass: password },
  });

  return transporteur;
}

function formaterDateHeure(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "medium",
    timeZone: "Europe/Paris",
  }).format(date);
}

function expediteurParDefaut(): string | undefined {
  return process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER;
}

// Avec un compte SMTP de test (ex: Ethereal), l'email n'atterrit jamais dans
// une vraie boîte — nodemailer expose un lien de prévisualisation du message
// envoyé, utile en dev pour vérifier son rendu sans vraie boîte mail.
function logApercuSiDisponible(info: unknown): void {
  const apercu = nodemailer.getTestMessageUrl(
    info as Parameters<typeof nodemailer.getTestMessageUrl>[0],
  );
  if (apercu) {
    console.log(`[email] Aperçu du message envoyé : ${apercu}`);
  }
}

// Alerte envoyée à l'administrateur pour toute tentative de connexion ÉCHOUÉE :
// l'email visé peut ne pas exister ou ne pas être le sien, donc on ne notifie
// jamais ce compte lui-même, seulement le canal de supervision.
export async function notifierTentativeEchouee(
  tentative: TentativeConnexion,
): Promise<void> {
  const destinataire = process.env.ADMIN_NOTIFICATION_EMAIL;
  const expediteur = expediteurParDefaut();
  const transport = getTransporteur();

  if (!transport || !destinataire || !expediteur) {
    console.warn(
      "[email] SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/SMTP_FROM_EMAIL/" +
        "ADMIN_NOTIFICATION_EMAIL manquant(s) — alerte de connexion échouée non envoyée.",
    );
    return;
  }

  const date = formaterDateHeure(new Date());
  const texte = [
    "Tentative de connexion ÉCHOUÉE sur ProspectScanner.",
    "",
    `Compte visé : ${tentative.email}`,
    `Date/heure : ${date}`,
    `Adresse IP : ${tentative.adresseIp}`,
  ].join("\n");

  const html = construireEmailHtml({
    titre: "Tentative de connexion échouée",
    contenuHtml: [
      alerteHtml("Une tentative de connexion avec un email ou un mot de passe incorrect vient d'avoir lieu."),
      detailsHtml([
        ["Compte visé", tentative.email],
        ["Date/heure", date],
        ["Adresse IP", tentative.adresseIp],
      ]),
    ].join(""),
  });

  try {
    const info = await transport.sendMail({
      from: expediteur,
      to: destinataire,
      subject: `[ProspectScanner] Connexion échouée — ${tentative.email}`,
      text: texte,
      html,
    });
    logApercuSiDisponible(info);
  } catch (error) {
    console.error("[email] Échec de l'envoi de l'alerte de connexion échouée :", error);
  }
}

// Confirmation envoyée au COMPTE LUI-MÊME à chaque connexion réussie, pour
// que chaque utilisateur (pas seulement l'admin) soit alerté d'un accès à
// son compte avec la date, l'heure et l'IP d'origine.
export async function notifierConnexionReussie(
  connexion: TentativeConnexion,
): Promise<void> {
  const expediteur = expediteurParDefaut();
  const transport = getTransporteur();

  if (!transport || !expediteur) {
    console.warn(
      "[email] SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/SMTP_FROM_EMAIL " +
        "manquant(s) — notification de connexion réussie non envoyée.",
    );
    return;
  }

  const date = formaterDateHeure(new Date());
  const texte = [
    "Nouvelle connexion réussie à votre compte ProspectScanner.",
    "",
    `Compte : ${connexion.email}`,
    `Date/heure : ${date}`,
    `Adresse IP : ${connexion.adresseIp}`,
    "",
    "Si vous n'êtes pas à l'origine de cette connexion, changez votre mot de passe immédiatement depuis Paramètres.",
  ].join("\n");

  const html = construireEmailHtml({
    titre: "Nouvelle connexion à votre compte",
    contenuHtml: [
      detailsHtml([
        ["Compte", connexion.email],
        ["Date/heure", date],
        ["Adresse IP", connexion.adresseIp],
      ]),
      paragrapheHtml(
        "Si vous n'êtes pas à l'origine de cette connexion, changez votre mot de passe immédiatement depuis <strong>Paramètres</strong>.",
      ),
    ].join(""),
  });

  try {
    const info = await transport.sendMail({
      from: expediteur,
      to: connexion.email,
      subject: "[ProspectScanner] Nouvelle connexion à votre compte",
      text: texte,
      html,
    });
    logApercuSiDisponible(info);
  } catch (error) {
    console.error("[email] Échec de l'envoi de la confirmation de connexion :", error);
  }
}

// Confirmation envoyée au compte lorsque son mot de passe vient d'être
// changé, pour signaler un changement non désiré.
export async function notifierMotDePasseModifie(email: string): Promise<void> {
  const expediteur = expediteurParDefaut();
  const transport = getTransporteur();

  if (!transport || !expediteur) {
    console.warn(
      "[email] SMTP non configuré — confirmation de changement de mot de passe non envoyée.",
    );
    return;
  }

  const date = formaterDateHeure(new Date());
  const texte = [
    "Le mot de passe de votre compte ProspectScanner vient d'être modifié.",
    "",
    `Compte : ${email}`,
    `Date/heure : ${date}`,
    "",
    "Si vous n'êtes pas à l'origine de ce changement, contactez l'administrateur immédiatement.",
  ].join("\n");

  const html = construireEmailHtml({
    titre: "Votre mot de passe a été modifié",
    contenuHtml: [
      detailsHtml([
        ["Compte", email],
        ["Date/heure", date],
      ]),
      paragrapheHtml(
        "Si vous n'êtes pas à l'origine de ce changement, contactez l'administrateur immédiatement.",
      ),
    ].join(""),
  });

  try {
    const info = await transport.sendMail({
      from: expediteur,
      to: email,
      subject: "[ProspectScanner] Votre mot de passe a été modifié",
      text: texte,
      html,
    });
    logApercuSiDisponible(info);
  } catch (error) {
    console.error("[email] Échec de l'envoi de la confirmation de changement de mot de passe :", error);
  }
}

// Code à 6 chiffres envoyé pour la réinitialisation (mot de passe oublié),
// la confirmation d'un changement de mot de passe déjà authentifié, ou la
// double authentification à la connexion.
export async function notifierCodeVerification(
  email: string,
  code: string,
  contexte: "reinitialisation_mdp" | "changement_mdp" | "connexion",
): Promise<void> {
  const expediteur = expediteurParDefaut();
  const transport = getTransporteur();

  if (!transport || !expediteur) {
    console.warn("[email] SMTP non configuré — code de vérification non envoyé.");
    return;
  }

  const duree = dureeValiditeMinutes(contexte);

  const sujet =
    contexte === "reinitialisation_mdp"
      ? "[ProspectScanner] Code de réinitialisation de votre mot de passe"
      : contexte === "changement_mdp"
        ? "[ProspectScanner] Code de confirmation de changement de mot de passe"
        : "[ProspectScanner] Code de vérification de connexion";

  const intro =
    contexte === "reinitialisation_mdp"
      ? "Voici votre code pour réinitialiser votre mot de passe."
      : contexte === "changement_mdp"
        ? "Voici votre code pour confirmer le changement de votre mot de passe."
        : "Voici votre code de vérification pour terminer votre connexion.";

  const texte = [
    intro,
    "",
    `Code : ${code}`,
    "",
    `Ce code est valable ${duree} minutes.`,
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
  ].join("\n");

  const html = construireEmailHtml({
    titre: intro,
    contenuHtml: [
      codeHtml(code),
      paragrapheHtml(`Ce code est valable <strong style="color:#00ff9d">${duree} minutes</strong>.`),
      paragrapheHtml("Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."),
    ].join(""),
  });

  try {
    const info = await transport.sendMail({
      from: expediteur,
      to: email,
      subject: sujet,
      text: texte,
      html,
    });
    logApercuSiDisponible(info);
  } catch (error) {
    console.error("[email] Échec de l'envoi du code de vérification :", error);
  }
}

// Alerte envoyée à l'administrateur quand un code de vérification de
// connexion a été saisi incorrectement 5 fois de suite : le code est
// invalidé côté serveur (lib/codes.ts), ceci est uniquement la notification.
export async function notifierActiviteSuspecte(
  tentative: TentativeConnexion,
): Promise<void> {
  const destinataire = process.env.ADMIN_NOTIFICATION_EMAIL;
  const expediteur = expediteurParDefaut();
  const transport = getTransporteur();

  if (!transport || !destinataire || !expediteur) {
    console.warn(
      "[email] SMTP non configuré — alerte d'activité suspecte non envoyée.",
    );
    return;
  }

  const date = formaterDateHeure(new Date());
  const texte = [
    "Activité suspecte détectée sur ProspectScanner.",
    "",
    `Compte visé : ${tentative.email}`,
    `Date/heure : ${date}`,
    `Adresse IP : ${tentative.adresseIp}`,
    "",
    "5 tentatives de code de vérification incorrectes ont été effectuées lors d'une connexion. Le code a été invalidé.",
  ].join("\n");

  const html = construireEmailHtml({
    titre: "Activité suspecte détectée",
    contenuHtml: [
      alerteHtml(
        "5 tentatives de code de vérification incorrectes ont été effectuées lors d'une connexion. Le code a été invalidé.",
      ),
      detailsHtml([
        ["Compte visé", tentative.email],
        ["Date/heure", date],
        ["Adresse IP", tentative.adresseIp],
      ]),
    ].join(""),
  });

  try {
    const info = await transport.sendMail({
      from: expediteur,
      to: destinataire,
      subject: `[ProspectScanner] Activité suspecte — ${tentative.email}`,
      text: texte,
      html,
    });
    logApercuSiDisponible(info);
  } catch (error) {
    console.error("[email] Échec de l'envoi de l'alerte d'activité suspecte :", error);
  }
}
