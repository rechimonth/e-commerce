# Preparación Defensa Técnica — Proyecto Integrador 5 (continuación)

> **Proyecto**: E-Commerce (Patagonix Tech)  
> **Evaluador**: Kilo (Staff Full-Stack Engineer)  
> **Fecha**: 16/8/2026

---

## 6. Errores que debes evitar durante la defensa (continuación)

| Error | Por qué es grave | Cómo evitarlo |
|-------|------------------|---------------|
| Decir "el frontend no se puede hackear" | Ignora que el cliente controla el DOM y las requests | Mencionar siempre Firestore Rules como boundary |
| Confundir VITE_FIREBASE_API_KEY con secret | Es public por diseño; no es credencial | Explicar que es el config público de Firebase |
| Decir que AWS credentials están en el .env | Deben estar en Vercel server envs | Mencionar `process.env` en Vercel Functions |
| Omitir el estado `loading` en roles | Race condition: redirección antes de resolver rol | Mencionar `UserRoleState.loading` y ProtectedRoute |
| Decir que useReducer es "mejor" sin justificar | No hay herramienta mejor, solo adecuada | Dar razones específicas: pureza, testeo, lógica compleja |
| Inventar commits o prompts de IA | La bitácora debe ser verificable | Solo documentar archivos existentes |
| Decir "Firestore es mejor que SQL" sin criterios | Depende del caso de uso | Mencionar integración con Firebase Auth, offline support, escalabilidad automática |
| Mostrar código sin explicar arquitectura | El evaluador quiere saber por qué, no solo qué | Siempre conectar código con decisiones arquitectónicas |
| Decir "no sé" ante una pregunta técnica | Muestra falta de dominio del proyecto | Si no sabés, decí "no lo pensé, pero lo analizo así..." y razoná en vivo |
| Culpar a la IA por errores del código | Vos tomaste las decisiones, la IA asistió | Usar "decidí aceptar/rechazar la sugerencia de IA" |
| Olvidar mencionar Firestore Rules | Es el boundary de seguridad real del proyecto | Mencionar siempre defense in depth: frontend + Rules |
| Confundir presigned URL con upload directo con credenciales | Son modelos de seguridad opuestos | Explicar firma criptográfica, tiempo limitado, operación específica |
| No saber responder sobre tests fallidos | Muestra falta de diagnóstico | Explicar causa raíz y plan de corrección |
| Decir "todavía no hicimos Git" sin plan | Muestra falta de orden | Mencionar próximos pasos: `git init`, commits semánticos, `.gitignore` |
| Olvidar mencionar el AI journal | Es un requisito explícito del proyecto | Tener preparada la lista de 8 intervenciones documentadas |

---

## 7. Preguntas de control rápido (5 minutos)

Estas preguntas verifican que entendiste los conceptos básicos. Deben responderse en 1-2 minutos cada una.

### 7.1 TypeScript

**Q: ¿Qué es un discriminated union?**
> Es un tipo con una propiedad literal común que permite narrow seguro con switch. Ejemplo en el proyecto: `AsyncStatus` ('idle' | 'loading' | 'success' | 'error') y `OrderStatus`.

**Q: ¿Qué hace `strict: true` en tsconfig?**
> Habilita `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, etc. Obliga a tipificar todo explícitamente, previniendo bugs silenciosos.

**Q: ¿Por qué `readonly` en las entidades?**
> Inmutabilidad por diseño. Previene mutaciones accidentales, especialmente importante en el reducer puro.

### 7.2 React

**Q: ¿Qué es un custom hook?**
> Una función que usa otros hooks y encapsula lógica reutilizable. Ejemplo: `useDebounce`, `useProducts`, `useCart`.

**Q: ¿Cuándo usar `useCallback`?**
> Cuando pasas una función a componentes hijos memorizados o como dependencia de useEffect/memo. En el proyecto: `addItem`, `removeItem` en `CartProvider` para mantener referencias estables.

**Q: ¿Qué es `lazy` + `Suspense`?**
> Code splitting nativo. `lazy()` carga componentes de forma diferida; `Suspense` muestra un fallback mientras carga. Usado en `App.tsx` para las páginas.

### 7.3 Firebase

**Q: ¿Qué es `onAuthStateChanged`?**
> Listener de Firebase Auth que dispara cuando el estado de autenticación cambia (login, logout, token refresh). Usado en `observeAuthState` para mantener la sesión sincronizada.

**Q: ¿Qué es un DTO?**
> Data Transfer Object. Representa el shape crudo de Firestore (ej: `ProductDTO` con `priceCents`, `createdAt` como timestamp). La entidad de dominio (`Product`) usa tipos más ricos (`Money`, `Date`).

**Q: ¿Qué son Firestore Rules?**
> Reglas declarativas que definen quién puede leer/escribir qué documentos. Son el boundary de seguridad del backend.

### 7.4 AWS/S3

**Q: ¿Qué es una presigned URL?**
> URL temporal con firma criptográfica que permite una operación específica (PUT/GET) en S3 por tiempo limitado, sin exponer credenciales.

**Q: ¿Por qué no usar credenciales de AWS en el cliente?**
> Principle of least privilege. El cliente solo necesita subir un archivo a una key específica, no acceso completo al bucket.

### 7.5 Testing

**Q: ¿Qué es Vitest?**
> Framework de testing rápido, compatible con Vite, con API similar a Jest. Usa `vi.mock`, `vi.hoisted`, `describe`, `it`, `expect`.

**Q: ¿Qué es `renderHook`?**
> Función de React Testing Library para testear hooks en aislamiento. Requiere un wrapper con providers si el hook depende de contextos.

**Q: ¿Qué es `renderWithProviders`?**
> Wrapper custom que envuelve componentes en `MemoryRouter`, `AuthProvider`, `CartProvider` para tests de integración.

---

## 8. Preguntas de profundidad técnica (10 minutos)

Estas preguntas evalúan comprensión profunda. Deben responderse con ejemplos concretos del código.

### 8.1 Arquitectura

**Q: Explicá el flujo de datos desde que el usuario busca un producto hasta que se muestra en pantalla.**
> 1. Usuario escribe en `SearchInput` → actualiza `searchTerm` en `CatalogPage`.
> 2. `useProducts` recibe `searchTerm`, aplica `useDebounce(300ms)`.
> 3. Cuando el debounced value cambia, `useEffect` dispara `productsService.fetchProducts({ search, category, limit })`.
> 4. `productsService` llama a `getProducts` en `infrastructure/firebase/firestore.ts`.
> 5. `getProducts` construye un query con `where('category', '==', ...)` y `orderBy('createdAt', 'desc')`, ejecuta `getDocs`.
> 6. Los `QueryDocumentSnapshot` se mapean a `ProductDTO` con `docToProduct`.
> 7. `productsService` convierte `ProductDTO[]` a `Product[]` con `toProduct`.
> 8. `useProducts` actualiza `products` y `status: 'success'`.
> 9. `CatalogPage` renderiza el grid con `ProductCard`.

**Q: Si tuvieras que agregar paginación real, ¿dónde tocarías?**
> - `productsService.fetchProducts`: agregar `cursor` al `FetchProductsParams`, usar `startAfter` en el query de Firestore.
> - `useProducts`: exponer `hasNext`, `hasPrev` del `PaginatedResult`.
> - `CatalogPage`: agregar botones "Siguiente/Anterior" que llaman a `refetch` con nuevo cursor.
> - Firestore: necesito un índice compuesto `category + isActive + createdAt` (si no existe, falla con `FAILED_PRECONDITION`).

### 8.2 Seguridad

**Q: ¿Qué pasa si un customer modifica el HTML para cambiar `roleState` a `admin`?**
> El frontend es solo presentación. Firestore Rules evalúan `request.auth.uid` contra el documento real en `users/{uid}`. Un customer no puede escribir `role: 'admin'` porque las reglas de `users` solo permiten que el admin cambie roles (`allow update: if isAdmin()`). Incluso si lograra inyectar código para hacer `updateDoc(doc(db, 'users', uid), { role: 'admin' })`, Firestore lo deniega.

**Q: ¿Por qué no alcanza con `AdminRoute` para seguridad?**
> `AdminRoute` es una conveniencia de UX. El usuario puede desactivar JavaScript, modificar el DOM, o hacer requests directos con curl. Las reglas de Firestore son el único boundary que no puede ser bypasseado por el cliente.

### 8.3 TypeScript

**Q: Mostrá un ejemplo de discriminated union en el proyecto.**
> `AsyncStatus` es un discriminated union:
```typescript
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';
```
En `useProducts`, el switch sobre `status` permite narrow seguro:
```typescript
if (status === 'loading') return <Spinner />;
if (status === 'error') return <ErrorState message={error.message} />;
if (status === 'success' && isEmpty) return <EmptyState />;
```

**Q: ¿Qué ventaja tiene `type OrderStatus = (typeof ORDER_STATUSES)[number]`?**
> Si alguien agrega un status a `ORDER_STATUSES` pero olvida actualizar `canTransition` o `VALID_ORDER_TRANSITIONS`, TypeScript falla en compilación. Es type-safe por diseño.

---

## 9. Preguntas sobre decisiones rechazadas o alternativas

### 9.1 "¿Por qué no Redux?"

> Redux agregaría boilerplate (actions, reducers, selectors, middleware) para un proyecto con 2 ámbitos globales (auth, cart). Context API + useReducer cumple el requisito sin dependencias. Si en el futuro necesitamos selectores complejos o time-travel debugging, migrar es posible, pero no es el caso actual.

### 9.2 "¿Por qué no React Query?"

> React Query (TanStack Query) excelente para caching y background refetching, pero el proyecto usa hooks custom (`useProducts`, `useOrders`) con `useEffect` + `useState` porque:
> 1. Los requisitos piden hooks custom.
> 2. La lógica de filtrado y debouncing es específica del dominio.
> 3. No hay background refetching ni stale-while-revalidate en los requisitos.

### 9.3 "¿Por qué no usar `firebase.initializeApp` en el top-level module?"

> `initializeFirebase` es lazy y guarda instancias en variables privadas (`_app`, `_auth`, `_db`). Esto permite:
> 1. Inicializar Firebase solo cuando se necesita (no en SSR/SSG).
> 2. Resetear el estado en tests con `_resetFirebaseForTesting`.
> 3. Evitar initializeApp duplicado si el módulo se recarga.

### 9.4 "¿Por qué `serverTimestamp()` en lugar de `new Date()` en Firestore?"

> `serverTimestamp()` genera el timestamp en el servidor de Firestore, evitando desfases de reloj entre clientes. Es crítico para `createdAt`, `updatedAt` y `statusHistory` donde la consistencia temporal importa.

---

## 10. Preguntas sobre testing y mocks

### 10.1 "¿Por qué `cartReducer` es una función pura y no un método de clase?"

> Una función pura `(state, action) => newState` es:
> - Determinística: mismos inputs = mismos outputs.
> - Testeable sin React, sin provider, sin render.
> - Depurable: puedo loguear `(state, action)` y replay.
> - Portátil: puede vivir en `utils/` sin importar React.

### 10.2 "¿Qué dificultades tuviste con los mocks de Firebase?"

> Los mocks globales en `setup.ts` (`vi.mock` hoisted) se aplicaban a todos los tests, rompiendo el aislamiento en `auth.test.ts` y `firestore.test.ts` que necesitan controlar `getDoc`, `addDoc` individualmente. La solución fue mover los mocks de Firebase a archivos locales con `vi.hoisted` y dejar `setup.ts` solo con mocks de AWS y browser APIs.

### 10.3 "¿Cómo testeás el carrito sin Firebase?"

> `cartReducer.test.ts` testea el reducer puro sin React ni Firebase. `useCart.test.ts` testea el hook con `renderHook` y `CartProvider` mockeado. `CartPage.test.ts` testea el componente con mocks de `useCart`. Cada capa se testea en aislamiento.

---

## 11. Preguntas sobre deployment y producción

### 11.1 "¿Qué falta para deployar a producción?"

> 1. Inicializar Git y hacer commits.
> 2. Configurar environment variables en Vercel dashboard.
> 3. Configurar CORS en bucket S3.
> 4. Crear `firestore.indexes.json` con índices compuestos.
> 5. Reemplazar verificación simulada de Firebase token en `api/upload.ts` por `firebase-admin`.
> 6. Corregir tests fallantes.

### 11.2 "¿Qué es un smoke test de producción?"

> Un test automático o manual que verifica que el deploy funciona: carga la URL, hace login, navega al catálogo, agrega un producto al carrito. Si cualquiera de esos pasos falla, el deploy se revierte. En Vercel, se puede configurar en el dashboard como "Production Checks".

---

## 12. Checklist pre-defensa

### 24 horas antes

- [ ] Leer `docs/audit-matrix.md` completo.
- [ ] Repasar `docs/ai-notes.md` y poder explicar cada intervención.
- [ ] Abrir el proyecto en VS Code y tener listos los archivos clave para mostrar.
- [ ] Ejecutar `npm run build`, `npm run lint`, `npm run test` y tener los resultados frescos.
- [ ] Preparar la demo en un branch separado o con datos de prueba cargados.

### 1 hora antes

- [ ] Repasar las 20 preguntas básicas y las respuestas modelo.
- [ ] Preparar 2-3 ejemplos de código para mostrar (reducer, rules, presigned URL).
- [ ] Tener a mano la lista de errores a evitar.
- [ ] Verificar que el entorno de desarrollo funcione (`npm run dev`).

### Durante la defensa

- [ ] Escuchar la pregunta completa antes de responder.
- [ ] Responder con código concreto, no conceptos abstractos.
- [ ] Admitir lo que no sabés y razonar en voz alta.
- [ ] Mencionar tradeoffs, no solo "lo hice así porque funciona".
- [ ] Conectar cada respuesta con la arquitectura del proyecto.

---

## 13. Preguntas que el evaluador TE HARÁ y cómo responder

| Pregunta del evaluador | Respuesta esperada |
|-------------------------|-------------------|
| "¿Por qué useReducer y no useState?" | Ver P10. |
| "¿Por qué no Zustand?" | Ver P7. |
| "¿Qué pasa si Auth dice autenticado pero Firestore no devolvió el rol?" | Ver P3. |
| "¿Qué impide que un customer entre al admin?" | Ver P4 + Firestore Rules. |
| "¿Qué impide que un customer lea la orden de otro?" | Ver P5 + `isOrderOwner()`. |
| "¿Por qué no subir a S3 con credenciales directas?" | Ver P6. |
| "¿Qué es una presigned URL?" | Ver P18. |
| "¿Dónde viven las AWS credentials?" | Ver P19. |
| "¿Qué pasa si falla createOrder después de confirmar?" | Ver P22. |
| "¿Cómo evitás doble checkout?" | Ver P23. |
| "¿Cómo testeás Firebase sin Firebase?" | Ver P26. |
| "¿Cómo testeás un hook con múltiples contexts?" | Ver P27. |
| "¿Qué responsabilidad tiene components/?" | Ver P13. |
| "¿Por qué los services están separados?" | Ver P14. |
| "¿Cómo funciona el debounce?" | Ver P15. |
| "¿Qué pasa con el carrito al recargar?" | Ver P16. |
| "¿Qué pasa si localStorage está corrupto?" | Ver P17. |
| "¿Qué hiciste con IA y qué rechazaste?" | Ver P34. |
| "¿Por qué el rol está en Firestore y no en Auth custom claims?" | Ver P12. |
| "¿Qué son Firestore Rules?" | Ver P16. |
| "¿Por qué dos contexts separados?" | Ver P8. |
| "¿Qué es un DTO?" | Ver P15. |
| "¿Cómo funciona el checkout simulado?" | Ver P21. |
| "¿Qué falta para producción?" | Ver P11.1. |

---

*Generado por Kilo — Preparación Defensa Técnica — Proyecto Integrador 5 — 16/8/2026*