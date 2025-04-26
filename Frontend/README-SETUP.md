# Map Integration with Supabase

This application connects to Supabase to fetch real-time heatmap data for the interactive city map.

## Setup Instructions

1. Create a `.env.local` file in the root of your project with the following content:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Replace the placeholders with your actual Supabase credentials:

   - `your_supabase_url`: Your Supabase project URL (e.g., https://abcdefghijklm.supabase.co)
   - `your_supabase_anon_key`: Your Supabase anon/public key

3. Restart your development server for the changes to take effect.

## Supabase Table Schema

The application expects a table called `heatmap_data` with the following schema:

```sql
create table public.heatmap_data (
  id uuid not null default gen_random_uuid (),
  raw_entry_id uuid not null,
  coordinates point not null,
  air_quality numeric not null,
  pothole_density numeric not null,
  hygiene_level numeric not null,
  water_logging_level numeric not null,
  pothole_data jsonb null,
  created_at timestamp with time zone null default now(),
  constraint heatmap_data_pkey primary key (id),
  constraint heatmap_data_raw_entry_fkey foreign KEY (raw_entry_id) references raw_table (id) on delete CASCADE,
  constraint heatmap_data_air_quality_check check ((air_quality >= (0)::numeric)),
  constraint heatmap_data_hygiene_level_check check (
    (
      (hygiene_level >= (0)::numeric)
      and (hygiene_level <= (100)::numeric)
    )
  ),
  constraint heatmap_data_pothole_density_check check (
    (
      (pothole_density >= (0)::numeric)
      and (pothole_density <= (100)::numeric)
    )
  ),
  constraint heatmap_data_water_logging_level_check check (
    (
      (water_logging_level >= (0)::numeric)
      and (water_logging_level <= (100)::numeric)
    )
  )
) TABLESPACE pg_default;

create index IF not exists heatmap_data_coordinates_idx on public.heatmap_data using gist (coordinates) TABLESPACE pg_default;
create index IF not exists heatmap_data_created_at_idx on public.heatmap_data using btree (created_at) TABLESPACE pg_default;
```

## Features

- Real-time data updates using Supabase subscriptions
- Map visualization for various urban issues
- Data-driven heatmap for air pollution
- Linear hazard markers for potholes, hygiene issues, and flooding
- Automatic user location detection and centering
