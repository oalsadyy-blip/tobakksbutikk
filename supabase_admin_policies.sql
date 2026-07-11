alter table public.products add column if not exists sku text;
alter table public.categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select to anon, authenticated using (active = true);

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories for select to anon, authenticated using (true);

drop policy if exists "Admin can manage products" on public.products;
create policy "Admin can manage products" on public.products for all to authenticated
using ((auth.jwt() ->> 'email') = 'PUT_YOUR_ADMIN_EMAIL_HERE')
with check ((auth.jwt() ->> 'email') = 'PUT_YOUR_ADMIN_EMAIL_HERE');

drop policy if exists "Admin can manage categories" on public.categories;
create policy "Admin can manage categories" on public.categories for all to authenticated
using ((auth.jwt() ->> 'email') = 'PUT_YOUR_ADMIN_EMAIL_HERE')
with check ((auth.jwt() ->> 'email') = 'PUT_YOUR_ADMIN_EMAIL_HERE');
