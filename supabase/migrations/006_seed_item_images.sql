-- ---------------------------------------------------------------------------
-- 006_seed_item_images.sql
-- Mock food photography (Unsplash CDN) so every menu item, category, party
-- pack and catering package has an image for presentation.
--
-- Re-runnable / safe:
--   * Category hero images are (re)seeded directly.
--   * Menu items, party packs and catering packages are only filled where
--     image_url is still NULL, so any real image an admin uploads later is
--     never overwritten by this seed.
-- Host images.unsplash.com is already whitelisted in next.config.ts.
-- ---------------------------------------------------------------------------

-- 1) Category hero images -----------------------------------------------------
update categories set image_url = v.url
from (values
  ('burgers',        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=70'),
  ('double-burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=70'),
  ('chicken',        'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=1000&q=70'),
  ('shawarma',       'https://images.unsplash.com/photo-1719282431565-3b30bb7d2658?auto=format&fit=crop&w=1000&q=70'),
  ('sandwiches',     'https://images.unsplash.com/photo-1719282431565-3b30bb7d2658?auto=format&fit=crop&w=1000&q=70'),
  ('hotdogs',        'https://images.unsplash.com/photo-1638368593249-7cadb261e8b3?auto=format&fit=crop&w=1000&q=70'),
  ('smallchops',     'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=70'),
  ('combos',         'https://images.unsplash.com/photo-1606066889831-35faf6fa6ff6?auto=format&fit=crop&w=1000&q=70'),
  ('platters',       'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=1000&q=70'),
  ('turkey',         'https://images.unsplash.com/photo-1606728035253-49e8a23146de?auto=format&fit=crop&w=1000&q=70'),
  ('soups',          'https://images.unsplash.com/photo-1763048443535-1243379234e2?auto=format&fit=crop&w=1000&q=70'),
  ('rice',           'https://images.unsplash.com/photo-1665332195309-9d75071138f0?auto=format&fit=crop&w=1000&q=70'),
  ('swallow',        'https://images.unsplash.com/photo-1705088293214-7494366cce01?auto=format&fit=crop&w=1000&q=70'),
  ('sides',          'https://images.unsplash.com/photo-1762884601729-0eeeafbdfb8a?auto=format&fit=crop&w=1000&q=70'),
  ('drinks',         'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1000&q=70'),
  ('desserts',       'https://images.unsplash.com/photo-1773533276932-4ee7ea1d6361?auto=format&fit=crop&w=1000&q=70')
) as v(slug, url)
where categories.slug = v.slug;

-- 2) Propagate each item's category image (only where still unset) -----------
update menu_items m
set image_url = c.image_url
from categories c
where m.category_id = c.id
  and m.image_url is null
  and c.image_url is not null;

-- 3) Party packs --------------------------------------------------------------
update party_packs
set image_url = 'https://images.unsplash.com/photo-1606066889831-35faf6fa6ff6?auto=format&fit=crop&w=1000&q=70'
where image_url is null;

-- 4) Catering packages --------------------------------------------------------
update catering_packages
set image_url = 'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=1000&q=70'
where image_url is null;
