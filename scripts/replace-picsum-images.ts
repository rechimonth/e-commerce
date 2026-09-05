import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Faltan variables de entorno de Firebase Admin.');
  console.error('Requeridas: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1593305841991-05c29736b94f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1606813907293-d86fa128fe5b?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1612036782180-6f0b6f7e8e3b?w=300&h=300&fit=crop',
];

function getUnsplashImage(index: number): string {
  return UNSPLASH_IMAGES[index % UNSPLASH_IMAGES.length];
}

async function replaceAllPicsumImages() {
  console.log('?? Reemplazando TODAS las imágenes de picsum.photos por Unsplash...\n');

  const snapshot = await db.collection('products').get();
  let replaced = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const currentImage = data.imageUrl ?? data.image_url ?? data.image;
    const imageUrl = typeof currentImage === 'string' ? currentImage : currentImage?.url;

    if (imageUrl && imageUrl.includes('picsum.photos')) {
      const newImage = getUnsplashImage(replaced);
      console.log(`[${doc.id}] ${data.name ?? 'Sin nombre'}`);
      console.log(`  ?? Reemplazando: ${imageUrl}`);
      console.log(`  ?? Por: ${newImage}`);

      await doc.ref.update({
        imageUrl: newImage,
        imageKey: `unsplash-${doc.id}`,
      });

      replaced++;
    } else {
      skipped++;
    }
  }

  console.log(`\n?? Resultados:`);
  console.log(`  - Productos actualizados: ${replaced}`);
  console.log(`  - Productos sin cambios: ${skipped}`);
  console.log(`  - Total: ${snapshot.size}`);
  process.exit(0);
}

replaceAllPicsumImages().catch((error) => {
  console.error('? Error:', error);
  process.exit(1);
});
