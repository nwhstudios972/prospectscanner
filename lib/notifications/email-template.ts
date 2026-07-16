// Template HTML réutilisable pour tous les emails de ProspectScanner —
// thème cyber/hacker cohérent avec l'app (fond sombre, accents vert néon /
// cyan). Basé sur des tables avec styles inline (pas de flex/grid, pas de
// CSS externe) pour rester lisible dans Gmail/Outlook, qui ignorent ou
// bloquent une grande partie du CSS moderne.

const COULEUR_FOND = "#0a0e0f";
const COULEUR_PANEL = "#10161a";
const COULEUR_BORDURE = "rgba(0,255,157,0.25)";
const VERT_NEON = "#00ff9d";
const CYAN_NEON = "#00d4ff";
const ROUGE_NEON = "#ff4d5e";
const TEXTE_CLAIR = "#e6f4ee";
const TEXTE_ATTENUE = "rgba(230,244,238,0.55)";

function echapperHtml(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function paragrapheHtml(texteHtml: string): string {
  return `<p style="margin:0 0 14px 0;color:${TEXTE_CLAIR};font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;">${texteHtml}</p>`;
}

export function codeHtml(code: string): string {
  return `
    <div style="margin:22px 0;text-align:center;">
      <span style="display:inline-block;font-family:'Courier New',Consolas,monospace;font-size:30px;font-weight:700;letter-spacing:9px;color:${VERT_NEON};background-color:rgba(0,255,157,0.08);border:1px solid ${COULEUR_BORDURE};border-radius:6px;padding:14px 22px;">${echapperHtml(code)}</span>
    </div>`;
}

export function detailsHtml(lignes: Array<[string, string]>): string {
  const rangees = lignes
    .map(
      ([label, valeur]) => `
      <tr>
        <td style="padding:4px 10px 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${TEXTE_ATTENUE};white-space:nowrap;">${echapperHtml(label)}</td>
        <td style="padding:4px 0;font-family:'Courier New',Consolas,monospace;font-size:12px;color:${TEXTE_CLAIR};">${echapperHtml(valeur)}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">${rangees}</table>`;
}

export function alerteHtml(texte: string, couleur: string = ROUGE_NEON): string {
  return `
    <div style="margin:16px 0;padding:12px 16px;border:1px solid ${couleur};border-radius:6px;background-color:rgba(255,77,94,0.08);">
      <p style="margin:0;color:${couleur};font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;">${echapperHtml(texte)}</p>
    </div>`;
}

export function construireEmailHtml(opts: {
  titre: string;
  contenuHtml: string;
}): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark light" />
    <title>${echapperHtml(opts.titre)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COULEUR_FOND};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COULEUR_FOND};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:${COULEUR_PANEL};border:1px solid ${COULEUR_BORDURE};border-radius:8px;">
            <tr>
              <td style="padding:22px 28px;border-bottom:1px solid rgba(0,255,157,0.15);">
                <span style="font-family:'Courier New',Consolas,monospace;font-size:14px;letter-spacing:3px;color:${VERT_NEON};font-weight:700;">PROSPECT</span><span style="font-family:'Courier New',Consolas,monospace;font-size:14px;letter-spacing:3px;color:${CYAN_NEON};font-weight:700;">SCANNER</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:${TEXTE_CLAIR};">${echapperHtml(opts.titre)}</h1>
                ${opts.contenuHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;border-top:1px solid rgba(0,255,157,0.1);">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${TEXTE_ATTENUE};">ProspectScanner — instance personnelle. Ne pas répondre à cet email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
