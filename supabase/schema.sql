-- ============================================================
-- LonjaYa · esquema de base de datos para Supabase
-- Pégalo entero en Supabase > SQL Editor > New query > Run
-- ============================================================

create table if not exists app_storage (
  id         bigserial primary key,
  key        text not null,
  value      text not null,
  shared     boolean not null default false,
  user_id    text,                         -- null cuando shared = true
  updated_at timestamptz not null default now()
);

-- Un mismo (key, shared, user_id) no puede repetirse: así el "upsert"
-- del adaptador storage.js siempre actualiza en vez de duplicar filas.
create unique index if not exists app_storage_unique_key
  on app_storage (key, shared, coalesce(user_id, ''));

-- Mantener updated_at al día en cada escritura
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_app_storage_updated_at on app_storage;
create trigger trg_app_storage_updated_at
  before update on app_storage
  for each row execute procedure set_updated_at();

-- ------------------------------------------------------------
-- Seguridad (RLS)
-- ------------------------------------------------------------
-- IMPORTANTE: como la app todavía no tiene autenticación real
-- (el login de comprador/vendedor/admin es solo una demo), esta
-- política deja leer y escribir a cualquiera con la clave "anon".
-- Es equivalente al nivel de seguridad que ya tenía el prototipo
-- en Claude.ai, pero NO es apta para un lanzamiento real: antes
-- de tener usuarios de verdad hay que:
--   1) Añadir Supabase Auth (email/contraseña o magic link)
--   2) Cambiar estas políticas para que solo el propio vendedor
--      pueda escribir sus productos, y solo el admin pueda
--      aprobar vendedores o cambiar comisiones.
alter table app_storage enable row level security;

drop policy if exists "public read/write (prototipo)" on app_storage;
create policy "public read/write (prototipo)"
  on app_storage
  for all
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- Nota sobre los datos iniciales
-- ------------------------------------------------------------
-- No hace falta insertar nada más aquí: la propia app siembra los
-- productos y vendedores de ejemplo (PRODUCT_SEED / VENDOR_SEED)
-- la primera vez que alguien la abre y no encuentra datos guardados.
