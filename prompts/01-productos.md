# Feature #1 - CRUD de productos

## Objetivo
Como administrador quiero ver todos los productos en una tabla, buscarlos y poder crear, editar o eliminar cualquiera, para mantener el inventario al día sin tocar la base de datos.

## Problema
Hoy no hay dónde gestionar los productos. El catálogo puede crecer a cientos de productos, entonces necesito verlos por páginas y encontrar uno rápido por nombre o por código. Si me equivoco al crear uno quiero poder corregirlo, y antes de borrar algo quiero que me pregunten, porque no se puede deshacer.

## colección de Producto DB:
| Campo | Tipo | Detalle |
|---|---|---|
| `id` | ObjectId | identificador auto generado |
| `sku` | string | Código único entre productos, en mayúsculas. No se puede modificar. |
| `name` | string | Nombre, de 3 a 100 caracteres. |
| `description` | string? | Opcional, máximo 1000 caracteres. |
| `price` | number | Precio en COP, entero y sin decimales. |
| `stock` | number | Cantidad disponible, entero y nunca negativo. |
| `category` | string | Categoría, de 2 a 50 caracteres. |
| `details.brand` | string? | Marca. |
| `details.weight` | number? | Peso, mayor a 0. |
| `details.unit` | enum? | `kg`, `g`, `l`, `ml` o `unidad`. |
| `details.specs` | `{ key, value }[]`? | Especificaciones , máximo 20. |
| `isActive` | boolean | Borrado lógico de un producto. |
| `createdAt` | Date | Fecha de creación, automática. |
| `updatedAt` | Date | Fecha de última actualización, automática. |

## Criterios de aceptación
- Veo la lista paginada de 10 en 10, con el total de productos y en qué página voy.
- Puedo buscar por nombre o SKU, sin importar mayúsculas, y la búsqueda arranca sola cuando dejo de escribir.
- Si recargo la página debo seguir en la misma página y con la misma búsqueda.
- Puedo crear un producto desde un formulario. Si el SKU ya existe me lo dice en el campo del SKU.
- Puedo editar un producto, pero el SKU aparece bloqueado.
- Antes de eliminar me pide confirmación. Si borro el último producto de una página, me lleva a la anterior y no me deja en una página vacía.
- Cuando algo sale bien o mal me aparece un mensaje claro, nunca un error técnico.
- Mientras carga veo un skeleton. Si no hay productos veo un botón para crear el primero. Si falla la carga veo un botón para reintentar.
- En el celular la tabla se convierte en tarjetas.
- Los precios se ven con formato de pesos, por ejemplo $25.000.

## Alcance

### Backend
**Endpoints**
 
`GET /products?page=1&limit=10&search=cafe&sortBy=price&order=asc` → 200
```json
{ "data": [ { "id": "...", "sku": "CAF-001", "name": "Café 500g", "price": 25000, ... } ],
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 } }
```
 
`GET /products/:id` → 200 | 404
 
`POST /products` → 201 | 400 | 409
```json
{
  "sku": "CAF-001",
  "name": "Café 500g",
  "description": "Café de origen, tostión media",
  "price": 25000,
  "stock": 120,
  "category": "Café",
  "details": {
    "brand": "Finca Felipe",
    "weight": 500,
    "unit": "g",
    "specs": [{ "key": "Origen", "value": "Huila" }]
  }
}
```
 
`PATCH /products/:id` → 200 | 400 | 404 (cualquier campo menos `sku`)
```json
{ "price": 27000, "stock": 80 }
```
 
`DELETE /products/:id` → 204 | 404
 
**Validaciones**
- Las de la tabla de arriba, más: `sku` con formato `^[A-Z0-9-]{3,20}$`.
- Query: `page` ≥ 1, `limit` entre 1 y 100, `search` máximo 50, `sortBy` solo `name`, `price` o `createdAt`. Por defecto, los más nuevos primero.
- Id que no sea ObjectId válido → 400.
- SKU repetido → 409 "Ya existe un producto con ese SKU".
- Campos que no estén en el DTO → 400.
Todo documentado en Swagger.
 
### Frontend
- Una página de productos con tabla en escritorio y tarjetas en móvil, buscador y paginación.
- Un solo modal para crear y editar, y un diálogo para confirmar el borrado.
- La llamada HTTP, los hooks de TanStack Query y los componentes van separados.
- Guardar el estado del listado con zustand.
- El formulario valida con Zod las mismas reglas del back.

## Tareas

### Backend
- [] `T1.1` Schema y DTOs con sus validaciones.
- [] `T1.2` Tests del service primero,
- [] `T1.3` Service y controller hasta que pasen los tests.
- [] `T1.5` Revisa en Swagger que estén los cinco endpoints con sus ejemplos y prueba cada uno desde ahí.
- [] `T1.6` Generar seeder con 50 productos, debe crearlos una única vez si se vuelve a correr el seeder.

### Frontend
- [] `T1.6` Types, api y hooks.
- [] `T1.7` Listado: tabla y tarjetas, búsqueda, paginación en la URL y los estados de carga, vacío y error.
- [] `T1.8` Crear y editar con el modal, y eliminar con confirmación.

### Cierre
- [] `T1.9` `pnpm build`, `pnpm lint` y `pnpm test` pasan en los dos proyectos, y el flujo completo funciona


### Revisión del resultado
Después de que Claude implementó la tarea, revisé el código y probé la interfaz y cada acción a mano. Encontré tres mejoras que faltaban:

- Ordenar la tabla al hacer clic en las columnas de nombre y precio. El back ya lo soportaba con `sortBy` y `order`, pero el front no lo usaba.
- Elegir cuántos productos se ven por página. Estaba fijo en 5.
- Corregir UI en pantallas chicas cuando se edita un producto, Los campos de "especificaciones" se cortaban al estar agrupados.

Le pedí a Claude que corrigiera los puntos y volví a probar el flujo completo para confirmar que funcionaban.