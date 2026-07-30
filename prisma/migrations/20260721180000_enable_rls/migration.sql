-- Defense en profondeur pour Supabase/PostgREST.
-- L'application serveur utilise la connexion PostgreSQL proprietaire et
-- continue donc a fonctionner, tandis qu'aucune table n'est exposee aux
-- roles API anon/authenticated sans politique explicite.
ALTER TABLE "scans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "etablissements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "presences_en_ligne" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prospects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "utilisateurs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "codes_verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "journal_connexions" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "scans", "etablissements", "presences_en_ligne",
      "prospects", "utilisateurs", "codes_verification", "journal_connexions"
      FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "scans", "etablissements", "presences_en_ligne",
      "prospects", "utilisateurs", "codes_verification", "journal_connexions"
      FROM authenticated;
  END IF;
END $$;
