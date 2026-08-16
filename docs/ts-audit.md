
# Auditoría Avanzada de TypeScript — E-Commerce

> **Objetivo**: Que el compilador ayude a prevenir errores de dominio.  
> **Alcance**: src/ completo — tipos, servicios, hooks, componentes, páginas, infraestructura.  
> **Fecha**: 15/8/2026  
> **Nota**: No se aplican fixes automáticos. Solo se reportan hallazgos con evidencia.

---

## Resumen

| Categoría | Cantidad |
|-----------|----------|
| any / unknown | 2 |
| Non-null assertions (!) | 4 |
| Casts innecesarios / inseguros | 8 |
| Props opcionales innecesarias | 6 |
| Estados imposibles / unions mal modeladas | 5 |
| Fechas inconsistentes | 4 |
| Firebase types inseguros | 6 |
| DTO/Entity confusion | 3 |
| Interfaces demasiado amplias | 2 |
| **Total** | **40** |

---

## 1. ny / unknown

### TS-001 — s unknown en parseo de JSON sin type guard posterior

- **Archivo**: src/store/cart/persistence.ts
- **Línea**: 118
- **Código**: const data = JSON.parse(raw) as unknown;
- **Problema**: JSON.parse retorna ny, y el cast a unknown es correcto para forzar validación posterior. Sin embargo, el código luego hace múltiples s Record<string, unknown> sin type guards intermedios, lo que convierte el unknown en un ejercicio de validación por convención más que por tipo.
- **Riesgo**: Medio. Si se agrega una nueva propiedad al schema sin actualizar los type guards, el compilador no lo detecta.
- **Solución recomendada**: Crear un type guard estricto isSerializedCartState(obj: unknown): obj is SerializedCartState que valide recursivamente el shape completo antes de cualquier casteo.

### TS-002 — Ausencia total de ny en código productivo

- **Archivo**: Todos los src/
- **Línea**: N/A
- **Problema**: No se encontraron usos explícitos de ny. Esto es positivo, pero hay que verificar que no se filtren a través de dependencias o tipos de Firebase.
- **Riesgo**: Bajo.
- **Solución recomendada**: Mantener la regla @typescript-eslint/no-explicit-any activa.

---

## 2. Non-null assertions (!)

### TS-003 — Non-null assertions en irebase/config.ts

- **Archivo**: src/infrastructure/firebase/config.ts
- **Líneas**: 37, 62, 67, 72
- **Código**:
  - _app = getApps()[0]!;
  - eturn _app!;
  - eturn _auth!;
  - eturn _db!;
- **Problema**: Se asume que _app, _auth, _db están definidos después de initializeFirebase(), pero el flujo puede cambiar si se agrega inicialización lazy en otro orden.
- **Riesgo**: Medio. En producción, si Firebase no se inicializa, estos ! ocultan el error hasta runtime.
- **Solución recomendada**: Cambiar la firma de retorno a FirebaseApp | undefined y forzar al caller a manejar el caso undefined.

### TS-004 — Non-null assertions en cartUtils.ts

- **Archivo**: src/utils/cart/cartUtils.ts
- **Líneas**: 83, 120
- **Código**: const existing = items[existingIndex]!;
- **Problema**: Después de indIndex, el código ya verifica existingIndex >= 0, pero el ! sigue siendo inseguro porque TypeScript no entiende la relación entre la condición y el acceso.
- **Riesgo**: Bajo.
- **Solución recomendada**: Usar const existing = items[existingIndex]; con un tipo que no requiera !, o usar if (existingIndex < 0) return [...items]; para narrow el tipo.

---

## 3. Casts innecesarios / inseguros

### TS-005 — Casts de moneda en irestore.ts y uth.ts

- **Archivo**: src/infrastructure/firebase/firestore.ts
- **Líneas**: 141, 315
- **Código**: currency: (data.currency ?? 'USD') as ProductDTO['currency']
- **Problema**: El casteo asume que cualquier string es un CurrencyCode válido, pero Firestore puede tener datos corruptos.
- **Riesgo**: Alto. Si Firestore tiene "currency": "FOO", el casteo lo acepta y el tipo se corrompe en toda la app.
- **Solución recomendada**: Validar con SUPPORTED_CURRENCIES.includes(data.currency as CurrencyCode) antes de castear, o usar un type guard isCurrencyCode(value: unknown): value is CurrencyCode.

### TS-006 — Casts de status en irestore.ts

- **Archivo**: src/infrastructure/firebase/firestore.ts
- **Líneas**: 171, 172, 255, 316
- **Código**: rom: 'pending' as OrderStatus, status: (currentData.status ?? 'pending') as OrderStatus
- **Problema**: Similar a TS-005. Se castean strings literales a OrderStatus sin validar que pertenezcan a ORDER_STATUSES.
- **Riesgo**: Alto.
- **Solución recomendada**: Usar isOrderStatus(value: unknown): value is OrderStatus antes de castear.

### TS-007 — Cast de preferencias en uth.ts

- **Archivo**: src/infrastructure/firebase/auth.ts
- **Línea**: 173
- **Código**: currency: (data.preferences?.currency ?? 'USD') as UserProfileDTO['preferences']['currency']
- **Problema**: Mismo patrón que TS-005. Asume que el valor de Firestore es un CurrencyCode válido.
- **Riesgo**: Alto.
- **Solución recomendada**: Validar contra SUPPORTED_CURRENCIES.

### TS-008 — Cast s CartItem[] en persistence.ts

- **Archivo**: src/store/cart/persistence.ts
- **Línea**: 96
- **Código**: items: state.items as CartItem[]
- **Problema**: state.items ya es eadonly CartItem[]. El cast es redundante.
- **Riesgo**: Bajo.
- **Solución recomendada**: Eliminar el cast.

### TS-009 — Cast s Money en persistence.ts

- **Archivo**: src/store/cart/persistence.ts
- **Línea**: 154
- **Código**: const discount = s.discount as Money;
- **Problema**: Después de isMoney(s.discount), TypeScript debería narrow el tipo automáticamente si isMoney está bien implementado. El cast es redundante o indica que el type guard no está funcionando correctamente.
- **Riesgo**: Bajo.
- **Solución recomendada**: Eliminar el cast si isMoney es un type guard válido. Si no, corregir el type guard.

### TS-010 — Casts en mapFirebaseError

- **Archivo**: src/infrastructure/firebase/config.ts
- **Líneas**: 121-122
- **Código**: const code = (error as { code?: string })?.code;
- **Problema**: Se castea a un objeto literal para acceder a code. Es un patrón común pero pierde la seguridad de tipos.
- **Riesgo**: Medio.
- **Solución recomendada**: Usar 	ypeof error === 'object' && error !== null && 'code' in error para narrow, o crear un type guard isFirebaseError(error: unknown): error is { code: string; message: string }.

### TS-011 — Casts de DTO a entidad en productsService.ts

- **Archivo**: src/services/productsService.ts
- **Líneas**: 35-69
- **Problema**: 	oProduct convierte ProductDTO a Product con múltiples operaciones de fecha (
ew Date(createdAtMs)). Si dto.createdAt tiene un shape inesperado, el casteo a 
umber falla en runtime.
- **Riesgo**: Medio.
- **Solución recomendada**: Crear type guards para FirestoreTimestampLike y DomainDates en 	ypes/dates.ts y usarlos antes de mapear.

---

## 4. Props opcionales innecesarias

### TS-012 — quantity?: number en CartContext

- **Archivo**: src/store/cart/CartContext.ts
- **Línea**: 16
- **Código**: ddItem: (product: Product, quantity?: number) => void;
- **Problema**: La firma permite omitir quantity, pero el reducer y las llamadas reales siempre pasan un número. Además, el reducer ya hace clamping.
- **Riesgo**: Bajo.
- **Solución recomendada**: Hacer quantity requerido: ddItem: (product: Product, quantity: number) => void;.

### TS-013 — prefix?: string en uploadService

- **Archivo**: src/services/uploadService.ts
- **Línea**: 17
- **Código**: eadonly prefix?: string;
- **Problema**: La función tiene prefix = 'products' como default, pero la interfaz lo marca como opcional. Esto genera confusión sobre si el caller puede omitirlo.
- **Riesgo**: Bajo.
- **Solución recomendada**: Cambiar a eadonly prefix: string = 'products'; o mantener la interfaz alineada con el default.

### TS-014 — Campos opcionales en OrderDTO que son requeridos en dominio

- **Archivo**: src/types/order.ts
- **Líneas**: 103-104
- **Código**: eadonly createdAt?: number; readonly updatedAt?: number;
- **Problema**: En Order, createdAt y updatedAt son Date requeridos. En OrderDTO son opcionales. Esto fuerza al mapper a manejar undefined en campos que siempre deberían estar presentes.
- **Riesgo**: Medio. Si Firestore no tiene estos campos, el DTO los marca como opcionales, pero el dominio requiere Date.
- **Solución recomendada**: Hacerlos requeridos en OrderDTO con un default de Date.now() en el mapper, o usar unknown y validar en snapToOrder.

### TS-015 — onQuickView opcional en ProductList

- **Archivo**: src/components/catalog/ProductList.tsx
- **Línea**: 10
- **Código**: eadonly onQuickView?: (product: Product) => void;
- **Problema**: En CatalogPage se pasa onQuickView={() => {}} como no-op. Esto indica que el componente base no debería exponer esta prop, o que ProductCard debería manejar el caso internamente.
- **Riesgo**: Bajo.
- **Solución recomendada**: Eliminar onQuickView de ProductList si no se usa, o crear un componente wrapper.

### TS-016 — cursor en FetchProductsParams nunca usado

- **Archivo**: src/services/productsService.ts
- **Línea**: 28
- **Código**: eadonly cursor?: string | null;
- **Problema**: Se declara pero nunca se usa en etchProducts ni etchProductsAdmin.
- **Riesgo**: Bajo.
- **Solución recomendada**: Eliminar o implementar paginación cursor-based.

---

## 5. Estados imposibles / Uniones mal modeladas

### TS-017 — UserRoleState mezcla loading con roles

- **Archivo**: src/types/auth.ts
- **Línea**: 14
- **Código**: export const USER_ROLE_STATES = ['loading', ...USER_ROLES, 'unauthenticated'] as const;
- **Problema**: UserRoleState incluye 'loading' como un estado separado de 'customer' | 'admin' | 'unauthenticated'. Esto permite estados como oleState === 'loading' && roleState === 'admin' que no tienen sentido.
- **Riesgo**: Medio.
- **Solución recomendada**: Separar en dos tipos: 	ype AuthRole = 'customer' | 'admin'; type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';. Usar discriminated union en el contexto: { status: 'loading' } | { status: 'authenticated'; role: AuthRole } | { status: 'unauthenticated' }.

### TS-018 — AsyncStatus permite idle + data simultáneamente

- **Archivo**: src/types/ui.ts
- **Líneas**: 16-40
- **Problema**: AsyncIdle tiene data: null, pero TypeScript no previene que un consumidor guarde data en idle y luego lo lea sin verificar status.
- **Riesgo**: Bajo.
- **Solución recomendada**: El discriminated union actual es correcto, pero los hooks (useProducts, etc.) retornan products: readonly Product[] incluso en idle (ver useProducts:80), lo que rompe la garantía del tipo.

### TS-019 — OrderStatusTransition.timestamp usa Date pero DTO usa 
umber

- **Archivo**: src/types/order.ts
- **Líneas**: 25, 97
- **Problema**: En el dominio, 	imestamp: Date. En el DTO, 	imestamp: number. El mapper (ordersService.ts:45) convierte 
umber a Date, pero el tipo no fuerza esta conversión en el DTO.
- **Riesgo**: Medio.
- **Solución recomendada**: En OrderDTO, cambiar 	imestamp: number a 	imestamp: FirestoreTimestamp | number y usar el type guard de dates.ts.

### TS-020 — OrderDTO.items permite priceCents y price simultáneamente

- **Archivo**: src/types/order.ts
- **Líneas**: 80, 296-297
- **Código**: priceCents?: number; price?: number;
- **Problema**: El DTO acepta ambos formatos, lo que genera ambigüedad. El mapper usa item.priceCents ?? item.price ?? 0, lo que oculta datos corruptos.
- **Riesgo**: Medio.
- **Solución recomendada**: Normalizar a un solo campo en el DTO o usar un discriminated union: { priceCents: number } | { price: number }.

### TS-021 — CartAction.HYDRATE permite estado inconsistente

- **Archivo**: src/types/cart.ts
- **Línea**: 34
- **Código**: { readonly type: 'HYDRATE'; readonly state: CartState }
- **Problema**: HYDRATE acepta cualquier CartState, incluyendo estados con 	otalItems y 	otalPrice inconsistentes con items. El reducer recalculatotals, pero el tipo no previene la creación de estados inválidos.
- **Riesgo**: Bajo.
- **Solución recomendada**: Usar un builder o factory function para CartState que valide consistencia.

---

## 6. Fechas inconsistentes

### TS-022 — createdAt como Date en dominio pero 
umber en DTO

- **Archivo**: src/types/auth.ts, src/types/order.ts
- **Líneas**: uth.ts:24,41, order.ts:103-104
- **Problema**: UserProfile.createdAt es Date, pero UserProfileDTO.createdAt es 
umber. Lo mismo en Order vs OrderDTO. Esto fuerza a los mappers a hacer 
ew Date(number) sin validar que el número sea un timestamp válido.
- **Riesgo**: Medio.
- **Solución recomendada**: Usar FirestoreTimestamp en los DTOs y Date en el dominio, con type guards en dates.ts.

### TS-023 — serverTimestamp() mezclado con Date.now() en uth.ts

- **Archivo**: src/infrastructure/firebase/auth.ts
- **Líneas**: 66, 95, 197-199
- **Problema**: createdAt usa Date.now() (número) pero lastLoginAt usa Timestamp.fromMillis() (objeto Timestamp). Esto crea inconsistencia en Firestore.
- **Riesgo**: Medio.
- **Solución recomendada**: Usar serverTimestamp() para ambos campos, o Date.now() para ambos, pero no mezclar.

### TS-024 — Fechas en CheckoutPage sin zona horaria

- **Archivo**: src/pages/CheckoutPage.tsx
- **Línea**: 76
- **Código**: lastUpdated: new Date()
- **Problema**: Se usa 
ew Date() sin considerar zona horaria. En checkout, esto puede causar discrepancias en reportes.
- **Riesgo**: Bajo.
- **Solución recomendada**: Usar 
ew Date().toISOString() o una librería como date-fns/dayjs para fechas consistentes.

### TS-025 — 	oLocaleDateString en páginas sin locale explícito

- **Archivo**: src/pages/OrderDetailPage.tsx, src/pages/OrdersPage.tsx
- **Líneas**: OrderDetailPage:107-111, OrdersPage:54-58
- **Problema**: Se usan 	oLocaleDateString('es-ES') y 	oLocaleString('es-ES') hardcodeados.
- **Riesgo**: Bajo.
- **Solución recomendada**: Centralizar el locale en 	ypes/pricing.ts o un contexto de locale.

---

## 7. Firebase types inseguros

### TS-026 — Uso de ny en type guards de Firestore

- **Archivo**: src/infrastructure/firebase/firestore.ts
- **Líneas**: 38, 44, 134, 286
- **Código**:
  - const t = ts as { seconds?: number; nanoseconds?: number };
  - const data = docSnap.data();
  - const data = docSnap.data(); (en snapToOrder)
- **Problema**: docSnap.data() retorna DocumentData | undefined, pero se usa directamente como objeto sin validar.
- **Riesgo**: Alto.
- **Solución recomendada**: Usar docSnap.data() as Record<string, unknown> y validar con type guards antes de acceder a propiedades.

### TS-027 — Timestamp importado pero usado como 
umber

- **Archivo**: src/infrastructure/firebase/firestore.ts
- **Línea**: 46
- **Código**: if (typeof t.toMillis === 'function') { return t.toMillis(); }
- **Problema**: Se importa Timestamp pero se trata como un objeto con método 	oMillis. Si Firestore cambia el tipo, el código se rompe.
- **Riesgo**: Bajo.
- **Solución recomendada**: Usar Timestamp.isTimestamp(value) para validar antes de llamar a 	oMillis().

### TS-028 — serverTimestamp() mezclado con timestamps numéricos

- **Archivo**: src/infrastructure/firebase/auth.ts
- **Líneas**: 196-199
- **Código**:
  `	s
  createdAt: typeof profile.createdAt === 'number'
    ? Timestamp.fromMillis(profile.createdAt)
    : serverTimestamp(),
  `
- **Problema**: createdAt en UserProfileDTO es 
umber, pero se mezcla con serverTimestamp() que devuelve Timestamp. Esto crea inconsistencias en Firestore.
- **Riesgo**: Medio.
- **Solución recomendada**: Estandarizar: usar serverTimestamp() para campos de servidor y Date.now() para campos de cliente.

### TS-029 — getApps()[0]! sin verificar tipo

- **Archivo**: src/infrastructure/firebase/config.ts
- **Línea**: 37
- **Código**: _app = getApps()[0]!;
- **Problema**: getApps() retorna FirebaseApp[], pero no se verifica que el primer elemento sea la app esperada.
- **Riesgo**: Bajo.
- **Solución recomendada**: Usar getApp() en lugar de getApps()[0].

### TS-030 — FirebaseInfraError con details opcional

- **Archivo**: src/infrastructure/firebase/config.ts
- **Línea**: 81
- **Código**: eadonly details?: Record<string, unknown>;
- **Problema**: details es opcional pero debería ser requerido para debugging. Además, unknown como valor es demasiado amplio.
- **Riesgo**: Bajo.
- **Solución recomendada**: Hacer details requerido con un tipo más específico: eadonly details: Record<string, string | number | boolean>;.

---

## 8. DTO/Entity confusion

### TS-031 — Campos con nombres diferentes en DTO vs Entity

- **Archivo**: src/types/domain.ts, src/types/order.ts
- **Problema**: Product tiene price: Money, ProductDTO tiene priceCents: number. Order tiene pricing: OrderPricing, OrderDTO tiene subtotalCents, 	axCents, etc. Esto fuerza mappers complejos.
- **Riesgo**: Medio.
- **Solución recomendada**: Considerar usar el mismo shape en DTO y Entity, o generar código de mapeo automáticamente.

### TS-032 — OrderItem extiende CartItem pero con campos diferentes

- **Archivo**: src/types/order.ts
- **Línea**: 47
- **Código**: export interface OrderItem extends Omit<CartItem, 'maxStock'> { readonly orderId: string; }
- **Problema**: OrderItem hereda price: Money de CartItem, pero en OrderDTO.items los items tienen priceCents: number. Esto fuerza una conversión adicional.
- **Riesgo**: Medio.
- **Solución recomendada**: Definir OrderItem sin extender CartItem, o alinear los DTOs.

### TS-033 — ProductSummary duplica campos de Product

- **Archivo**: src/types/domain.ts
- **Líneas**: 22-36, 56-64
- **Problema**: ProductSummary repite id, 
ame, price, category, image, stock, isActive. Debería extender Product con Omit.
- **Riesgo**: Bajo.
- **Solución recomendada**: export interface ProductSummary extends Omit<Product, 'description' | 'rating' | 'reviewCount' | 'createdAt' | 'updatedAt' | 'createdBy'> {}.

---

## 9. Interfaces demasiado amplias

### TS-034 — CartContextValue expone toda la API del carrito

- **Archivo**: src/store/cart/CartContext.ts
- **Líneas**: 12-20
- **Problema**: Expone ddItem, emoveItem, updateQuantity, clearCart, items, 	otalItems, 	otalPrice. Componentes que solo necesitan 	otalPrice se re-renderizan cuando cambia items.
- **Riesgo**: Medio.
- **Solución recomendada**: Dividir en CartStateContext y CartActionsContext, o usar selectores.

### TS-035 — AuthContextValue expone 8 valores

- **Archivo**: src/contexts/AuthContext.tsx
- **Líneas**: 6-18
- **Problema**: Similar a TS-034. Cualquier cambio en auth (ej: error) causa re-render en toda la app.
- **Riesgo**: Medio.
- **Solución recomendada**: Dividir en contextos separados o usar useMemo con selectores.

---

## 10. Errores de nullability

### TS-036 — useParams sin validación de ID

- **Archivo**: src/pages/ProductDetailPage.tsx
- **Línea**: 15
- **Código**: const { id } = useParams<{ id: string }>();
- **Problema**: useParams puede retornar undefined para id, pero el tipo lo marca como string. El código usa safeId = id ?? '' como workaround.
- **Riesgo**: Medio.
- **Solución recomendada**: Usar const id = useParams<{ id: string }>().id; y manejarlo como string | undefined, o usar un route guard.

### TS-037 — user?.uid ?? '' en OrdersPage

- **Archivo**: src/pages/OrdersPage.tsx
- **Línea**: 15
- **Código**: const userId = user?.uid ?? '';
- **Problema**: Si user es 
ull, userId es '', lo que causa queries inválidas en useOrders.
- **Riesgo**: Bajo.
- **Solución recomendada**: Redirigir a login si user es 
ull, o usar un guard de ruta.

### TS-038 — productToDelete puede ser 
ull en modal

- **Archivo**: src/pages/admin/ProductsPage.tsx
- **Líneas**: 207-208
- **Código**: description={productToDelete ? ¿Estás seguro de eliminar ""? : ''}
- **Problema**: El description del Modal acepta string | undefined, pero si productToDelete es 
ull, el modal muestra descripción vacía.
- **Riesgo**: Bajo.
- **Solución recomendada**: No renderizar el modal si productToDelete es 
ull.

---

## 11. Generic types mal diseñados

### TS-039 — PaginatedResult<T> mezcla items y paginación

- **Archivo**: src/types/api.ts
- **Líneas**: 33-36
- **Problema**: PaginatedResult<T> incluye pagination: PaginationState, pero en productsService se usa PaginatedResult<Product> con pagination.page = 1 hardcodeado.
- **Riesgo**: Medio.
- **Solución recomendada**: Separar PaginatedItems<T> de PaginationMeta, o usar PaginatedResult<T> solo para responses reales de backend.

### TS-040 — AsyncState<T> es correcto pero no se usa consistentemente

- **Archivo**: src/types/ui.ts, src/hooks/useProducts.ts
- **Líneas**: ui.ts:40, useProducts.ts:30-31
- **Problema**: AsyncState<T> es un discriminated union bien diseñado, pero useProducts retorna products: readonly Product[] en lugar de products: Product[] | null, rompiendo la relación entre status y data.
- **Riesgo**: Medio.
- **Solución recomendada**: Cambiar la firma de UseProductsResult a products: Product[] | null y exponer data en lugar de products directamente.

---

## 12. Props opcionales innecesarias (adicionales)

### TS-041 — error?: string en CheckoutPage vs ServiceError

- **Archivo**: src/pages/CheckoutPage.tsx
- **Línea**: 238
- **Código**: <p className="text-sm text-error-500">{checkoutError.message}</p>
- **Problema**: checkoutError es ServiceError | null, pero el componente no maneja el caso donde checkoutError sea 
ull de forma tipada (usa && que es correcto, pero el mensaje de error está hardcodeado).
- **Riesgo**: Bajo.
- **Solución recomendada**: Usar un componente ErrorState para errores de checkout.

---

## 13. Estados imposibles (adicionales)

### TS-042 — OrderStatusFilter incluye 'all' pero no se valida en transiciones

- **Archivo**: src/types/order.ts
- **Línea**: 114
- **Código**: export type OrderStatusFilter = 'all' | OrderStatus;
- **Problema**: 'all' no es un OrderStatus, pero se usa en la misma unión. Esto puede causar bugs si se pasa a funciones que esperan OrderStatus.
- **Riesgo**: Bajo.
- **Solución recomendada**: Separar en 	ype OrderStatus = ... y 	ype OrderStatusFilter = 'all' | OrderStatus.

---

## 14. Discriminated unions faltantes

### TS-043 — AuthContextValue no es discriminated

- **Archivo**: src/contexts/AuthContext.tsx
- **Líneas**: 6-18
- **Problema**: AuthContextValue tiene user: UserProfile | null y oleState: UserRoleState, pero no hay una propiedad status que discrimine los casos. Los consumidores deben verificar user === null && roleState === 'unauthenticated' manualmente.
- **Riesgo**: Medio.
- **Solución recomendada**: Cambiar a discriminated union:
  `	s
  type AuthContextValue =
    | { status: 'loading'; user: null; roleState: 'loading' }
    | { status: 'authenticated'; user: UserProfile; roleState: 'customer' | 'admin' }
    | { status: 'unauthenticated'; user: null; roleState: 'unauthenticated' };
  `

---

## 15. Resumen de prioridad

| ID | Severity | Esfuerzo | Valor |
|----|----------|----------|-------|
| TS-005 | CRITICAL | Bajo | Alto |
| TS-006 | CRITICAL | Bajo | Alto |
| TS-017 | CRITICAL | Medio | Alto |
| TS-026 | CRITICAL | Medio | Alto |
| TS-027 | CRITICAL | Bajo | Alto |
| TS-043 | HIGH | Medio | Alto |
| TS-007 | HIGH | Bajo | Alto |
| TS-011 | HIGH | Medio | Medio |
| TS-014 | HIGH | Bajo | Medio |
| TS-018 | HIGH | Bajo | Medio |
| TS-019 | HIGH | Medio | Medio |
| TS-020 | MEDIUM | Bajo | Medio |
| TS-021 | MEDIUM | Bajo | Medio |
| TS-022 | MEDIUM | Medio | Medio |
| TS-023 | MEDIUM | Bajo | Medio |
| TS-028 | MEDIUM | Bajo | Medio |
| TS-031 | MEDIUM | Medio | Medio |
| TS-032 | MEDIUM | Bajo | Medio |
| TS-033 | MEDIUM | Bajo | Bajo |
| TS-034 | MEDIUM | Medio | Medio |
| TS-035 | MEDIUM | Medio | Medio |
| TS-039 | MEDIUM | Bajo | Medio |
| TS-040 | MEDIUM | Bajo | Medio |
| TS-003 | MEDIUM | Bajo | Bajo |
| TS-004 | LOW | Bajo | Bajo |
| TS-008 | LOW | Bajo | Bajo |
| TS-009 | LOW | Bajo | Bajo |
| TS-010 | LOW | Bajo | Bajo |
| TS-012 | LOW | Bajo | Bajo |
| TS-013 | LOW | Bajo | Bajo |
| TS-015 | LOW | Bajo | Bajo |
| TS-016 | LOW | Bajo | Bajo |
| TS-029 | LOW | Bajo | Bajo |
| TS-030 | LOW | Bajo | Bajo |
| TS-036 | LOW | Bajo | Bajo |
| TS-037 | LOW | Bajo | Bajo |
| TS-038 | LOW | Bajo | Bajo |
| TS-041 | LOW | Bajo | Bajo |
| TS-042 | LOW | Bajo | Bajo |

---

*Generado por Kilo — 15/8/2026*