import { defineConfig, type PluginOption } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"
import { componentTagger } from "lovable-tagger"
import { VitePWA } from "vite-plugin-pwa"

// Define PWA manifest options
const manifestForPlugin = {
  registerType: "prompt" as const,
  includeAssets: ["favicon.ico", "180.png", "512.png"], // Ensure these exist in /public
  manifest: {
    name: "CitySense",
    short_name: "citysense",
    description: "Real-time urban issue mapping and navigation.",
    icons: [
      {
        src: "/192.png", // Common size
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/512.png", // Larger size
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/180.png", // Apple touch icon
        sizes: "180x180",
        type: "image/png",
        purpose: "apple-touch-icon",
      },
      {
        src: "/512.png", // Maskable icon source (can be same as large icon)
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable", // Important for Android adaptive icons
      },
    ],
    theme_color: "#1E3A8A", // Dark blue
    background_color: "#F8F9FA", // Light grey
    display: "standalone" as const,
    scope: "/",
    start_url: "/",
    orientation: "portrait" as const,
  },
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Define plugins array dynamically
  const plugins: PluginOption[] = [
    react(),
    VitePWA(manifestForPlugin), // Add VitePWA plugin
  ]

  // Conditionally add development plugins
  if (mode === "development") {
    plugins.push(componentTagger())
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins, // Use the constructed array
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
