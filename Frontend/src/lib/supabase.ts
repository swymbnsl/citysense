import { createClient } from "@supabase/supabase-js"

// Replace with your Supabase URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables."
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type HeatmapDataType = {
  id: string
  raw_entry_id: string
  coordinates: { x: number; y: number } // point type in PostgreSQL maps to {x, y} in JS
  air_quality: number
  pothole_density: number
  hygiene_level: number
  water_logging_level: number
  pothole_data?: any
  created_at: string
}
