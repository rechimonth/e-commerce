const fs = require('fs');
const path = 'C:\\Users\\wingz\\Documents\\e-commerce-ai\\src\\pages\\admin\\ProductsPage.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `<td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveProductImage(product)}
                          alt={product.image.alt}
                          className="h-10 w-10 rounded object-cover"
                         onError={handleProductImageError} />`,
  `<td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {(() => { const resolved = resolveProductImage(product); console.log('[AdminProductsPage] Image debug:', product.name, 'imageUrl=', product.image?.url, 'resolved=', resolved); return null; })()}
                        <img
                          src={resolveProductImage(product)}
                          alt={product.image.alt}
                          className="h-10 w-10 rounded object-cover"
                         onError={handleProductImageError} />`
);

fs.writeFileSync(path, content);
console.log('Updated ProductsPage.tsx with image debug logs');
