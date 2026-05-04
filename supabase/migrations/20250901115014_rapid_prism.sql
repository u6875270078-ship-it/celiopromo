create extension if not exists pgcrypto;

create type role_type as enum ('owner','manager','warehouse','support','accountant');

create table if not exists user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role role_type not null,
  created_at timestamptz default now()
);

create or replace function has_role(r role_type)
returns boolean language sql stable as $$
  select exists(
    select 1 from user_roles
    where user_id = auth.uid() and role = r
  );
$$;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  vat_rate numeric(5,2) default 20.00,
  price numeric(12,2) not null,
  cost  numeric(12,2),
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  attrs jsonb default '{}'::jsonb,
  barcode text,
  unique(product_id, barcode)
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null
);

create table if not exists inventory_levels (
  variant_id uuid references product_variants(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  on_hand integer not null default 0,
  reserved integer not null default 0,
  updated_at timestamptz default now(),
  primary key (variant_id, location_id),
  check (on_hand >= 0),
  check (reserved >= 0)
);

create or replace function enforce_available_non_negative()
returns trigger language plpgsql as $$
begin
  if (new.on_hand - new.reserved) < 0 then
    raise exception 'Insufficient available stock (on_hand - reserved < 0)';
  end if;
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_inv_nonneg on inventory_levels;
create trigger trg_inv_nonneg
before insert or update on inventory_levels
for each row execute procedure enforce_available_non_negative();

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  status text not null default 'created',
  currency text not null default 'EUR',
  customer jsonb,
  totals jsonb,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  qty integer not null check (qty > 0),
  unit_price numeric(12,2) not null,
  vat_rate numeric(5,2) default 20.00
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text
);

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id),
  status text not null default 'draft',
  created_at timestamptz default now()
);

create table if not exists po_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_orders(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  qty integer not null check (qty > 0),
  cost numeric(12,2)
);

create table if not exists returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  reason text,
  disposition text default 'resellable',
  created_at timestamptz default now()
);

create table if not exists webhook_events (
  id text primary key,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz default now()
);

alter table user_roles enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table locations enable row level security;
alter table inventory_levels enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table suppliers enable row level security;
alter table purchase_orders enable row level security;
alter table po_items enable row level security;
alter table returns enable row level security;
alter table webhook_events enable row level security;

create policy sel_all_products on products for select using (auth.role() = 'authenticated');
create policy sel_all_variants on product_variants for select using (auth.role() = 'authenticated');
create policy sel_all_locations on locations for select using (auth.role() = 'authenticated');
create policy sel_all_inventory on inventory_levels for select using (auth.role() = 'authenticated');
create policy sel_all_orders on orders for select using (auth.role() = 'authenticated');
create policy sel_all_order_items on order_items for select using (auth.role() = 'authenticated');

create policy write_products_owner_mgr on products
for all using (has_role('owner') or has_role('manager')) with check (true);

create policy write_inventory_mgr_wh on inventory_levels
for all using (has_role('owner') or has_role('manager') or has_role('warehouse'))
with check (true);

create policy write_orders_support_mgr on orders
for all using (has_role('owner') or has_role('manager') or has_role('support'))
with check (true);

create policy write_order_items_support_mgr on order_items
for all using (has_role('owner') or has_role('manager') or has_role('support'))
with check (true);

create policy write_suppliers_mgr on suppliers
for all using (has_role('owner') or has_role('manager')) with check (true);

create policy write_pos_mgr on purchase_orders
for all using (has_role('owner') or has_role('manager')) with check (true);

create policy write_po_items_mgr on po_items
for all using (has_role('owner') or has_role('manager')) with check (true);