insert into categories (name, slug) values
  ('Men''s Kurta', 'mens-kurta'), ('Women''s Lawn', 'womens-lawn'), ('Shalwar Kameez', 'shalwar-kameez'), ('Waistcoats', 'waistcoats'),
  ('Kids Wear', 'kids-wear'), ('Abayas & Hijabs', 'abayas-hijabs'), ('Formal & Bridal', 'formal-bridal'), ('Winter Shawls', 'winter-shawls')
on conflict do nothing;
