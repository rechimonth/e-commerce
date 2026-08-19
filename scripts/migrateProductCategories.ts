import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type AppOptions,
  type Credential,
  type ServiceAccount,
} from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const COLLECTION_NAME = 'products';
const BATCH_LIMIT = 450;
const DRY_RUN =
  process.argv.includes('--check') ||
  process.argv.includes('--dryRun') ||
  process.env.DRY_RUN === 'true';

const CATEGORY_RENAMES = {
  action_figures: 'action-figures',
  video_games: 'video-games',
} as const;

const CANONICAL_CATEGORIES = new Set(['action-figures', 'video-games', 'shoes']);

type LegacyCategory = keyof typeof CATEGORY_RENAMES;

interface MigrationStats {
  readonly scanned: number;
  readonly changedDocs: number;
  readonly categoryRenames: number;
  readonly categoryBackfills: number;
  readonly categoryIdRenames: number;
}

function isLegacyCategory(value: unknown): value is LegacyCategory {
  return typeof value === 'string' && value in CATEGORY_RENAMES;
}

function normalizeCategory(value: unknown): string | null {
  if (isLegacyCategory(value)) return CATEGORY_RENAMES[value];
  if (typeof value === 'string' && CANONICAL_CATEGORIES.has(value)) return value;
  return null;
}

function getProjectId(): string {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    process.env.VITE_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      'Falta FIREBASE_PROJECT_ID o VITE_FIREBASE_PROJECT_ID en el entorno.',
    );
  }

  return projectId;
}

function getExplicitServiceAccountCredential(): Credential | null {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) as ServiceAccount);
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) return null;

  if (!existsSync(serviceAccountPath)) {
    throw new Error(`No existe FIREBASE_SERVICE_ACCOUNT_PATH: ${serviceAccountPath}`);
  }

  return cert(
    JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount,
  );
}

function getApplicationDefaultCredential(): Credential {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return applicationDefault();
  }

  const wellKnownAdcPath =
    process.platform === 'win32' && process.env.APPDATA
      ? join(process.env.APPDATA, 'gcloud', 'application_default_credentials.json')
      : join(homedir(), '.config', 'gcloud', 'application_default_credentials.json');

  if (existsSync(wellKnownAdcPath)) {
    return applicationDefault();
  }

  throw new Error(
    [
      'No hay credenciales administrativas disponibles.',
      'Configura FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_JSON',
      'o GOOGLE_APPLICATION_CREDENTIALS antes de ejecutar la migracion.',
    ].join(' '),
  );
}

function initializeFirebaseAdmin(): void {
  if (getApps().length > 0) return;

  const options: AppOptions = {
    projectId: getProjectId(),
  };

  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    options.credential =
      getExplicitServiceAccountCredential() ?? getApplicationDefaultCredential();
  }

  initializeApp(options);
}

async function migrateProductCategories(): Promise<MigrationStats> {
  initializeFirebaseAdmin();

  const db = getFirestore();
  const snapshot = await db.collection(COLLECTION_NAME).get();

  let batch = db.batch();
  let pendingWrites = 0;
  let changedDocs = 0;
  let categoryRenames = 0;
  let categoryBackfills = 0;
  let categoryIdRenames = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const updates: Record<string, unknown> = {};
    const normalizedCategoryId = normalizeCategory(data.categoryId);

    if (isLegacyCategory(data.category)) {
      updates.category = CATEGORY_RENAMES[data.category];
      categoryRenames += 1;
    } else if (data.category === undefined && normalizedCategoryId) {
      updates.category = normalizedCategoryId;
      categoryBackfills += 1;
    }

    if (isLegacyCategory(data.categoryId)) {
      updates.categoryId = CATEGORY_RENAMES[data.categoryId];
      categoryIdRenames += 1;
    }

    if (Object.keys(updates).length === 0) continue;

    changedDocs += 1;
    updates.updatedAt = FieldValue.serverTimestamp();

    console.warn(
      `${DRY_RUN ? '[dry-run] ' : ''}${docSnap.id}: ${JSON.stringify(updates)}`,
    );

    if (DRY_RUN) continue;

    batch.update(docSnap.ref, updates);
    pendingWrites += 1;

    if (pendingWrites >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      pendingWrites = 0;
    }
  }

  if (!DRY_RUN && pendingWrites > 0) {
    await batch.commit();
  }

  return {
    scanned: snapshot.size,
    changedDocs,
    categoryRenames,
    categoryBackfills,
    categoryIdRenames,
  };
}

migrateProductCategories()
  .then((stats) => {
    console.warn(
      [
        DRY_RUN ? 'Dry-run completado.' : 'Migracion completada.',
        `Productos revisados: ${stats.scanned}.`,
        `Documentos modificados: ${stats.changedDocs}.`,
        `category renombrados: ${stats.categoryRenames}.`,
        `category completados desde categoryId: ${stats.categoryBackfills}.`,
        `categoryId renombrados: ${stats.categoryIdRenames}.`,
      ].join('\n'),
    );
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Error al migrar categorias de productos:');
    console.error(error);
    console.error(
      [
        '',
        'Para Firestore real, configura una de estas opciones:',
        '- FIREBASE_SERVICE_ACCOUNT_PATH con la ruta a un JSON de service account.',
        '- FIREBASE_SERVICE_ACCOUNT_JSON con el JSON completo de service account.',
        '- GOOGLE_APPLICATION_CREDENTIALS/ADC valido para el proyecto.',
        '',
        'Para emulador, define FIRESTORE_EMULATOR_HOST y FIREBASE_PROJECT_ID.',
      ].join('\n'),
    );
    process.exit(1);
  });
