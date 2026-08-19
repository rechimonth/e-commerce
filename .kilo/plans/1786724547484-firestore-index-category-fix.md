# Plan: Fix Firestore Index + Category Data Migration

## Contexto

El usuario reporta dos problemas despues del refactor de categorias:

1. Error de indice compuesto en Firestore: Al presionar Todos o cualquier filtro, Firestore responde que requiere un indice.
2. Mismatch de categorias: El seeder guardaba action_figures / video_games (underscore), pero el frontend consulta action-figures / video-games (guion).

## Cambios ya aplicados en codigo

- src/types/domain.ts: PRODUCT_CATEGORIES en guiones.
- src/pages/CatalogPage.tsx: labels en guiones.
- src/components/catalog/ProductFilters.tsx: categorias corregidas.
- scripts/seed.ts: CATALOG usa claves quoted con guiones.
- scripts/seed.ts: console.log cambiado a console.warn.

Validaciones:
- npm run build OK
- npm run lint OK (0 warnings)
- npm run test --run OK (51 archivos, 397 tests passing)

## Pasos manuales que debe realizar el usuario

### 1. Crear el indice compuesto en Firestore

El usuario debe abrir el link que aparece en el error, o crear el indice manualmente en Firebase Console:
- Coleccion: products
- Campos: isActive Ascending, createdAt Descending

### 2. Migrar datos existentes en Firestore

Opcion A: Re-seed (si no hay datos reales).
Opcion B: Migracion en caliente con script.

### 3. Actualizar el arreglo CATEGORIES del usuario

Cambiar ids de underscore a guion para que coincidan con PRODUCT_CATEGORIES.

## Orden recomendado

1. Crear el indice en Firebase Console.
2. Migrar o re-seed los datos.
3. Actualizar el arreglo CATEGORIES.
4. Recargar la app.

## Riesgos

- Si no se crea el indice, la query falla siempre.
- Si no se migran los datos, los filtros devuelven vacio.
- Si se mantienen underscores en UI, el filtro no matchea con el backend.
