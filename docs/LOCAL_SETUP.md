# Configuración local rápida

1. Copia `.env.example` como `.env`.
2. Completa las variables `VITE_FIREBASE_*` con la configuración de la Web App de Firebase.
3. Para probar `/api/upload` localmente, agrega también las variables server-only:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_S3_BUCKET`
   - `AWS_REGION`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
4. Ejecuta:

```bash
npm ci
npm run dev
```

Si las variables de Firebase no están configuradas, la aplicación muestra un mensaje de configuración en lugar de quedar en una pantalla blanca.

**Nunca subas `.env` al repositorio.**
