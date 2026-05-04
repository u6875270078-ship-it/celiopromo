-- إنشاء مستخدم/دور وموقع وسلع تجريبية

-- يُدخل owner اعتمادًا على بريدك (بدون الحاجة لـ auth.uid())
insert into user_roles (user_id, role)
select u.id, 'owner'
from auth.users u
where u.email ilike 'u6875270078@gmail.com'
limit 1
on conflict (user_id) do update set role = excluded.role;

-- تأكيد
select u.email, r.role
from user_roles r
join auth.users u on u.id = r.user_id
where r.role = 'owner';

-- إنشاء موقع المخزن الافتراضي
insert into locations (code, name) 
values ('PARIS_WH','Paris Warehouse') 
on conflict (code) do update set name = excluded.name
returning id;

-- بعد الحصول على id من الاستعلام أعلاه، ضع قيمته في DEFAULT_LOCATION_ID داخل .env.local

-- منتجات تجريبية
insert into products (sku, name, price, cost) values
('JEAN-BAGGY-001', 'Jean Baggy Classique', 79.90, 35.00),
('TSHIRT-ESS-001', 'T-shirt Essentiel', 24.90, 12.00),
('CHINO-BAGGY-001', 'Chino Baggy', 69.90, 30.00)
on conflict (sku) do update set 
  name = excluded.name,
  price = excluded.price,
  cost = excluded.cost;

-- متغيرات المنتجات (الأحجام والألوان)
insert into product_variants (product_id, attrs, barcode)
select p.id, jsonb_build_object('size', size_val, 'color', color_val), 
       p.sku || '-' || size_val || '-' || color_val
from products p
cross join (values ('S'), ('M'), ('L'), ('XL')) as sizes(size_val)
cross join (values ('Black'), ('Blue'), ('White')) as colors(color_val)
where p.sku in ('JEAN-BAGGY-001', 'TSHIRT-ESS-001', 'CHINO-BAGGY-001')
on conflict (product_id, barcode) do nothing;

-- مخزون ابتدائي (سيتم تشغيله بعد إنشاء الموقع)
-- uncomment after setting DEFAULT_LOCATION_ID
/*
insert into inventory_levels (variant_id, location_id, on_hand, reserved)
select 
  pv.id,
  '<DEFAULT_LOCATION_ID>'::uuid,
  (random() * 50 + 10)::int, -- مخزون عشوائي بين 10-60
  0
from product_variants pv
join products p on p.id = pv.product_id
where p.sku in ('JEAN-BAGGY-001', 'TSHIRT-ESS-001', 'CHINO-BAGGY-001')
on conflict (variant_id, location_id) do update set
  on_hand = excluded.on_hand;
*/

-- مورد تجريبي
insert into suppliers (name, email, phone) values
('Fournisseur Textile Paris', 'contact@textile-paris.fr', '+33 1 23 45 67 89')
on conflict do nothing;