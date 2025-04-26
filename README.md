# CitySense - Smart Urban Monitoring

CitySense is a web application designed for real-time monitoring and visualization of urban environmental and infrastructural issues using IoT sensors and AI.

## Key Features

- **Interactive Map:** Displays real-time data layers for various urban issues.
- **Data Layers:**
  - Air Pollution (AQI Heatmap)
  - Potholes (Route Hazard Intensity)
  - Garbage/Trash (Route Hazard Intensity)
  - Flooding (Route Hazard Intensity)
- **Real-time Updates:** Subscribes to a Supabase backend for live data updates.
- **Hazard-Aware Routing:** (Partially Implemented) Calculates routes considering hazard density.
- **Turn-by-Turn Navigation:** (Partially Implemented) Provides navigation instructions.
- **PWA Enabled:** Installable on desktop and mobile devices.
- **Responsive Design:** Built with Shadcn UI and Tailwind CSS.

## Technology Stack

- **Frontend:** React, TypeScript, Vite
- **UI:** Shadcn UI, Tailwind CSS, Lucide Icons
- **Mapping:** Mapbox GL JS
- **Backend & Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase Realtime Subscriptions
- **(Conceptual - for data collection):** ESP32, TensorFlow/YOLOv8 (for detection), MQTT
- **State Management:** React Hooks (useState, useEffect, useRef, useCallback)
- **Data Fetching:** TanStack Query (React Query), Fetch API
- **Routing:** React Router DOM
- **PWA:** vite-plugin-pwa

## Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd Frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install or pnpm install
    ```
3.  **Set up Supabase:**

    - Create a Supabase project at [supabase.com](https://supabase.com).
    - In your Supabase project SQL editor, create the `heatmap_data` table using the following schema:

      ```sql
      CREATE TABLE public.heatmap_data (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          raw_entry_id TEXT, -- Optional: Link to raw sensor reading ID
          coordinates GEOMETRY(Point, 4326), -- Stores longitude (x) and latitude (y)
          air_quality INTEGER, -- e.g., AQI value
          pothole_density INTEGER, -- e.g., Score 0-100
          hygiene_level INTEGER, -- e.g., Score 0-100 (lower might mean more garbage)
          water_logging_level INTEGER, -- e.g., Score 0-100 or depth in cm
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL
      );

      -- Enable Row Level Security (Recommended)
      ALTER TABLE public.heatmap_data ENABLE ROW LEVEL SECURITY;

      -- Create policies (Example: Allow public read access)
      CREATE POLICY "Allow public read access" ON public.heatmap_data
      FOR SELECT
      USING (true);

      -- Optional: Index on coordinates for performance
      CREATE INDEX idx_heatmap_data_coordinates ON public.heatmap_data USING GIST (coordinates);

      -- Optional: Index on timestamp
      CREATE INDEX idx_heatmap_data_created_at ON public.heatmap_data (created_at DESC);

      -- Enable real-time updates on the table
      -- (You might need to do this via the Supabase Dashboard UI under Database > Replication)
      -- Or use SQL:
      -- ALTER PUBLICATION supabase_realtime ADD TABLE public.heatmap_data;
      ```

    - Ensure you have enabled the PostGIS extension in your Supabase project (usually enabled by default).

4.  **Configure Environment Variables:**
    - Create a file named `.env.local` in the root of the `Frontend` directory.
    - Add your Supabase URL and Anon Key:
      ```dotenv
      VITE_SUPABASE_URL=your_supabase_project_url
      VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
      ```
    - You can find these keys in your Supabase project settings (API section).
5.  **Add PWA Icons:**
    - Make sure the following icon files exist in the `/public` directory:
      - `favicon.ico`
      - `192.png` (192x192)
      - `512.png` (512x512)
      - `180.png` (180x180 - for Apple touch icon)

## Running the Project

- **Development:**

  ```bash
  npm run dev
  ```

  This will start the Vite development server, typically at `http://localhost:8080`.

- **Production Build:**

  ```bash
  npm run build
  ```

  This creates an optimized production build in the `dist/` directory.

- **Preview Production Build:**
  ```bash
  npm run preview
  # Or serve the dist directory using a static server like `serve`:
  # npm install -g serve
  # serve -s dist
  ```

## Environment Variables

- `VITE_SUPABASE_URL`: The URL of your Supabase project.
- `VITE_SUPABASE_ANON_KEY`: The public anonymous key for your Supabase project.

These should be placed in a `.env.local` file at the project root.

## PWA Functionality

This application is configured as a Progressive Web App (PWA). You can test its features (manifest, service worker, installability) using browser developer tools (like Lighthouse in Chrome/Edge) after creating and serving a production build (`npm run build` then `npm run preview` or `serve -s dist`).
