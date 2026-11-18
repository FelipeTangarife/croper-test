# Feature #3 - Autenticación con JWT

## Objetivo
Como administrador quiero iniciar sesión con mi correo y contraseña, y que solo alguien con sesión pueda ver o modificar los productos.

## Problema
Hoy cualquiera que tenga la URL puede entrar a la tabla y crear o borrar productos. Necesito que el sistema sepa quién soy antes de dejarme hacer algo.

## Criterios de aceptación
- Entro con mi correo y contraseña. Si alguno está mal veo "Credenciales inválidas", sin que me diga cuál de los dos falló.
- Si intento entrar a productos sin sesión me manda al login. Si ya tengo sesión y voy al login me manda a productos.
- Si recargo la página sigo con la sesión hasta que el token venza.
- Cuando el token vence me saca al login con el mensaje "Tu sesión expiró, vuelve a ingresar".
- Veo mi nombre arriba y un botón para cerrar sesión.
- Desde Swagger puedo hacer login, pegar el token y probar los endpoints protegidos.

## Alcance

### Backend
**Endpoints**

`POST /auth/login` → 200 | 400 | 401
```json
{ "email": "admin@test.com", "password": "********" }
```
Respuesta:
```json
{ "accessToken": "eyJ...", "expiresIn": 3600,
  "user": { "id": "...", "email": "admin@test.com", "name": "Admin" } }
```

Todos los endpoints de `/products` pasan a requerir token de autenticación y responden 401 sin token o con uno inválido o vencido.

**JWT**
- Firmado con `JWT_SECRET` y con vencimiento según `JWT_EXPIRES_IN`. En el payload solo van `sub` (id del usuario) y `email`.
- Guarda global con `APP_GUARD`. Solo el login continua público.
- Si el email no existe responde el mismo 401 que con la contraseña mala.
- Swagger con `addBearerAuth` y `@ApiBearerAuth` en el controller de productos.

### Frontend
- Página de login con React Hook Form y Zod.
- Persistir el token en el store de Zustand, el usuario y la fecha de vencimiento, más la acción `logout`.
- Interceptar con axios cada petición para agregar el token. Si recibe 401, hace logout y manda al login con el mensaje de sesión expirada.
- Proteger rutas de productos.
- Header con el nombre del usuario y el botón de cerrar sesión.

## Tareas

### Backend
- [] `T3.1` Tests del `AuthService` primero: login correcto devuelve el token, contraseña mala y email inexistente dan el mismo 401.
- [] `T3.2` Implementa el login hasta que pasen los tests. Después protege todos los endpoints con un guard global y deja público solo el login.

- [] `T3.3` Bearer auth en Swagger. Prueba ahí: sin token da 401 y con token funciona.
### Frontend
- [] `T3.4` Guarda la sesión en Zustand y haz que cada petición lleve el token. Si la API responde 401, cierra la sesión y manda al login. La página de productos solo se ve con sesión.
- [] `T3.5` Arma la página de login y el header con el nombre del usuario y el botón para cerrar sesión.

### Cierre
- [] `T3.6` `pnpm build`, `pnpm lint` y `pnpm test` pasan en los dos proyectos. Flujo completo: login, recargar, token vencido y logout.

### Discusión: usar Passport o no?
Al planear la tarea con Claude salió la pregunta de si usar Passport (`@nestjs/passport` + `passport-jwt`). Decidí no usarlo.

Passport sirve cuando hay varias formas de autenticarse (correo y contraseña, Google, GitHub, etc.), porque las unifica bajo una misma interfaz. Aquí solo hay una: login con correo y contraseña que devuelve un JWT. Para eso basta un guard propio que lea el header `Authorization` y valide el token.

Si en el futuro se agregara login con Google u otro proveedor, ahí sí valdría la pena migrar a Passport.

### Revisión del resultado
Después de que Claude implementó la tarea, revisé el código y probé a mano todo el flujo de autenticación:

- Login con credenciales correctas, y con correo o contraseña incorrectos (mismo mensaje en los dos casos).
- Acceso a productos sin sesión, y al login con sesión activa.
- Recargar la página con la sesión iniciada.
- Vencimiento del token, bajando `JWT_EXPIRES_IN` a 1 minuto.
- Cerrar sesión.
- Endpoints protegidos desde Swagger, con y sin token.

Todo funcionó como se esperaba. Lo único que encontré fue una mejora visual: la transición al entrar y al cerrar sesión era muy brusca, así que le pedí a Claude una animación más suave entre el login y la tabla. Después volví a probar el flujo para confirmar que nada se rompió.