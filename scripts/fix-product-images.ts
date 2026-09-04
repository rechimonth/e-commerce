/* eslint-disable no-console */
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

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1593305841991-05c29736b94f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1606813907293-d86fa128fe5b?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1612036782180-6f0b6f7e8e3b?w=300&h=300&fit=crop',
];

function getFallbackImage(index: number): string {
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function isInvalidImageUrl(url: string | undefined): boolean {
  if (!url || url.trim() === '') return true;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return true;
  if (url.includes('localhost') || url.includes('127.0.0.1')) return true;
  if (url.includes('file://') || url.startsWith('/')) return true;
  return false;
}

async function fixProductImages() {
  console.log('Buscando productos con imágenes inválidas...\n');
  const snapshot = await db.collection('products').get();
  let fixed = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const currentImage = data.imageUrl ?? data.image_url ?? data.image;
    const imageUrl = typeof currentImage === 'string' ? currentImage : currentImage?.url;

    if (isInvalidImageUrl(imageUrl)) {
      const fallback = getFallbackImage(fixed);
      console.log(`[${doc.id}] ${data.name ?? 'Sin nombre'}`);
      console.log(`  URL inválida: ${imageUrl}`);
      console.log(`  Reemplazando por: ${fallback}`);
      await doc.ref.update({ imageUrl: fallback, imageKey: `fallback-${doc.id}` });
      fixed++;
    } else {
      skipped++;
    }
  }

  console.log('\nResultados:');
  console.log(`  - Productos corregidos: ${fixed}`);
  console.log(`  - Productos sin cambios: ${skipped}`);
  console.log(`  - Total: ${snapshot.size}`);
}

fixProductImages().catch((error) => {
  console.error('Error al corregir imágenes:', error);
  process.exitCode = 1;
});
