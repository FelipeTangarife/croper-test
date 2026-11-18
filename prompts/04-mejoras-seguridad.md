# Feature #4 - Seguridad de la API

## Objetivo
Como administrador quiero que mi cuenta y el catálogo estén protegidos contra ataques comunes, aunque alguien conozca la URL de la API.

## Problema
El login es lo más atacado de cualquier sistema: si no tiene límite de intentos, alguien puede probar contraseñas hasta adivinar la mía. Además, si la API acepta peticiones de cualquier sitio, arranca con una configuración incompleta o le faltan cabeceras de seguridad, queda expuesta aunque tenga login.

## Criterios de aceptación
- Si fallo el login muchas veces seguidas me bloquea un rato y me dice "Demasiados intentos, espera un minuto".
- Si alguien hace demasiadas peticiones seguidas a la API, se le bloquea temporalmente.
- Solo el front del proyecto puede consumir la API desde el navegador.
- Si falta una variable importante en el `.env`, la app no arranca y dice cuál falta.
- Mi contraseña y mi token nunca aparecen en los logs.

## Alcance

### Backend
**Rate limit (`@nestjs/throttler`)**
- Límite global de 100 peticiones por minuto por IP.
- En el login, 5 intentos por minuto por IP.
- Al pasarse responde 429 con el formato de error de siempre.

**Lo demás**
- `helmet` para las cabeceras de seguridad. Verifica que Swagger siga cargando, porque la política de seguridad de contenido de helmet a veces bloquea sus scripts.
- CORS solo para el origen de `CORS_ORIGIN`.
- Validación de variables con joi al arrancar: `MONGO_URI`, `JWT_SECRET` (mínimo 32 caracteres), `JWT_EXPIRES_IN`, `PORT` y `CORS_ORIGIN`. Si algo falta o está mal, la app no inicia.
- Ni la contraseña ni el token se escriben en logs.

### Frontend
- Si el back responde 429, se muestra el mensaje de demasiados intentos.

## Tareas

### Backend
- [] `T4.1` Throttler global y el límite especial del login, con un test e2e o una prueba manual que confirme que el sexto intento en un minuto da 429.
- [] `T4.2` helmet y CORS. Revisa que Swagger siga funcionando.
- [] `T4.3` Validación del `.env` con joi.

### Frontend
- [] `T4.4` Manejo del 429 en el interceptor.

### Cierre
- [] `T4.5` `pnpm build`, `pnpm lint` y `pnpm test` pasan. Prueba: seis logins fallidos seguidos muestran el mensaje de bloqueo, una petición desde otro origen es rechazada y la app no arranca sin `JWT_SECRET`.