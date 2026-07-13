alter table public.orders
add column if not exists customer_phone text,
add column if not exists shipping_address text,
add column if not exists postal_code text,
add column if not exists city text;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Customers can create orders" on public.orders;
create policy "Customers can create orders"
on public.orders
for insert
to anon, authenticated
with check (
  customer_name is not null
  and customer_email is not null
  and total >= 0
);

drop policy if exists "Customers can create order items" on public.order_items;
create policy "Customers can create order items"
on public.order_items
for insert
to anon, authenticated
with check (
  quantity > 0
  and price >= 0
);

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
on public.orders
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read order items" on public.order_items;
create policy "Admins can read order items"
on public.order_items
for select
to authenticated
using (public.is_admin());
