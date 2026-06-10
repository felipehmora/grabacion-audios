# Esquema de datos del backend — diseño inicial

> Documento de diseño, no implementación. Acompaña al pivote del proyecto hacia
> "Cuatro Venezolano: formación musical interactiva" (ver Notion → 🗺️ Plan de
> Evolución, sección "Actualización de rumbo"). Es el primer paso de la
> secuencia acordada (esquema de datos → Vite/React piloto → Unidad 1 del
> currículo), porque el resto del producto se modela en función de estas
> tablas.

## Principio de diseño: separar contenido de progreso

Hay dos tipos de datos con necesidades muy distintas, y mezclarlos sería el
error más común al diseñar esto:

- **Currículo (lecciones, ejercicios, contenido pedagógico)**: estático,
  versionado en código — el mismo patrón de catálogo extensible que
  `tuner/tunings.js` ya usa para las afinaciones (`instrumento → variantes →
  cuerdas`). Vive en un módulo (p. ej. `curriculum.js`) con la forma
  `unidad → lecciones → ejercicios`, y se referencia por `id` estable. **No
  entra a esta base de datos.**
- **Progreso del usuario (lo que el usuario hizo)**: dinámico, propio de cada
  persona, y es **el activo central del producto**. Esto sí va en la base de
  datos relacional, y referencia el currículo solo por `id` (sin duplicar
  contenido).

Esta separación permite agregar/editar lecciones por código (sin migraciones
de base de datos) y mantiene el esquema relacional pequeño y estable incluso
si el currículo crece mucho.

## Tablas (Postgres + Drizzle ORM)

Orden de prioridad de implementación: `users` → `lesson_progress` →
`user_stats` → `recordings` (esta última condicionada a si el grabador
persiste como funcionalidad del nuevo producto).

```ts
import { pgTable, uuid, varchar, timestamp, integer, boolean, unique } from 'drizzle-orm/pg-core';

// Identidad — sin esto no existe "progreso del usuario" que sincronizar
// entre dispositivos (requisito no negociable de una experiencia
// "estilo Duolingo").
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  // Hash de la contraseña (bcrypt) — la app emite y valida sus propios JWT
  // (Passport-JWT en NestJS) en lugar de delegar la autenticación a un
  // proveedor externo, así que la credencial vive en esta tabla.
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Progreso por lección. `lessonId` referencia el `id` estable del catálogo
// estático de currículo (curriculum.js) — nunca el contenido en sí.
export const lessonProgress = pgTable('lesson_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonId: varchar('lesson_id', { length: 100 }).notNull(),
  completed: boolean('completed').notNull().default(false),
  bestScore: integer('best_score'),
  attempts: integer('attempts').notNull().default(0),
  lastAttemptAt: timestamp('last_attempt_at'),
}, (table) => ({
  // Un usuario tiene a lo sumo un registro de progreso por lección —
  // los reintentos actualizan la fila, no crean nuevas.
  userLessonUnique: unique().on(table.userId, table.lessonId),
}));

// Estadísticas agregadas — una fila por usuario. Lo que alimenta la
// gamificación (rachas, XP, nivel).
export const userStats = pgTable('user_stats', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  streakCurrent: integer('streak_current').notNull().default(0),
  streakLongest: integer('streak_longest').notNull().default(0),
  lastPracticeDate: timestamp('last_practice_date'),
  totalXp: integer('total_xp').notNull().default(0),
});

// Opcional — solo si el grabador persiste como herramienta de práctica
// dentro del nuevo producto ("graba tu sesión y revísala"). El archivo de
// audio en sí vive en almacenamiento de objetos (R2); esta tabla solo
// guarda el puntero y los metadatos.
export const recordings = pgTable('recordings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  objectKey: varchar('object_key', { length: 255 }).notNull(),
  durationSeconds: integer('duration_seconds'),
  transcript: varchar('transcript', { length: 10000 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

## Decisiones y su razonamiento

- **`lessonId` es `varchar`, no una FK a una tabla de lecciones**: el currículo
  vive en código (catálogo estático), no en la base de datos — no hay tabla
  `lessons` que referenciar. Esto es deliberado: mantiene el esquema estable
  mientras el contenido pedagógico crece o se reordena. Si en el futuro el
  currículo se vuelve editable sin desplegar (backend como fuente de verdad de
  contenido), recién ahí se justifica una tabla `lessons` real y convertir esta
  columna en FK.
- **`unique(userId, lessonId)` en `lesson_progress`**: refleja que el progreso
  es por lección, acumulativo (mejor puntaje, conteo de intentos), no un log de
  cada intento. Si más adelante se quiere historial detallado de intentos, eso
  sería una tabla aparte (`lesson_attempts`) — no hace falta diseñarla ahora,
  no bloquea nada del MVP.
- **`user_stats` separada de `users`**: separa identidad (estable, rara vez
  cambia) de estadísticas (cambian en cada sesión de práctica) — evita
  reescribir la fila de usuario constantemente y deja espacio para que stats
  evolucione (nuevas métricas de gamificación) sin tocar la tabla de identidad.
- **`recordings` guarda solo el puntero (`objectKey`), no el archivo**: los
  binarios de audio van a almacenamiento de objetos (Cloudflare R2, como ya se
  había explorado en el roadmap de Notion); la base relacional solo resuelve
  "qué archivo es de quién" y metadatos consultables.
- **IndexedDB no desaparece**: este esquema es la *fuente de verdad* centralizada
  (necesaria para sincronizar progreso entre dispositivos). IndexedDB puede
  seguir existiendo como caché local / soporte de modo offline, replicando un
  subconjunto de `lesson_progress`/`user_stats` — pero ya no es donde vive el
  dato canónico.

## Lo que queda fuera de este diseño (a propósito)

- **Detalle de la implementación de autenticación** (estrategia de Passport,
  emisión/rotación de JWT, *refresh tokens*): la decisión de *enfoque* ya está
  tomada (JWT propio vía `@nestjs/passport` + `passport-jwt`, ver "Stack de
  referencia"), pero su implementación específica es trabajo del propio issue
  de backend — no condiciona la forma de estas tablas más allá de la columna
  `passwordHash` ya incorporada en `users`.
- **Modelo de currículo en base de datos**: ver nota sobre `lessonId` arriba —
  se pospone hasta que haya una razón real (contenido editable sin deploy).
- **Tabla de acordes/ejercicios polifónicos**: la Unidad 3 del currículo
  ("Tus primeros acordes") tiene un riesgo técnico abierto (MPM es
  monofónico) que debe resolverse antes de modelar datos para ella.

## Stack de referencia

**NestJS** (API, por familiaridad del equipo) + **Drizzle ORM** (inyectado
como *provider* — Nest no impone un ORM) + **PostgreSQL**, desplegado en
Railway — `railway.json` ya existe en el repo (hoy configurado para servir el
frontend estático; su `startCommand` deberá ajustarse para levantar la app de
Nest). Autenticación con **JWT propio**: `@nestjs/passport` + estrategia
`passport-jwt`, contraseñas con `bcrypt` (de ahí la columna `passwordHash` en
`users`) — el patrón estándar y documentado de autenticación en NestJS, no una
alternativa forzada. Cloudflare R2 para almacenamiento de objetos si
`recordings` se implementa.
