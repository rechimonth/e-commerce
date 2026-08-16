# E-Commerce

Aplicación de e-commerce impulsada por IA. Proyecto Integrador 5.

## Tech Stack

- React 18 + TypeScript (strict)
- Vite (build tool)
- React Router v6
- TailwindCSS
- ESLint + Prettier
- Vitest + React Testing Library

## Instalación

```bash
npm install
```

## Scripts

| Script           | Descripción                             |
| ---------------- | --------------------------------------- |
| `npm run dev`    | Inicia el servidor de desarrollo        |
| `npm run build`  | Build de producción (incluye typecheck) |
| `npm run lint`   | Ejecuta ESLint                          |
| `npm run format` | Formatea con Prettier                   |
| `npm run test`   | Ejecuta tests unitarios                 |

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores.

## AI Development Journal

### Cómo se usó IA en este proyecto

La IA se utilizó como asistente de desarrollo en las siguientes áreas, siempre bajo criterio y validación humana:

| Área | Evidencia |
|------|-----------|
| Planificación | `.kilo/plans/fix-test-suite.md` |
| Validación de decisiones técnicas | Eliminación de mocks globales Firebase, adopción de `useId()` |
| Code review | Reemplazo de emojis por SVG, estabilización de IDs |
| Generación de tests | Fixtures, mocks, `renderWithProviders`, suite de seguridad |
| Resolución de problemas | Fix de `border-center-1`, inline styles en Skeleton, CORS en upload |

### Intervenciones documentadas

1. **Planificación de test suite** (14/8/2026)
   - **Problema**: Mocks globales de Firebase rompían tests de infraestructura.
   - **Acción**: Se generó un plan paso a paso en `.kilo/plans/fix-test-suite.md`.
   - **Resultado**: Suite de tests ejecutable con aislamiento correcto.

2. **Eliminación de emojis de UI** (15/8/2026)
   - **Problema**: Inconsistencia visual y accesibilidad.
   - **Acción**: Reemplazo por iconos SVG inline (Lucide style).
   - **Resultado**: Navegación admin, dashboard y badges con iconografía consistente.

3. **IDs estables con `useId()`** (15/8/2026)
   - **Problema**: `Math.random()` generaba IDs diferentes entre renders.
   - **Acción**: Cambio a `useId()` en `Input`, `Select`, `Textarea`, `Checkbox`.
   - **Resultado**: Accesibilidad mejorada; tests de formulario estables.

4. **Mejora visual de componentes** (15/8/2026)
   - **Problema**: Estilos "académicos" con sombras débiles y transiciones ausentes.
   - **Acción**: Pulso de `Button`, `Card`, `Badge`, `Alert`, `Input`.
   - **Resultado**: Jerarquía visual, hover states y focus rings consistentes.

5. **Renombre del proyecto** (15/8/2026)
   - **Problema**: Nombre `e-commerce-ai` inconsistente con el branding.
   - **Acción**: Cambio a `e-commerce` en `package.json` y `README.md`.
   - **Resultado**: Proyecto alineado con nombre corto.

### Limitaciones

- No hay repositorio Git inicializado, por lo que no existen commits que verifiquen interacciones anteriores.
- Esta bitácora documenta exclusivamente lo que tiene respaldo en archivos verificables.

Para el detalle completo, ver [`docs/ai-notes.md`](docs/ai-notes.md).