// File d'exécution en mémoire, simple et séquentielle (un scan à la fois).
// Remplace l'architecture BullMQ+Redis initialement envisagée : pas de worker
// séparé ni de persistance externe nécessaires pour un usage local mono-instance.
// Stockée sur globalThis pour survivre au hot-reload de Next.js en dev.

type TacheScan = () => Promise<void>;

interface EtatQueue {
  file: TacheScan[];
  enCours: boolean;
}

const globalPourQueue = globalThis as unknown as {
  __prospectScannerQueue: EtatQueue | undefined;
};

function getEtat(): EtatQueue {
  if (!globalPourQueue.__prospectScannerQueue) {
    globalPourQueue.__prospectScannerQueue = { file: [], enCours: false };
  }
  return globalPourQueue.__prospectScannerQueue;
}

async function traiterFile() {
  const etat = getEtat();
  if (etat.enCours) return;
  etat.enCours = true;

  try {
    while (etat.file.length > 0) {
      const tache = etat.file.shift()!;
      try {
        await tache();
      } catch (error) {
        console.error("[queue] Tâche de scan échouée :", error);
      }
    }
  } finally {
    etat.enCours = false;
  }
}

export function enqueuer(tache: TacheScan): void {
  const etat = getEtat();
  etat.file.push(tache);
  void traiterFile();
}
