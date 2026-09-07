import "dotenv/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

export type CategoryId = "action-figures" | "video-games" | "shoes";

type SeedProduct = {
  name: string;
  nameLower: string;
  imageKey: string;
  imageUrl: string;
  description: string;
  priceCents: number;
  currency: "USD";
  category: CategoryId;
  stock: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdBy: string;
};

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

function stableHash(value: string): number {
  return value.split("").reduce((hash, char) => ((hash * 31 + char.charCodeAt(0)) >>> 0), 2166136261);
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function priceFor(name: string): number {
  return 8000 + (stableHash(name) % 27001);
}

function stockFor(name: string): number {
  return 5 + (stableHash(`${name}:stock`) % 46);
}

function createDescription(name: string, category: CategoryId): string {
  const categoryLabel = {
    shoes: "Zapatillas",
    "video-games": "Videojuegos",
    "action-figures": "Figuras de Acción",
  }[category];

  return `${name} pertenece a la categoría ${categoryLabel}. Producto de catálogo preparado para ECOMMERCE AI.`;
}

function generatePlaceholderSvg(name: string, category: CategoryId): string {
  const categoryLabel = {
    shoes: "ZAPATILLAS",
    "video-games": "VIDEOJUEGOS",
    "action-figures": "FIGURAS",
  }[category];
  const hue = stableHash(`${category}:${name}`) % 360;
  const initial = name.charAt(0).toUpperCase();
  const safeName = name.replace(/[&<>"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="hsl(${hue},70%,16%)"/><rect x="24" y="24" width="552" height="552" rx="28" fill="none" stroke="hsl(${hue},85%,65%)" stroke-width="4"/><text x="300" y="270" font-family="Arial,sans-serif" font-size="180" font-weight="700" fill="hsl(${hue},85%,70%)" text-anchor="middle">${initial}</text><text x="300" y="410" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="white" text-anchor="middle">${categoryLabel}</text><text x="300" y="455" font-family="Arial,sans-serif" font-size="18" fill="white" text-anchor="middle">${safeName.slice(0, 34)}</text></svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function getFirebaseAdminApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY. El seeder usa Firebase Admin y no las variables VITE_.",
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

function buildProducts(): SeedProduct[] {
  const createdBy = process.env.SEED_CREATED_BY ?? "seed-script";

  return Object.entries(CATALOG).flatMap(([category, names]) =>
    names.map((name) => {
      const categoryId = category as CategoryId;
      const slug = `${categoryId}-${slugify(name)}`;
      return {
        name,
        nameLower: name.toLowerCase(),
        imageKey: `seed/${slug}.svg`,
        imageUrl: generatePlaceholderSvg(name, categoryId),
        description: createDescription(name, categoryId),
        priceCents: priceFor(name),
        currency: "USD",
        category: categoryId,
        stock: stockFor(name),
        rating: 4.5,
        reviewCount: 0,
        isActive: true,
        createdBy,
      } satisfies SeedProduct;
    }),
  );
}

async function seed(): Promise<void> {
  const app = getFirebaseAdminApp();
  const db = getFirestore(app);
  const products = buildProducts();

  console.warn(`🌱 Sembrando ${products.length} productos con Firebase Admin...\n`);

  for (const product of products) {
    const id = `${product.category}-${slugify(product.name)}`;
    const ref = db.collection("products").doc(id);

    await ref.set({
      ...product,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.warn(`✔ ${product.name}`);
  }

  console.warn(`\n✅ ${products.length} productos creados/actualizados correctamente.`);
}

seed().catch((error: unknown) => {
  console.error("❌ Error al ejecutar el seeder:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
