import { initializeApp, cert, getFirestore } from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

const SERVICE_ACCOUNT_PATH = 'service-account-key.json';

let app;

if (existsSync(SERVICE_ACCOUNT_PATH)) {
  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  app = initializeApp({ credential: cert(serviceAccount) });
  console.warn('Usando service account key: ' + SERVICE_ACCOUNT_PATH);
} else {
  app = initializeApp();
  console.warn('Usando credenciales por defecto');
}

const db = getFirestore(app);

const CATEGORY_MAP: Record<string, string> = {
  action_figures: 'action-figures',
  video_games: 'video-games',
};

async function migrate(): Promise<void> {
  console.warn('Migrando categorias en Firestore...');
  
  const snapshot = await db.collection('products').get();
  let migrated = 0;
  let skipped = 0;

  const docsToUpdate: Array<{ ref: unknown; newCategory: string }> = [];

  for (const productDoc of snapshot.docs) {
    const data = productDoc.data();
    const currentCategory = data.category;

    if (CATEGORY_MAP[currentCategory]) {
      const newCategory = CATEGORY_MAP[currentCategory];
      docsToUpdate.push({ ref: productDoc.ref, newCategory });
      migrated++;
    } else {
      skipped++;
    }
  }

  const batchSize = 500;
  for (let i = 0; i < docsToUpdate.length; i += batchSize) {
    const batch = db.batch();
    const chunk = docsToUpdate.slice(i, i + batchSize);
    
    for (const item of chunk) {
      batch.update(item.ref, { category: item.newCategory });
    }
    
    await batch.commit();
    console.warn('  Batch actualizado: ' + chunk.length + ' documentos');
  }

  console.warn('');
  console.warn('Migracion completada:');
  console.warn('  Documentos actualizados: ' + migrated);
  console.warn('  Documentos sin cambios: ' + skipped);
  console.warn('  Total procesados: ' + snapshot.size);
  process.exit(0);
}

migrate().catch((error) => {
  console.error('Error en la migracion:', error);
  process.exit(1);
});
