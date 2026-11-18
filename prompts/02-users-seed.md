# Feature #2 - Usuarios y seeder de admin

## Objetivo
Como administrador quiero tener una cuenta creada desde que se instala el proyecto, para poder entrar al sistema sin que exista un registro público.

## Problema
Para entrar al sistema necesito una cuenta, pero no quiero que cualquiera pueda registrarse: quien tenga sesión puede crear, editar y borrar todos los productos. Por eso la cuenta de admin se crea una sola vez al instalar el proyecto, sin pasar por la web.

## colección de Usuario DB:
| Campo | Tipo | Detalle |
|---|---|---|
| `id` | ObjectId | identificador auto generado |
| `email` | string | Único, se guarda en minúsculas. |
| `password` | string | Hash con bcrypt, nunca en texto plano. No sale en ninguna respuesta. |
| `name` | string | Nombre para mostrar, de 2 a 100 caracteres. |
| `createdAt` | Date | Fecha de creación, automática. |
| `updatedAt` | Date | Fecha de última actualización, automática. |

## Criterios de aceptación
- Al correr `pnpm seed` se crea el admin con el correo y el nombre del `.env`.
- Si en el `.env` hay contraseña, usa esa. Si no hay, genera una aleatoria y me la muestra una sola vez en la consola.
- Si lo corro otra vez no se duplica ni le cambia la contraseña. Me avisa que ya existía.
- Si falta el correo o la contraseña del `.env` tiene menos de 8 caracteres, el script falla con un mensaje claro y no crea nada.
- En la base la contraseña nunca queda legible. Tampoco aparece en logs, salvo el único aviso de la contraseña generada.

## Alcance

### Backend
**Sin endpoints.** El módulo `users` solo lo usa auth por dentro.

**UsersService**
- `findByEmail(email)`: busca sin importar mayúsculas y trae el password, porque auth lo necesita para comparar. En cualquier otra consulta el password no viene (`select: false` en el schema).
- `create({ email, name, password })`: hashea la contraseña antes de guardar.

**Seeder**
- La lógica va en una función `seedAdmin` separada del script, que recibe el `UsersService` y la config. Así se puede testear sin Mongo.
- `src/seed/seed.ts` solo levanta un contexto de Nest sin servidor HTTP (`NestFactory.createApplicationContext`), llama a `seedAdmin` y cierra el contexto, tanto si sale bien como si falla, para que el proceso no se quede colgado.
- Variables nuevas en `.env.example`: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME` y `SEED_ADMIN_PASSWORD` (opcional), con valores de demo para que quien revise pueda entrar rápido.
- La contraseña generada sale de `crypto.randomBytes`, no de `Math.random`.

**Validaciones**
- Email con formato válido.
- Contraseña mínimo 8 caracteres.
- Email repetido → no se crea, solo se avisa.

## Tareas

### Backend
- [] `T2.1` Schema de usuario con `select: false` en el password y que el `toJSON` lo quite siempre.
- [] `T2.2` `UsersService` con tests primero:
  - `create` no guarda la contraseña en texto plano, y `bcrypt.compare` con la original da `true`.
  - El email se guarda en minúsculas.
  - `findByEmail` encuentra el usuario aunque lo busque con mayúsculas y trae el password.
- [] `T2.3` `seedAdmin` con tests primero, con el service mockeado:
  - Crea el admin si no existe.
  - Si ya existe no llama a `create`.
  - Sin contraseña en la config, genera una de al menos 16 caracteres.
  - Falla si falta el correo o si la contraseña tiene menos de 8 caracteres.
- [] `T2.4` Script `seed.ts` y el comando `pnpm seed` en `package.json`.

### Cierre
- [] `T2.5` Corre `pnpm seed` dos veces: la primera crea el admin y la segunda avisa que ya existe. `pnpm lint` y `pnpm test` pasan.