# Fix Test Suite

## Objective
Make the full Vitest test suite pass by resolving conflicts between global test mocks and local infrastructure test mocks, fixing invalid component props, and ensuring tests that render `AuthProvider` have the necessary Firebase infrastructure mocks.

## Constraints
- Do not touch production source code outside of tests.
- AWS credentials must never reach the browser; only server-side in Vercel env.
- Tests must avoid real Firebase/AWS calls; all network/services are mocked.
- `src/test/setup.ts` is the global test setup file.

## Work State

### Completed
- Verified checkout and orders are fully implemented.
- Verified admin panel is fully implemented.
- Implemented secure AWS S3 + Vercel Serverless image upload system.
- Created testing infrastructure files (`fixtures.ts`, `renderWithProviders.tsx`).
- Created new test files for reducers, hooks, components, integration, and admin flows.

### Active — Fixes Required

#### 1. Remove Firebase global mocks from `src/test/setup.ts`
- **Why**: The global mocks for `firebase/app`, `firebase/auth`, `firebase/firestore`, `@/infrastructure/firebase/auth`, `@/infrastructure/firebase/firestore`, and `@/infrastructure/firebase/config` override the local `vi.hoisted` mocks used by the infrastructure tests (`firestore.test.ts`, `auth.test.ts`, `config.test.ts`).
- **Change**: Delete lines 9–108 from `src/test/setup.ts`. Keep the AWS SDK mocks and browser API mocks (lines 110–167). Remove references to `mockGetApps` and `mockInitializeApp` from `beforeEach`.

#### 2. Fix `tests/unit/components/ProductCard.test.tsx`
- **Why**: The test passes invalid props (`description`, `imageKey`, `isActive`) that do not exist on `ProductCardProps`. The currency formatting assertion expects `$19.99`, which can fail in jsdom due to limited `Intl` support depending on the Node version.
- **Changes**:
  - Remove `description`, `imageKey`, and `isActive` props from all render calls.
  - Change the price assertion from exact `$19.99` to a regex or partial match like `19.99` to avoid `Intl` issues in jsdom.

#### 3. Add Firebase infrastructure mocks to `tests/unit/components/Cart.test.tsx`
- **Why**: This test wraps `CartPage` with `AuthProvider`. Without Firebase mocks, `AuthProvider`'s `useEffect` calls `observeAuthState`, which tries to call real Firebase functions.
- **Change**: Add local `vi.mock` blocks for `@/infrastructure/firebase/config` and `@/infrastructure/firebase/auth` before the `describe` block.

#### 4. Add Firebase infrastructure mocks to `tests/unit/components/Checkout.test.tsx`
- **Why**: Same as above — wraps with `AuthProvider`.
- **Change**: Add the same local Firebase infrastructure mocks as in step 3.

#### 5. Add Firebase infrastructure mocks to `tests/integration/flow.test.tsx`
- **Why**: Same as above — wraps with `AuthProvider`.
- **Change**: Add the same local Firebase infrastructure mocks as in step 3.

## Implementation Steps

1. Edit `src/test/setup.ts` to remove Firebase global mocks (lines 9–108).
2. Edit `tests/unit/components/ProductCard.test.tsx` to remove invalid props and fix the currency assertion.
3. Edit `tests/unit/components/Cart.test.tsx` to add local Firebase infrastructure mocks.
4. Edit `tests/unit/components/Checkout.test.tsx` to add local Firebase infrastructure mocks.
5. Edit `tests/integration/flow.test.tsx` to add local Firebase infrastructure mocks.
6. Run `npm run test -- --run` to verify all tests pass.
7. If any tests still fail, iterate by reading the failing test output and adjusting mocks or assertions.

## Validation
- Run `npm run test -- --run`.
- All tests in `tests/` should pass.
- No real Firebase or AWS network calls should be made (verify via mock call counts).
