# FROGL

API NestJS. El frontend aún no forma parte de este repositorio.

## Entorno local (obligatorio)

El desarrollo local se hace en **Linux Mint** con la pila **nativa**. No Docker, no Compose, no contenedores para correr o probar el backend en la máquina del desarrollador.

- OS: Linux Mint (nativo)
- Runtime: Node.js 24 instalado en el host (ver `backend/.nvmrc`)
- Gestor: `npm` nativo
- Arranque: `cd backend && npm install && npm run start:dev`
- Variables: copiar `backend/.env.example` → `backend/.env`

No añadir `docker-compose.yml` ni sugerir `docker build` / `docker run` para desarrollo. Docker existe solo para el deploy en Railway.

## Producción (Railway)

- Root Directory del servicio: `backend`
- Build: `backend/Dockerfile` (multi-stage)
- Healthcheck: `GET /health`
- La app escucha `process.env.PORT` en `0.0.0.0` (`src/main.ts`)
- Secretos y `PORT` los inyecta Railway; no van en la imagen

## Estructura

```
backend/src/
  main.ts                 bootstrap (PORT + 0.0.0.0)
  app.module.ts
  common/                 constantes, decorators, dto, exceptions,
                          filters, guards, interceptors, pipes, utils
  config/                 configuración de la app
  modules/                un módulo Nest por dominio
    health/               liveness para Railway
```

Nuevos endpoints: módulo en `src/modules/<dominio>/` (controller + service + module) e importarlo en `AppModule`.

## Comandos

| Acción | Comando (desde `backend/`) |
|--------|----------------------------|
| Instalar | `npm install` |
| Dev | `npm run start:dev` |
| Build | `npm run build` |
| Prod local (nativo) | `npm run build && npm run start:prod` |

No hay frontend en este repo todavía. No crear `frontend/` ni apps extra a menos que se pida.
