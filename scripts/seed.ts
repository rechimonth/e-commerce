import "dotenv/config";
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

export type CategoryId = "action-figures" | "video-games" | "shoes";

const CATALOG: Record<CategoryId, string[]> = {
  shoes: [
    "Nike Air Max",
    "Nike Pegasus",
    "Nike Revolution",
    "Nike Free Run",
    "Nike Zoom",
    "Nimbus Cloud",
    "Ninja Runner",
    "Adidas Originals",
    "Adidas Ultraboost",
    "Adidas Stan Smith",
    "Puma Suede",
    "Puma RS-X",
    "Reebok Classic",
    "Reebok Nano",
    "Vans Old Skool",
    "Vans Sk8-Hi",
    "Converse Chuck Taylor",
    "New Balance 990",
    "New Balance 327",
    "Asics Gel-Kayano",
  ],
  "video-games": [
    "Elden Ring",
    "Zelda Tears of the Kingdom",
    "Super Mario Odyssey",
    "God of War Ragnarök",
    "The Last of Us Part II",
    "Halo Infinite",
    "Forza Horizon 5",
    "Cyberpunk 2077",
    "Baldur's Gate 3",
    "Final Fantasy XVI",
    "Spider-Man 2",
    "Starfield",
    "Diablo IV",
    "Street Fighter 6",
    "Tekken 8",
    "Mortal Kombat 1",
    "FIFA 24",
    "NBA 2K24",
    "Call of Duty MW3",
    "GTA V",
  ],
  "action-figures": [
    "Iron Man Mark XLIII",
    "Captain America Shield",
    "Spider-Man Miles Morales",
    "Batman Arkham",
    "Wonder Woman Prime",
    "Thor Stormbreaker",
    "Black Panther Vibranium",
    "Hulk Smash Edition",
    "Deadpool Chimichanga",
    "Wolverine Adamantium",
    "Joker Batman Returns",
    "Harley Quinn DC",
    "Darth Vader Black Series",
    "Mandalorian Beskar",
    "Stormtrooper Helmet",
    "Optimus Prime Transformers",
    "Bumblebee Transformers",
    "Goku Super Saiyan",
    "Naruto Uzumaki",
    "Luffy Gear Fifth",
  ],
};

function randomPrice(): number {
  return Number((80 + Math.random() * 270).toFixed(2));
}

function randomStock(): number {
  return Math.floor(Math.random() * 46) + 5;
}

function createDescription(name: string, categoryId: CategoryId): string {
  const categoryLabel = {
    shoes: "Zapatillas",
    "video-games": "Videojuegos",
    "action-figures": "Figuras de Acción",
  }[categoryId];

  return `${name} pertenece a la categoría "${categoryLabel}". Fabricado con materiales de calidad que ofrecen comodidad, durabilidad y un diseño moderno para el uso diario.`;
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function generatePlaceholderSvg(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  const color = `hsl(${hue}, 70%, 60%)`;
  const textColor = `hsl(${hue}, 70%, 20%)`;
  const initial = name.charAt(0).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="${color}"/>
    <text x="150" y="150" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="central">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function seed(): Promise<void> {
  const products = Object.entries(CATALOG).flatMap(([categoryId, names]) =>
    names.map((name) => ({
      name,
      nameLower: name.toLowerCase(),
      image: generatePlaceholderSvg(name),
      description: createDescription(name, categoryId as CategoryId),
      price: randomPrice(),
      stock: randomStock(),
      categoryId: categoryId as CategoryId,
    })),
  );

  console.warn(`🌱 Sembrando ${products.length} productos...\n`);

  for (const product of products) {
    const ref = doc(collection(db, "products"));
    await setDoc(ref, {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.warn(`✔ ${product.name}`);
  }

  console.warn(`\n✅ ${products.length} productos creados correctamente.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Error al ejecutar el seeder:");
  console.error(error);
  process.exit(1);
});