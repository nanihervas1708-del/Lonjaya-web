# LonjaYa — proyecto web

Marketplace de pescado y marisco. Este proyecto es la versión "de verdad" del
prototipo construido en Claude: mismo diseño y misma lógica, pero ahora
guarda los datos en una base de datos real (Supabase / Postgres) en vez del
almacenamiento interno de Claude.ai, así que puede publicarse en cualquier
hosting.

## 1. Crear el proyecto en Supabase (gratis)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (puedes entrar con GitHub).
2. "New project" → ponle un nombre (p. ej. `lonjaya`) y una contraseña de base de datos (guárdala).
3. Espera 1-2 minutos a que se cree el proyecto.
4. En el menú lateral, ve a **SQL Editor** → **New query**.
5. Abre el archivo [`supabase/schema.sql`](./supabase/schema.sql) de este proyecto, copia todo su contenido, pégalo ahí y pulsa **Run**.
   - Esto crea la única tabla que necesita la app (`app_storage`) y sus permisos.
6. Ve a **Project Settings → API**. Ahí verás:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public key** (una clave larga)
   - Los necesitarás en el siguiente paso.

## 2. Configurar el proyecto en tu ordenador

Necesitas tener instalado [Node.js](https://nodejs.org) (versión 18 o superior).

```bash
# 1. Entra en la carpeta del proyecto
cd lonjaya-web

# 2. Instala las dependencias
npm install

# 3. Copia el archivo de variables de entorno
cp .env.example .env
```

Abre `.env` y rellena con los datos de tu proyecto de Supabase (paso 1.6):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 3. Probarlo en local

```bash
npm run dev
```

Abre el enlace que te muestre la terminal (normalmente `http://localhost:5173`).
La primera vez que cargue, la propia app rellenará Supabase con las lonjas y
productos de ejemplo automáticamente (no hace falta hacer nada más).

## 4. Publicarlo en internet (Vercel)

1. Sube esta carpeta a un repositorio de GitHub (puedes arrastrar los archivos
   directamente en [github.com/new](https://github.com/new), o usar `git`).
2. Ve a [vercel.com](https://vercel.com) → crea cuenta con GitHub → **Add New → Project**.
3. Elige tu repositorio `lonjaya-web`. Vercel detectará que es un proyecto Vite automáticamente.
4. Antes de darle a "Deploy", abre **Environment Variables** y añade las mismas dos que pusiste en `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Dale a **Deploy**. En 1-2 minutos tendrás una URL tipo `lonjaya-web.vercel.app` ya funcionando.

## 5. Conectar tus dominios de Nominalia

Repite esto para `lonjaya.com` y, si quieres, también para `lonjaya.online`
(a `lonjays.es` recuerda revisar si querías decir `lonjaya.es`, porque tal
y como lo escribiste tiene una "s" de más).

1. En Vercel, entra en tu proyecto → **Settings → Domains** → escribe `lonjaya.com` → **Add**.
2. Vercel te mostrará los registros DNS que necesita, normalmente:
   - Un registro **A** apuntando a `76.76.21.21` (para el dominio raíz `lonjaya.com`)
   - Un registro **CNAME** apuntando a `cname.vercel-dns.com` (para `www.lonjaya.com`)
   - *(Usa siempre los valores exactos que te enseñe Vercel en pantalla, pueden cambiar.)*
3. En Nominalia: **Mis dominios → lonjaya.com → Gestión DNS / Zona DNS**.
4. Añade esos mismos registros (borra los que traiga Nominalia por defecto si chocan con los nuevos).
5. Guarda. La propagación tarda entre 30 minutos y 24-48 horas.
6. Repite con `lonjaya.online` si quieres que también funcione, o configura
   una **redirección de dominio** hacia `lonjaya.com` desde el propio panel
   de Nominalia (más simple si no quieres gestionar dos DNS).

## Qué falta antes de un lanzamiento real (importante)

Este proyecto sigue siendo un **prototipo funcional**, no una tienda lista
para producción. Antes de aceptar pedidos y dinero reales de verdad:

- **Pagos**: no hay pasarela de pago. Habría que integrar Stripe o Redsys.
- **Autenticación real**: el login actual es solo un selector de nombre + rol,
  sin contraseña. Hay que añadir Supabase Auth (email/contraseña o magic link)
  y, sobre todo, **restringir las políticas de seguridad** de la tabla
  `app_storage` (ahora mismo cualquiera puede leer y escribir todo, tal y
  como se explica en `supabase/schema.sql`).
- **Envíos y logística real** con transportistas de frío.
- **RGPD / facturación**: aviso legal, política de privacidad y facturación
  fiscal si vas a operar como negocio real en España.

## Estructura del proyecto

```
lonjaya-web/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example          ← copia a .env con tus claves de Supabase
├── supabase/
│   └── schema.sql         ← ejecutar una vez en Supabase
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx             ← toda la app (igual que el prototipo)
    └── lib/
        └── storage.js      ← adaptador que conecta con Supabase
```
