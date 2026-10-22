-- 007_seed_dashes_gone.sql
-- Removes typographic dashes (em-dash — and en-dash –) from seeded, user-facing
-- text so the copy doesn't read as AI-generated. Spaced em-dashes become a comma,
-- en-dashes inside numeric ranges become " to ". Idempotent and re-run safe.

-- categories
update categories set
  name        = replace(replace(replace(name, ' — ', ', '), '—', ','), '–', ' to '),
  description = replace(replace(replace(description, ' — ', ', '), '—', ','), '–', ' to ');

-- menu_items
update menu_items set
  name        = replace(replace(replace(name, ' — ', ', '), '—', ','), '–', ' to '),
  description = replace(replace(replace(description, ' — ', ', '), '—', ','), '–', ' to ');

-- party_packs
update party_packs set
  name        = replace(replace(replace(name, ' — ', ', '), '—', ','), '–', ' to '),
  description = replace(replace(replace(description, ' — ', ', '), '—', ','), '–', ' to ');

-- catering_packages
update catering_packages set
  name        = replace(replace(replace(name, ' — ', ', '), '—', ','), '–', ' to '),
  tier        = replace(replace(replace(tier, ' — ', ', '), '—', ','), '–', ' to '),
  description = replace(replace(replace(description, ' — ', ', '), '—', ','), '–', ' to ');

-- site_settings (opening_hours is jsonb, ticker_messages is text[])
update site_settings set
  opening_hours = replace(opening_hours::text, '–', ' to ')::jsonb,
  tagline       = replace(replace(replace(tagline, ' — ', ', '), '—', ','), '–', ' to '),
  ticker_messages = (
    select array_agg(
      replace(replace(replace(m, ' — ', ', '), '—', ','), '–', ' to ')
      order by ord
    )
    from unnest(ticker_messages) with ordinality as u(m, ord)
  );
