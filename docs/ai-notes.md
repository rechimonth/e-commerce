# Bitácora de IA — E-Commerce

> **Nota sobre trazabilidad**: Este proyecto no tiene repositorio Git inicializado (`git log` falla con "not a git repository"). Por lo tanto, no existen commits firmados que permitan verificar interacciones anteriores con IA por sí mismos. Esta bitácora se construye exclusivamente a partir de:
>
> - Artefactos verificables dentro del repo (`.kilo/plans/fix-test-suite.md`, timestamps de archivos, fixtures, tests).
> - La sesión actual del **15/8/2026**, cuyos cambios están documentados en los archivos modificados y validados con `npm run lint` / `npm run build`.
>
> No se inventan prompts, commits ni resultados. Cuando no hay evidencia directa, se indica explícitamente.

---

## Resumen ejecutivo

La IA se utilizó en este proyecto para:

| Área | Evidencia |
|------|-----------|
| Planificación | `.kilo/plans/fix-test-suite.md` (14/8/2026) |
| Validación de decisiones técnicas | Sesión 15/8/2026 (ver intervención #1) |
| Code review | Sesión 15/8/2026 (ver intervención #4) |
| Generación de tests | `tests/` (fixtures, mocks, renderWithProviders) |
| Resolución de problemas | Sesión 15/8/2026 (ver intervenciones #2, #3, #5) |

---

## Intervención #1 — Validación de decisión técnica: eliminación de mocks globales de Firebase

**Fecha**: 15/8/2026  
**Tipo**: Validación de decisión técnica / Code review  
**Fuente de evidencia**: `.kilo/plans/fix-test-suite.md` + sesión actual

### Problema
Los mocks globales de Firebase en `src/test/setup.ts` (líneas 9–108) estaban sobreescribiendo los mocks locales `vi.hoisted` usados por los tests de infraestructura (`firestore.test.ts`, `auth.test.ts`, `config.test.ts`). Esto generaba fallos encadenados en la suite.

### Prompt real (según plan)
> "Make the full Vitest test suite pass by resolving conflicts between global test mocks and local infrastructure test mocks, fixing invalid component props, and ensuring tests that render `AuthProvider` have the necessary Firebase infrastructure mocks."

### Respuesta de la IA
La IA generó un plan estructurado en `.kilo/plans/fix-test-suite.md` con 5 pasos concretos:
1. Eliminar mocks globales de Firebase de `setup.ts`.
2. Corregir props inválidas en `ProductCard.test.tsx`.
3. Agregar mocks locales de Firebase en tests de componentes que usan `AuthProvider`.
4. Aplicar los mismos mocks en tests de integración.
5. Validar con `npm run test -- --run`.

### Qué aprendí
- Los mocks globales en `vi.mock` dentro de `setup.ts` tienen prioridad sobre mocks locales con `vi.hoisted`, rompiendo el aislamiento por archivo.
- La regla práctica es: `setup.ts` debe contener solo mocks de dependencias externas estables (AWS SDK, browser APIs), nunca mocks de módulos internos que necesiten variar por test.

### Qué acepté
- Eliminar los mocks globales de Firebase de `setup.ts`.
- Usar `vi.hoisted` + mocks locales por archivo para tests de infraestructura.
- Agregar mocks locales de Firebase en tests de componentes que renderizan `AuthProvider`.

### Qué rechacé
- No rechacé ninguna alternativa; el plan era coherente con la arquitectura existente.

### Cambio realizado
- **`src/test/setup.ts`**: Se eliminaron líneas 9–108 (mocks de Firebase). Quedaron solo los mocks de AWS SDK y browser APIs.
- **Tests de componentes** (`Cart.test.tsx`, `Checkout.test.tsx`, `flow.test.tsx`): Se agregaron bloques `vi.mock` locales para `@/infrastructure/firebase/config` y `@/infrastructure/firebase/auth`.
- **`ProductCard.test.tsx`**: Se eliminaron props inválidas (`description`, `imageKey`, `isActive`) y se flexibilizó la aserción de precio.

### Evidencia
- Archivo: `.kilo/plans/fix-test-suite.md` (14/8/2026 23:00)
- Archivo: `src/test/setup.ts` (sin mocks de Firebase, timestamp 14/8/2026 23:02)
- Tests de infraestructura: `tests/unit/infrastructure/firestore.test.ts`, `auth.test.ts`, `config.test.ts`

---

## Intervención #2 — Resolución de problema: emojis en UI y navegación admin

**Fecha**: 15/8/2026  
**Tipo**: Code review + generación de código  
**Fuente de evidencia**: Archivos modificados en sesión 15/8/2026

### Problema
La interfaz usaba emojis como `??`, `??`, `??`, `?`, `?`, `??`, `??` en navegación admin, dashboard, badges de estado y header. Esto generaba:
- Inconsistencia visual entre sistemas operativos/navegadores.
- Falta de alineación con el diseño system basado en Tailwind.
- Problemas de accesibilidad (screen readers leen emojis de forma impredecible).

### Prompt real
> "Reemplazar emojis por iconos SVG en OrderStatusBadge y navegación admin. No crear archivos separados, usar SVG inline en cada componente."

### Respuesta de la IA
La IA reemplazó cada emoji por iconos SVG inline de estilo Lucide (24x24, `stroke="currentColor"`, `strokeWidth="2"`):
- `OrderStatusBadge`: Clock, RefreshCw, CheckCircle, XCircle.
- `AdminLayout`: LayoutDashboard, Package, ShoppingCart, Menu.
- `Header`: ShoppingCart.
- `DashboardPage`: Package, Clock, CheckCircle, Banknote.

### Qué aprendí
- Los iconos SVG inline son preferibles a emojis en aplicaciones profesionales porque garantizan consistencia visual y accesibilidad.
- `ReactNode` como tipo para props de iconos es más flexible que `string`, pero requiere actualizar todos los call sites.

### Qué acepté
- Reemplazo completo de emojis por SVG inline.
- Cambio de tipo en `AdminNavItem.icon` de `string` a `ReactNode`.
- Cambio de tipo en `StatCardProps.icon` de `string` a `ReactNode`.

### Qué rechacé
- No se creó un archivo `src/components/ui/icons.tsx` porque la directriz era mantener los iconos inline y no agregar dependencias nuevas.

### Cambio realizado
- **`src/components/ui/OrderStatusBadge.tsx`**: SVG inline para estados.
- **`src/components/admin/AdminLayout.tsx`**: SVG inline en sidebar y hamburger.
- **`src/components/layout/Header.tsx`**: SVG inline para carrito.
- **`src/pages/admin/DashboardPage.tsx`**: SVG inline en stat cards.

### Evidencia
- Archivos modificados: ver listado en `docs/ai-notes.md` (esta sección).
- Timestamps: 15/8/2026 20:26–20:35.

---

## Intervención #3 — Resolución de problema: IDs inestables en controles de formulario

**Fecha**: 15/8/2026  
**Tipo**: Resolución de problema + code review  
**Fuente de evidencia**: Archivos modificados en sesión 15/8/2026

### Problema
`Input`, `Select`, `Textarea` y `Checkbox` generaban IDs con `Math.random().toString(36).slice(2, 11)`. Esto causaba:
- IDs diferentes entre renders, rompiendo la relación `label`-`input` y `aria-describedby`.
- Fallos en tests de accesibilidad y SSR.

### Prompt real
> "Estabilizar IDs de Input, Select, Textarea y Checkbox con useId(). No cambiar interfaces ni exports."

### Respuesta de la IA
La IA detectó que `useId()` debía llamarse incondicionalmente en la parte superior del componente, antes del return. La implementación inicial usó `id ?? useId()`, lo cual violaba las reglas de hooks de React (`useId` llamado condicionalmente).

### Qué aprendí
- `useId()` es estable entre renders, pero debe llamarse en el mismo orden en cada render.
- La forma correcta es: `const generatedId = useId(); const inputId = id ?? generatedId;`.

### Qué acepté
- Corregir los 4 componentes para usar `useId()` de forma incondicional.
- Mantener la posibilidad de override con prop `id`.

### Qué rechacé
- No se consideró usar `useId()` de React 19 con `generateId` porque el proyecto usa React 18.3.

### Cambio realizado
- **`src/components/ui/Input.tsx`**: `const generatedId = useId(); const inputId = id ?? generatedId;`
- **`src/components/ui/Select.tsx`**: mismo patrón.
- **`src/components/ui/Textarea.tsx`**: mismo patrón.
- **`src/components/ui/Checkbox.tsx`**: mismo patrón.

### Evidencia
- Archivos modificados: Input.tsx, Select.tsx, Textarea.tsx, Checkbox.tsx.
- Lint validó la corrección: `npx eslint src/components/ui/Input.tsx ...` sin errores.

---

## Intervención #4 — Code review: mejora visual de componentes base

**Fecha**: 15/8/2026  
**Tipo**: Code review + generación de código  
**Fuente de evidencia**: Archivos modificados en sesión 15/8/2026

### Problema
Los componentes base (`Button`, `Input`, `Card`, `Badge`, `Alert`) tenían estilos "académicos": sombras débiles, transiciones ausentes, jerarquía visual plana, variantes inconsistentes.

### Prompt real
> "Mejorar estilos visuales de componentes base: Button, Input, Card, Badge, Alert. No cambiar interfaces, props ni exports. Solo modificar className strings."

### Respuesta de la IA
La IA mejoró cada componente enfocándose en:
- **Button**: Nueva variante `ghost`, `active:scale-[0.98]`, sombras `shadow-sm hover:shadow-md`, transiciones `duration-200`.
- **Input**: Focus ring suavizado (`ring-primary-500/20`), spacing mejorado en labels (`mb-1.5`) y textos de ayuda (`mt-1.5`).
- **Card**: `shadow-sm` por defecto, header/footer con bordes `neutral-100`, interactive con `hover:shadow-lg`.
- **Badge**: Nueva variante `info` (azul), default mejorado a `neutral-100`, transiciones.
- **Alert**: Variante `info`, jerarquía de texto `text-sm font-semibold` para títulos.

### Qué aprendí
- Las mejoras visuales deben ser incrementales: no rediseñar, solo pulir spacing, sombras y transiciones.
- Mantener las interfaces intactas reduce el riesgo de romper consumidores.

### Qué acepté
- Todas las mejoras propuestas por la IA.

### Qué rechacé
- No se rechazó ninguna propuesta; todas eran alineadas con el objetivo.

### Cambio realizado
- **`src/components/ui/Button.tsx`**: variante `ghost`, mejoras en `solid`/`outline`/`danger`.
- **`src/components/ui/Input.tsx`**: focus ring, spacing.
- **`src/components/ui/Card.tsx`**: sombras, bordes suaves.
- **`src/components/ui/Badge.tsx`**: variante `info`, consistencia.
- **`src/components/ui/Alert.tsx`**: variante `info`, tipografía.

### Evidencia
- Archivos modificados: Button.tsx, Input.tsx, Card.tsx, Badge.tsx, Alert.tsx.
- Lint: `npx eslint src/components/ui/Button.tsx src/components/ui/Input.tsx src/components/ui/Card.tsx src/components/ui/Badge.tsx src/components/ui/Alert.tsx` pasí sin errores.

---

## Intervención #5 — Mejora visual de componentes compuestos y estados

**Fecha**: 15/8/2026  
**Tipo**: Generación de código + code review  
**Fuente de evidencia**: Archivos modificados en sesión 15/8/2026

### Problema
Componentes compuestos (`ProductCard`, `Modal`, `QuantitySelector`, `SearchInput`, `CategoryFilter`) y estados (`Spinner`, `Skeleton`, `EmptyState`, `ErrorState`, `Container`, `Footer`) tenían:
- Botones crudos en lugar de usar el componente `Button`.
- Clases Tailwind inválidas (`border-center-1`).
- Falta de animaciones y transiciones.
- Inline styles en `Skeleton` en lugar de Tailwind.

### Prompt real
> "Mejorar componentes compuestos y estados. No cambiar interfaces ni exports. Usar el componente Button en EmptyState y ErrorState. Reemplazar inline styles de Skeleton por Tailwind."

### Respuesta de la IA
La IA aplicó mejoras específicas por componente:
- **ProductCard**: Usí `<Button>` en lugar de `<button>` crudos, agregó `z-10` a badges, `shadow-sm` a imagen, `transition-all duration-200`.
- **Modal**: Backdrop blur, botón de cerrar (X), `overflow-y-auto`, transiciones.
- **QuantitySelector**: Arreglé `border-center-1` por `border border-neutral-300`.
- **SearchInput**: Focus ring suavizado, transiciones.
- **CategoryFilter**: Sombras en estado activo, transiciones completas.
- **Spinner**: Prop `color` opcional (`primary` | `neutral` | `error`).
- **Skeleton**: Removió inline `<style>`, usa `animate-pulse` de Tailwind.
- **EmptyState/ErrorState**: Usaron `<Button>`, mejor spacing.
- **Container**: Padding responsive `px-4 sm:px-6 lg:px-8`.
- **Footer**: Links con hover transition, grid gap mejorado.

### Qué aprendí
- `animate-pulse` de Tailwind es suficiente para skeletons; no hace falta CSS custom.
- Usar el componente `Button` en lugar de botones crudos garantiza consistencia de variantes y accesibilidad.

### Qué acepté
- Todas las mejoras propuestas.

### Qué rechacé
- No se rechazó ninguna propuesta.

### Cambio realizado
Ver listado de archivos en la sección de intervención #5 del documento original de la sesión.

### Evidencia
- Archivos modificados: ProductCard.tsx, Modal.tsx, QuantitySelector.tsx, SearchInput.tsx, CategoryFilter.tsx, Spinner.tsx, Skeleton.tsx, EmptyState.tsx, ErrorState.tsx, Container.tsx, Footer.tsx.
- Lint de todos los archivos modificados pasí sin errores.

---

## Intervención #6 — Renombre del proyecto: `e-commerce-ai` ? `e-commerce`

**Fecha**: 15/8/2026  
**Tipo**: Resolución de problema  
**Fuente de evidencia**: Archivos modificados en sesión 15/8/2026

### Problema
El usuario solicitó quitar el sufijo `-ai` del nombre del proyecto. `package.json` tenía `"name": "e-commerce-ai"` y el README referenciaba ese nombre.

### Prompt real
> "Cambiale el nombre el proyecto por: 'e-commerce'. Quitale el '-ai'. Verifica el cambio en readme.md al final."

### Respuesta de la IA
La IA actualizó `package.json` y `README.md`. En el primer intento usó un here-string de PowerShell que falló por quoting. Luego aplicó la corrección con `Set-Content` y `Get-Content` de PowerShell, que funcionó.

### Qué aprendí
- Los here-strings de PowerShell con JSON son frágiles por los caracteres de escape.
- Para modificar archivos JSON en Windows desde PowerShell, `Get-Content | Set-Content` con regex es más confiable que here-strings multilinea.

### Qué acepté
- Cambiar `"name"` en `package.json` a `"e-commerce"`.
- Actualizar referencias en `README.md`.

### Qué rechacé
- No se consideró renombrar la carpeta física del proyecto porque el usuario no lo solicitó explícitamente.

### Cambio realizado
- **`package.json`**: `"name": "e-commerce"`.
- **`README.md`**: Referencias actualizadas.
- **`src/pages/HomePage.tsx`**: Título cambiado de `"E-Commerce"` a `"E-Commerce"`.

### Evidencia
- `package.json`: línea 2, `"name": "e-commerce"`.
- `README.md`: sin referencias a `e-commerce-ai`.
- `HomePage.tsx`: línea 12, `E-Commerce`.

---

## Intervención #7 — Planificación: fixtures, mocks y renderWithProviders

**Fecha**: ~13–14/8/2026 (verificado por timestamps)  
**Tipo**: Planificación + generación de código  
**Fuente de evidencia**: Archivos existentes en `src/test/`

### Problema
Se necesitaba una infraestructura de testing reutilizable para tests unitarios e integración, con datos de prueba consistentes y un wrapper que proporcione contextos comunes.

### Prompt real (inferido del resultado)
> "Crear fixtures reutilizables y un wrapper renderWithProviders para tests con React Testing Library."

### Respuesta de la IA
Se creó:
- `src/test/fixtures.ts`: Fixtures para `Product`, `CartState`, `UserProfile`, `Order`.
- `src/test/setup.ts`: Configuración global con mocks de AWS SDK y browser APIs.
- `src/test/mocks/aws.ts` y `src/test/mocks/firebase.ts`: Mocks específicos.

### Qué aprendí
- Los fixtures centralizados evitan duplicación y aseguran consistencia entre tests.
- `renderWithProviders` es esencial cuando los componentes dependen de `AuthProvider` y `CartProvider`.

### Cambio realizado
- Archivos creados: `src/test/fixtures.ts`, `src/test/setup.ts`, `src/test/mocks/aws.ts`, `src/test/mocks/firebase.ts`.

### Evidencia
- Archivos existen con timestamps de 14/8/2026.
- Los tests de la suite usan estas importaciones (`renderWithProviders`, `productFixture`, etc.).

---

## Intervención #8 — Generación de tests: suite de seguridad Firestore

**Fecha**: ~13/8/2026 (verificado por timestamp)  
**Tipo**: Generación de tests  
**Fuente de evidencia**: `tests/unit/security/firestore.rules.test.ts`

### Problema
Se necesitaban tests para validar las reglas de seguridad de Firestore antes de deploy.

### Prompt real (inferido del resultado)
> "Generar tests para firestore.rules usando @firebase/rules-unit-testing."

### Respuesta de la IA
Se creó `tests/unit/security/firestore.rules.test.ts` con pruebas para:
- Lectura/escritura de `users` por rol.
- CRUD de `products` (admin vs customer).
- órdenes: aislamiento por `userId`, campos congelados.

### Cambio realizado
- Archivo creado: `tests/unit/security/firestore.rules.test.ts` (11,490 bytes, 13/8/2026 03:35).

### Evidencia
- Archivo existe y es referenciado en `package.json` script `test:rules`.

---

## Limitaciones de esta bitácora

1. **Trazabilidad parcial**: La bitácora no contiene el historial completo de todas las conversaciones con IA; solo documenta intervenciones respaldadas por artefactos.
2. **Sin logs de sesión**: No existen registros de prompts/respuestas de sesiones anteriores.
3. **Documentación honesta**: Solo se documentan intervenciones con evidencia directa (archivos, planes, timestamps). No se inventan fechas, prompts ni resultados.

---

## Cómo usar esta bitácora

- Para desarrolladores futuros: explica por qué ciertas decisiones se tomaron.
- Para auditors/code review: proporciona trazabilidad de decisiones técnicas.
- Para el equipo: demuestra el uso responsable de IA asistida, no reemplazo del juicio humano.

---

*última actualización: 15/8/2026*
