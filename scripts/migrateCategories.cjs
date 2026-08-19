const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const SERVICE_ACCOUNT_PATH = 'service-account-key.json';

// Load project ID from .env
function loadEnv() {
  const envPath = '.env';
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}

const env = loadEnv();
const projectId = env.VITE_FIREBASE_PROJECT_ID;

let app;

if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  app = initializeApp({ 
    credential: cert(serviceAccount),
    projectId: projectId || serviceAccount.project_id,
  });
  console.log('Usando service account key: ' + SERVICE_ACCOUNT_PATH);
} else {
  app = initializeApp({ projectId });
  console.log('Usando credenciales por defecto para proyecto: ' + projectId);
}

const db = getFirestore(app);

const CATEGORY_MAP = {
  action_figures: 'action-figures',
  video_games: 'video-games',
};

async function migrate() {
  console.log('Migrando categorias en Firestore...');
  
  const snapshot = await db.collection('products').get();
  let migrated = 0;
  let skipped = 0;

  const docsToUpdate = [];

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
    console.log('  Batch actualizado: ' + chunk.length + ' documentos');
  }

  console.log('');
  console.log('Migracion completada:');
  console.log('  Documentos actualizados: ' + migrated);
  console.log('  Documentos sin cambios: ' + skipped);
  console.log('  Total procesados: ' + snapshot.size);
  process.exit(0);
}

migrate().catch((error) => {
  console.error('Error en la migracion:', error);
  process.exit(1);
});
