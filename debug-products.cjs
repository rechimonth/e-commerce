const fs = require('fs');
const path = 'C:\\Users\\wingz\\Documents\\e-commerce-ai\\src\\pages\\admin\\ProductsPage.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const fetchProducts = useCallback(async () => {",
  "const fetchProducts = useCallback(async () => {\n    console.log('[AdminProductsPage] Firebase project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);"
);

content = content.replace(
  "      const result: PaginatedResult<Product> = await productsService.fetchProductsAdmin({",
  "      console.log('[AdminProductsPage] Fetching products...');\n      const result: PaginatedResult<Product> = await productsService.fetchProductsAdmin({"
);

content = content.replace(
  "setState({ products: result.items as Product[], status: 'success', error: null, pagination: result.pagination });",
  "console.log('[AdminProductsPage] Products loaded:', result.items.length);\n      setState({ products: result.items as Product[], status: 'success', error: null, pagination: result.pagination });"
);

fs.writeFileSync(path, content);
console.log('Updated ProductsPage.tsx');
