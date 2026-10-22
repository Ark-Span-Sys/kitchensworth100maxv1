-- ============================================================================
-- 005_seed.sql — Kitchen's Worth seed data
-- Abuja active, 6 zones, 15 categories, ~60 items, 4 bulk tiers, 3 party
-- packs, 3 catering packages, 3 payment providers, default site settings.
-- Idempotent: safe to re-run (uses upserts where possible).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Cities
-- ---------------------------------------------------------------------------
insert into cities (slug, name, state, is_active, sort_order) values
  ('abuja',          'Abuja',          'FCT',      true,  1),
  ('lagos',          'Lagos',          'Lagos',    false, 2),
  ('port-harcourt',  'Port Harcourt',  'Rivers',   false, 3),
  ('ibadan',         'Ibadan',         'Oyo',      false, 4)
on conflict (slug) do update set name = excluded.name, state = excluded.state;

-- ---------------------------------------------------------------------------
-- Abuja zones
-- ---------------------------------------------------------------------------
with abuja as (select id from cities where slug = 'abuja')
insert into zones (city_id, name, area_label, eta_minutes, fee_ngn)
select abuja.id, v.name, v.area_label, v.eta, v.fee from abuja, (values
  ('Wuse & Maitama',      'Central Abuja',                40, 2500),
  ('Garki & Asokoro',     'Central Abuja',                40, 2500),
  ('Wuse 2 & Garki 2',    'Central Abuja',                40, 2500),
  ('Jabi & Life Camp',    'District 11, Katanga, Central', 50, 3000),
  ('Lokoma & Utako',      'North-west Abuja',             50, 3000),
  ('Kubwa & Gwarinpa',    'Outer suburbs',                65, 4000)
) as v(name, area_label, eta, fee)
on conflict (city_id, name) do update
  set area_label = excluded.area_label,
      eta_minutes = excluded.eta_minutes,
      fee_ngn = excluded.fee_ngn;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
insert into categories (slug, name, description, sort_order) values
  ('burgers',      'Burgers',                'Signature beef, chicken and bacon burgers.', 1),
  ('double-burgers','Double Patty Burgers',  'Stacked, juicy and seriously loaded.', 2),
  ('chicken',      'Chicken & Chips',        'Grilled or crispy, nobody does chicken like us.', 3),
  ('shawarma',     'Shawarma',               'Loaded wraps with beef, chicken or turkey.', 4),
  ('sandwiches',   'Sandwiches',             'Beef and turkey stuffed sandwiches.', 5),
  ('hotdogs',      'Hotdogs',                'Loaded and stuffed beef hotdogs.', 6),
  ('smallchops',   'Small Chops & Puff Puff','Crowd-pleasers for every gathering.', 7),
  ('combos',       'Foodies Combos',         'Burgers, sandwiches, puffs and chicken in one big box.', 8),
  ('platters',     'Platters',               'Built to feed the whole crew.', 9),
  ('turkey',       'Grilled Turkey',         'Full packs, half packs and singles.', 10),
  ('soups',        'Soups',                  'Slow-cooked Nigerian classics.', 11),
  ('rice',         'Rice & Mains',           'Jollof, fried, native and more.', 12),
  ('swallow',      'Swallow',                'Pounded yam, eba, amala, fufu.', 13),
  ('sides',        'Sides & Snacks',         'Plantain, moi-moi, gizdodo and more.', 14),
  ('drinks',       'Drinks & Cocktails',     'Zobo, ginger lemonade, Chapman, smoothies.', 15),
  ('desserts',     'Desserts & Bakes',       'Cupcakes, waffles, celebration cakes.', 16)
on conflict (slug) do update set name = excluded.name, description = excluded.description;

-- ---------------------------------------------------------------------------
-- Menu items — grouped per category
-- ---------------------------------------------------------------------------

-- Burgers
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn, is_best_seller) values
  ((select id from categories where slug='burgers'), 'crispy-chicken-burger-fries', 'Crispy Chicken Burger & Fries', 'Golden crispy chicken fillet with fresh fries.', array['Chicken','Fries'], 13000, true),
  ((select id from categories where slug='burgers'), 'grilled-chicken-burger-fries', 'Grilled Chicken Burger & Fries', 'Grilled chicken patty with 50g fries.', array['Chicken','Fries'], 14800, false),
  ((select id from categories where slug='burgers'), 'bacon-beast-burger-fries', 'Bacon Beast Burger & Fries', 'Beef patty, slice of bacon, 50g fries.', array['Beef','Bacon','Fries'], 14300, true),
  ((select id from categories where slug='burgers'), 'beezie-beef-burger-fries', 'Beezie Beef Burger & Fries', 'Beef patty with 50g fries.', array['Beef','Fries'], 13800, true)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Double burgers
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn, is_best_seller) values
  ((select id from categories where slug='double-burgers'), 'double-bacon-beast', 'Double Bacon Beast Hamburger', '2 beef patties, bacon slices, 2 cheese, 50g fries.', array['Beef','Bacon','Cheese','Fries'], 16800, true),
  ((select id from categories where slug='double-burgers'), 'double-beef-hamburger', 'Double Beef Hamburger', '2 beef patties, 2 cheese, 50g fries.', array['Beef','Cheese','Fries'], 13300, false),
  ((select id from categories where slug='double-burgers'), 'double-grilled-chicken', 'Double Grilled Chicken Hamburger', '2 chicken patties, 2 cheese, 50g fries.', array['Chicken','Cheese','Fries'], 15400, false),
  ((select id from categories where slug='double-burgers'), 'double-crispy-chicken', 'Double Crispy Chicken Hamburger', '2 crispy chicken patties, 2 cheese, 50g fries.', array['Chicken','Cheese','Fries'], 17500, false)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Chicken & chips
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn, is_best_seller) values
  ((select id from categories where slug='chicken'), 'grilled-drumsticks-fries-5', 'Grilled Chicken Drumsticks & Fries (5pcs)', '5 drumsticks, 200g fries, ketchup.', array['Chicken','Fries','Ketchup'], 23400, true),
  ((select id from categories where slug='chicken'), 'crispy-drumsticks-fries-5', 'Crispy Chicken Drumstick & Fries (5pcs)', '5 crispy fried drumsticks, 200g fries, ketchup.', array['Chicken','Fries','Ketchup'], 25300, false),
  ((select id from categories where slug='chicken'), 'grilled-wings-fries-6', 'Grilled Chicken Wings & Fries (6pcs)', '6 grilled wings, 200g fries, ketchup.', array['Chicken','Fries','Ketchup'], 16200, true),
  ((select id from categories where slug='chicken'), 'crispy-wings-fries-6', 'Crispy Chicken Wings & Fries (6pcs)', '6 crispy wings, 200g fries, ketchup.', array['Chicken','Fries','Ketchup'], 18800, false),
  ((select id from categories where slug='chicken'), 'full-pack-grilled-wings-12', 'Full Pack Grilled Chicken Wings (12pc)', '12 grilled wings.', array['Chicken'], 20400, false),
  ((select id from categories where slug='chicken'), 'full-pack-crispy-wings-12', 'Full Pack Crispy Wings (12pc)', '12 crispy fried chicken.', array['Chicken'], 28700, false),
  ((select id from categories where slug='chicken'), 'full-pack-grilled-drumsticks-10', 'Full Pack Grilled Drumsticks (10pc)', '10 grilled drumsticks.', array['Chicken'], 31200, false),
  ((select id from categories where slug='chicken'), 'full-pack-crispy-drumsticks-10', 'Full Pack Crispy Drumsticks (10pcs)', '10 crispy fried drumsticks.', array['Chicken'], 36400, false),
  ((select id from categories where slug='chicken'), 'full-pack-fries', 'Full Pack of Fries', '300g crispy fries with ketchup.', array['Fries','Ketchup'], 5900, false)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Shawarma
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn) values
  ((select id from categories where slug='shawarma'), 'beef-wrap-shawarma', 'Beef Wrap Shawarma (2 Sausages)', 'Loaded beef shawarma with 2 sausages.', array['Beef','Sausage','Veggies'], 13900),
  ((select id from categories where slug='shawarma'), 'chicken-wrap-shawarma', 'Chicken Wrap Shawarma (2 Sausages)', 'Loaded chicken shawarma with 2 sausages.', array['Chicken','Sausage','Veggies'], 13900),
  ((select id from categories where slug='shawarma'), 'turkey-wrap-shawarma', 'Turkey Wrap Shawarma (2 Sausages)', 'Loaded turkey shawarma with 2 sausages.', array['Turkey','Sausage','Veggies'], 14600)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Sandwiches
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn, is_best_seller) values
  ((select id from categories where slug='sandwiches'), '1940s-stuffed-beef-sandwich', '1940s Stuffed Beef Sandwich', 'Our signature stuffed beef sandwich.', array['Beef','Cheese','Veggies'], 10400, true),
  ((select id from categories where slug='sandwiches'), 'turkey-sandwich-2-packs', 'Turkey Sandwich (2 packs)', '2 packs of turkey sandwiches.', array['Turkey'], 19800, true),
  ((select id from categories where slug='sandwiches'), 'rhol-turkey-sliders', 'RHOL Turkey Sliders', '15 cuts turkey sliders.', array['Turkey'], 42400, true)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Hotdogs
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn, is_best_seller) values
  ((select id from categories where slug='hotdogs'), 'loaded-beef-hotdog', 'Loaded Beef Hotdog', 'Chopped beef, 1 turkey sausage, cheese, vegetables.', array['Beef','Sausage','Cheese'], 16600, false),
  ((select id from categories where slug='hotdogs'), 'stuffed-beef-hotdog', 'Stuffed Beef Hotdog', 'Minced meat, 1 turkey sausage, cheese, vegetables.', array['Beef','Sausage','Cheese'], 17500, true),
  ((select id from categories where slug='hotdogs'), 'rhol-hotdog-combo', 'RHOL Hotdog Combo', '2 large hotdogs (stuffed beef, loaded beef), 200g fries.', array['Hotdog','Fries'], 29500, false)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Small chops
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn, is_best_seller) values
  ((select id from categories where slug='smallchops'), 'mini-smallchops', 'Mini Smallchops (Chicken or Turkey)', '4 samosa, 4 spring rolls, 15 puff puff, 3 drumsticks or 1 large turkey, pepper sauce.', array['Samosa','Spring roll','Puff puff','Chicken'], 25200, true),
  ((select id from categories where slug='smallchops'), 'puff-puff-turkey-mini', 'Puff Puff & Turkey (Mini)', '50 puff puff, 2 mini turkey or 1 large turkey.', array['Puff puff','Turkey'], 24500, false),
  ((select id from categories where slug='smallchops'), 'puff-puff-turkey-large', 'Puff Puff & Turkey (Large)', '50 puff puff, 2 large turkey or 4 mini turkey.', array['Puff puff','Turkey'], 36500, false),
  ((select id from categories where slug='smallchops'), 'full-pack-puff-puff', 'Full Pack of Puff Puff', '50 pieces.', array['Puff puff'], 11000, false),
  ((select id from categories where slug='smallchops'), 'half-pack-puff-puff', 'Half Pack of Puff Puff', '25 pieces.', array['Puff puff'], 5300, false),
  ((select id from categories where slug='smallchops'), 'samosa', 'Samosa', '16 beef samosas, spicy with bell peppers and shredded carrots.', array['Beef','Pastry'], 20400, true)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Combos
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn, is_best_seller) values
  ((select id from categories where slug='combos'), 'large-foodies-box-turkey', 'Large Foodies Box (Turkey)', '3 burgers, 6 sandwich, 15 puffs, 3 large or 5 mini turkey, 200g fries, 1 large drink.', array['Burger','Sandwich','Puff puff','Turkey','Fries','Drink'], 76600, true),
  ((select id from categories where slug='combos'), 'large-foodies-box-wings', 'Large Foodies Box (Wings)', '3 burgers, 6 sandwich, 15 puffs, 12 grilled wings, 200g fries, 1 large drink.', array['Burger','Sandwich','Wings','Fries','Drink'], 64500, false),
  ((select id from categories where slug='combos'), 'large-foodies-box-drumsticks', 'Large Foodies Box (Drumsticks)', '3 burgers, 6 sandwich, 15 puffs, 10 grilled drumsticks, 200g fries, 1 large drink.', array['Burger','Sandwich','Drumstick','Fries','Drink'], 74300, false),
  ((select id from categories where slug='combos'), 'mini-foodies-box-wings', 'Mini Foodies Box (Wings)', '1 burger, 2 cut sandwich, 10 puffs, 6 wings, 100g fries, drink.', array['Burger','Sandwich','Wings','Fries','Drink'], 36100, false),
  ((select id from categories where slug='combos'), 'mini-foodies-box-turkey', 'Mini Foodies Box (Turkey)', '1 burger, 2 cut sandwich, 10 puffs, turkey, 100g fries, drink.', array['Burger','Sandwich','Turkey','Fries','Drink'], 39500, false),
  ((select id from categories where slug='combos'), 'hamburger-combo-box', 'Hamburger Combo Box', '1 beef, 1 chicken & 1 bacon burger, 200g fries, free drink.', array['Burger','Fries','Drink'], 31300, false),
  ((select id from categories where slug='combos'), 'rhol-multi-combo-large', 'RHOL Multi Combo (Large), Feeds 8', '2 cut beef shawarma, 2 cut chicken shawarma, 4 mini burgers, 2 beef hotdogs, 20 turkey sliders, 200g fries.', array['Shawarma','Burger','Hotdog','Sliders','Fries'], 74400, true),
  ((select id from categories where slug='combos'), 'rhol-multi-mini-combo', 'RHOL Multi Mini Combo (Twin Box)', 'Each box: 1 hotdog, turkey sliders, 1/2 cut wrap, fries, 1 mini burger.', array['Hotdog','Sliders','Wrap','Fries','Burger'], 41900, true)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Platters
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn, is_best_seller) values
  ((select id from categories where slug='platters'), 'chops-platter-wings', 'Chops Platter (Feeds 10), Wings', '30 spring rolls, 30 samosas, 60 puff puff, 12 wings.', array['Spring roll','Samosa','Puff puff','Wings'], 44500, true),
  ((select id from categories where slug='platters'), 'chops-platter-drumsticks', 'Chops Platter (Feeds 10), Drumsticks', '30 spring rolls, 30 samosas, 60 puff puff, 10 drumsticks.', array['Spring roll','Samosa','Puff puff','Drumstick'], 56500, false),
  ((select id from categories where slug='platters'), 'chops-platter-wings-5', 'Chops Platter (Feeds 5), Wings', '15 spring rolls, 15 samosas, 30 puff puff, 6 wings.', array['Spring roll','Samosa','Puff puff','Wings'], 37500, false),
  ((select id from categories where slug='platters'), 'hotdog-platter', 'Hotdog Platter', '4 mini loaded beef, 4 mini stuffed beef.', array['Hotdog'], 41600, false)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Turkey
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn) values
  ((select id from categories where slug='turkey'), 'full-pack-mini-turkey-wings', 'Full Pack of Grilled Mini Turkey Wings', '12 grilled/BBQ turkey.', array['Turkey'], 70900),
  ((select id from categories where slug='turkey'), 'half-pack-mini-turkey-wings', '1/2 Pack of Grilled Mini Turkey Wings', '6 grilled/BBQ turkey.', array['Turkey'], 37000),
  ((select id from categories where slug='turkey'), 'full-pack-large-turkey-wings', 'Full Pack of Grilled Large Turkey Wings', '10 large grilled/BBQ turkey.', array['Turkey'], 75700),
  ((select id from categories where slug='turkey'), 'half-pack-large-turkey-wings', '1/2 Pack of Grilled Large Turkey Wings', '5 large grilled/BBQ turkey.', array['Turkey'], 43400),
  ((select id from categories where slug='turkey'), 'single-large-turkey', 'Single Large Turkey', '1 grilled/BBQ turkey.', array['Turkey'], 8700),
  ((select id from categories where slug='turkey'), 'single-mini-turkey', 'Single Mini Turkey', '1 grilled/BBQ mini turkey.', array['Turkey'], 6000)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Soups
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn, is_spicy, is_signature) values
  ((select id from categories where slug='soups'), 'bitterleaf-soup', 'Bitterleaf Soup', 'Slow-cooked bitterleaf with assorted meats, stockfish and dry fish.', array['Bitterleaf','Assorted meat','Stockfish'], 15000, false, true),
  ((select id from categories where slug='soups'), 'egusi-soup', 'Egusi Soup', 'Classic ground melon-seed soup with leafy greens.', array['Egusi','Spinach'], 14000, false, false),
  ((select id from categories where slug='soups'), 'okra-soup', 'Okra Soup', 'Silky okra soup with assorted protein.', array['Okra','Assorted meat'], 14000, false, true),
  ((select id from categories where slug='soups'), 'oha-soup', 'Oha Soup', 'Traditional Igbo oha soup, rich and aromatic, cooked with stockfish, dry fish and assorted meat.', array['Oha','Stockfish'], 14500, false, false),
  ((select id from categories where slug='soups'), 'waterleaf-soup', 'Waterleaf Soup', 'Melt-in-your-mouth soup made with periwinkle and stockfish.', array['Waterleaf','Periwinkle','Stockfish'], 15500, false, false),
  ((select id from categories where slug='soups'), 'afang-soup', 'Afang Soup', 'Okazi and waterleaf mastery from the South-South.', array['Okazi','Waterleaf'], 15000, false, false),
  ((select id from categories where slug='soups'), 'efo-riro', 'Efo-Riro', 'Rich Yoruba spinach stew with assorted meats.', array['Spinach','Assorted meat'], 13500, false, false),
  ((select id from categories where slug='soups'), 'catfish-pepper-soup', 'Catfish Pepper-Soup', 'Spicy soup made with fresh catfish.', array['Catfish'], 12000, true, false),
  ((select id from categories where slug='soups'), 'assorted-pepper-soup', 'Assorted Pepper-Soup', 'Spicy soup with assorted cow offal.', array['Assorted','Offal'], 12500, true, false),
  ((select id from categories where slug='soups'), 'goatmeat-pepper-soup', 'Goatmeat Pepper-Soup', 'Spicy, flavourful soup made with tender goatmeat.', array['Goat'], 12500, true, false),
  ((select id from categories where slug='soups'), 'fisherman-soup', 'Fisherman Soup', 'A feast of seafood in a spicy light soup.', array['Seafood'], 20000, true, true),
  ((select id from categories where slug='soups'), 'seafood-okra', 'Seafood Okra', 'Okra made with crab, prawn, periwinkles, snails and fish.', array['Okra','Seafood'], 17500, false, true)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Rice & mains
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn, is_best_seller) values
  ((select id from categories where slug='rice'), 'jollof-rice', 'Jollof Rice (only)', 'Delicious smokey jollof rice cooked the traditional way.', array['Rice','Tomato'], 4500, true),
  ((select id from categories where slug='rice'), 'fried-rice', 'Fried Rice (only)', 'Vegetable & protein fried rice, colourful, fragrant and satisfying.', array['Rice','Vegetables'], 4500, true),
  ((select id from categories where slug='rice'), 'white-rice', 'White Rice', 'Rice cooked to soft fluffiness.', array['Rice'], 2500, false),
  ((select id from categories where slug='rice'), 'jollof-pasta', 'Jollof Pasta', 'Made with prawn and cow skin for that moist, mouth-watering satisfaction.', array['Pasta','Prawn','Kpomo'], 6500, true),
  ((select id from categories where slug='rice'), 'native-protein-rice', 'Native Protein Rice', 'Palm-oil cultural native rice with chunks of protein.', array['Rice','Palm oil','Protein'], 9500, false),
  ((select id from categories where slug='rice'), 'porridge-yam', 'Porridge Yam', 'Pottage yam mixed with sweet potato and kpomo, cooked with crayfish. Comes with sauced fish.', array['Yam','Kpomo','Crayfish'], 7000, false),
  ((select id from categories where slug='rice'), 'abacha', 'Abacha', 'Eastern Nigerian delicacy with ugba and utazi, comes with large fish.', array['Abacha','Ugba','Utazi','Fish'], 15000, true),
  ((select id from categories where slug='rice'), 'enjoyment-platter', 'Enjoyment Platter', '1 large grilled fish, fried yam & plantain, sauce, white rice, jambalaya rice.', array['Fish','Yam','Plantain','Rice'], 65000, true)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Swallow
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn) values
  ((select id from categories where slug='swallow'), 'pounded-yam', 'Pounded Yam', 'Soft, stretchy pounded yam.', array['Yam'], 1500),
  ((select id from categories where slug='swallow'), 'garri-eba', 'Garri (Eba)', 'Smooth eba portion to pair with any soup.', array['Garri'], 1200),
  ((select id from categories where slug='swallow'), 'amala', 'Amala', 'Smooth, dark yam-flour swallow.', array['Yam flour'], 1500),
  ((select id from categories where slug='swallow'), 'fufu', 'Fufu', 'Cassava and plantain fufu.', array['Cassava','Plantain'], 1500)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Sides & snacks
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn, is_vegan) values
  ((select id from categories where slug='sides'), 'fried-plantain', 'Fried Plantain', 'Sweet and golden, the perfect side.', array['Plantain'], 1500, true),
  ((select id from categories where slug='sides'), 'gizdodo-large', 'Gizdodo (Large)', 'Diced gizzard and plantain in a rich pepper sauce.', array['Gizzard','Plantain'], 8500, false),
  ((select id from categories where slug='sides'), 'moi-moi', 'Moi-Moi', 'Steamed bean pudding, soft and savoury.', array['Beans','Pepper'], 2000, true),
  ((select id from categories where slug='sides'), 'nkwobi', 'Nkwobi (Serves 1-2)', 'Succulent goat feet cooked till soft and sauced the native way, served with ugba.', array['Goat','Ugba'], 35000, false),
  ((select id from categories where slug='sides'), 'isi-ewu', 'Isi-Ewu (Serves 2-3)', 'Goat head cooked till soft and rolled in its mashed brain. Served with ugba.', array['Goat head','Ugba'], 35000, false),
  ((select id from categories where slug='sides'), 'sauced-hake-fish', 'Sauced Hake Fish', 'Hake fish fried and stir fried in pepper mix sauce.', array['Hake','Pepper'], 6500, false),
  ((select id from categories where slug='sides'), 'peppered-chicken', 'Peppered Chicken', 'Well seasoned chicken cooked till soft and sauced with peppered mix and onions.', array['Chicken','Pepper'], 4000, false),
  ((select id from categories where slug='sides'), 'agege-bread', 'Agege Bread', 'Freshly baked, soft, sweet Agege bread.', array['Flour'], 2500, true),
  ((select id from categories where slug='sides'), 'sardine-bread', 'Sardine Bread', 'Soft bread filled with sardine.', array['Bread','Sardine'], 3500, false),
  ((select id from categories where slug='sides'), 'meat-pies', 'Meat Pies', 'Flaky pastry with seasoned minced beef filling.', array['Pastry','Beef'], 2500, false)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Drinks & cocktails
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn, is_vegan, is_best_seller) values
  ((select id from categories where slug='drinks'), 'zobo', 'The Best Zobo', 'Made with hibiscus flower, ginger, cloves and lots of fruits.', array['Hibiscus','Ginger','Cloves'], 1500, true, true),
  ((select id from categories where slug='drinks'), 'ginger-lemonade', 'The Best Ginger Lemonade', 'Zingy ginger lemonade, freshly made.', array['Ginger','Lemon'], 1500, true, false),
  ((select id from categories where slug='drinks'), ' Chapman', 'Chapman', 'Classic Nigerian cocktail with Fanta, sprite, cucumber and grenadine.', array['Fanta','Sprite','Cucumber'], 2500, true, true),
  ((select id from categories where slug='drinks'), 'smoothie-mango', 'Mango Smoothie', 'Fresh mango blended with yoghurt.', array['Mango','Yoghurt'], 2500, false, false),
  ((select id from categories where slug='drinks'), 'soft-drink', 'Soft Drink (Can)', 'Any 33cl can of your choice.', array['Soda'], 800, true, false),
  ((select id from categories where slug='drinks'), 'bottled-water', 'Bottled Water', '75cl still water.', array['Water'], 500, true, false)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- Desserts
insert into menu_items (category_id, slug, name, description, ingredients, price_ngn) values
  ((select id from categories where slug='desserts'), 'double-chocolate-waffles', 'Double Chocolate Waffles & Drumstick', '6 heart-shaped waffles, 1 crispy drumstick, syrup.', array['Waffle','Chocolate','Chicken'], 12700),
  ((select id from categories where slug='desserts'), 'buttermilk-waffles', 'Double Buttermilk Waffles & Crispy Drumstick', '6 heart-shaped waffles, 1 crispy drumstick, syrup.', array['Waffle','Buttermilk','Chicken'], 15400),
  ((select id from categories where slug='desserts'), 'mini-pancakes', 'Mini Pancakes', 'Fluffy mini pancakes with honey butter.', array['Pancake'], 9800),
  ((select id from categories where slug='desserts'), 'cup-cakes', 'Cup Cakes', 'Pack of 6 cupcakes.', array['Cake'], 8000),
  ((select id from categories where slug='desserts'), 'celebration-cake', 'Celebration Cake (8")', '8-inch celebration cake, customisable.', array['Cake'], 65000)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- ---------------------------------------------------------------------------
-- Menu extras (a couple of examples; admin adds more)
-- ---------------------------------------------------------------------------
insert into menu_extras (item_id, name, price_ngn) values
  ((select id from menu_items where slug='grilled-drumsticks-fries-5'), 'Extra drumstick', 4500),
  ((select id from menu_items where slug='grilled-drumsticks-fries-5'), 'Extra fries (200g)', 2500),
  ((select id from menu_items where slug='grilled-wings-fries-6'), 'Extra wings (2pc)', 5500),
  ((select id from menu_items where slug='crispy-chicken-burger-fries'), 'Add cheese', 1000),
  ((select id from menu_items where slug='crispy-chicken-burger-fries'), 'Add bacon', 2000)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Party packs
-- ---------------------------------------------------------------------------
insert into party_packs (slug, name, serves_min, serves_max, price_ngn, contents, description, sort_order) values
  ('party-pack-drumsticks-or-wings', 'KW Party Pack, Drumsticks or Wings', 1, 1, 8100,
    array['2 samosa','2 spring rolls','1 drumstick or 2 wings','5 puff puff','1 drink','Chilli sauce'],
    'Per-pack pricing for parties, offices and events (pre-order).', 1),
  ('bulk-party-pack-30', 'Bulk Party Pack, Feeds 30', 25, 30, 245000,
    array['30 party packs','Extra drinks','Assorted sauces'],
    'Pre-order 24h ahead. Free delivery within central Abuja.', 2),
  ('bulk-party-pack-100', 'Mega Pack, Feeds 100', 90, 100, 780000,
    array['100 party packs','Chops platter x4','Drinks crate'],
    'Pre-order 48h ahead. Ideal for weddings and corporate events.', 3)
on conflict (slug) do update set name = excluded.name, price_ngn = excluded.price_ngn;

-- ---------------------------------------------------------------------------
-- Bulk tiers (per-line auto-discount)
-- ---------------------------------------------------------------------------
insert into bulk_tiers (min_qty, discount_percent) values
  (6, 10.00),
  (12, 20.00),
  (24, 30.00),
  (50, 46.40)
on conflict (min_qty) do update set discount_percent = excluded.discount_percent;

-- ---------------------------------------------------------------------------
-- Catering packages
-- ---------------------------------------------------------------------------
insert into catering_packages (name, tier, price_ngn, description, sort_order) values
  ('Intimate Gathering',   'Up to 30 guests',   250000, 'Menu planning, buffet setup, and service for small events.', 1),
  ('Standard Event',       '30 to 100 guests',     750000, 'Full catering with staff, chafing dishes, and setup.', 2),
  ('Grand Celebration',    '100 to 500 guests',   3500000, 'Large-scale catering with dedicated team, custom menu, and premium presentation.', 3)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Payment providers (default: manual_bank on, Monnify off until configured)
-- ---------------------------------------------------------------------------
insert into payment_providers (key, label, description, is_enabled, sort_order) values
  ('monnify_card',     'Card (via Monnify)',     'Pay securely with your debit card.', false, 1),
  ('monnify_transfer', 'Bank Transfer (Monnify)','Get a generated account number to transfer to.', false, 2),
  ('manual_bank',      'Direct Bank Transfer',   'Transfer to our bank account and send proof via WhatsApp.', true, 3)
on conflict (key) do update set label = excluded.label, description = excluded.description;

-- ---------------------------------------------------------------------------
-- Site settings (single row, id = 1)
-- ---------------------------------------------------------------------------
insert into site_settings (id, whatsapp_number, ticker_messages, opening_hours, tagline, vat_percent, dock_enabled)
values (
  1,
  '07030606021',
  array[
    '🔥 Order 6+ packs of any menu item and unlock bulk pricing, the more you order, the more you save.',
    '🚚 Delivery within Abuja, expanding across Nigeria.',
    '🎉 Planning a party? Pre-order your platters 12 to 24 hours ahead.'
  ],
  jsonb_build_object(
    'monday',    'Closed',
    'tuesday',   '10:00 to 22:00',
    'wednesday', '10:00 to 22:00',
    'thursday',  '10:00 to 22:00',
    'friday',    '10:00 to 23:00',
    'saturday',  '10:00 to 23:00',
    'sunday',    '14:00 to 22:00'
  ),
  '...eat well & spend less.',
  7.5,
  true
)
on conflict (id) do update set whatsapp_number = excluded.whatsapp_number;
