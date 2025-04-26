import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Thermometer,
  AlertCircle,
  Trash2,
  Droplets,
  Navigation,
  X,
  Search,
  Play,
  CornerUpLeft,
  ArrowUpRight,
  Volume2,
  VolumeX,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import type { HeatmapDataType } from "@/lib/supabase"
import { Input } from "@/components/ui/input"

// Constants, Interfaces, DEMO_DATA, MyLocationControl remain the same
const MAPBOX_TOKEN =
  "pk.eyJ1Ijoic3d5bWJuc2wiLCJhIjoiY205d25rNXlnMTA1czJzc2JrbXZnZ3V5YSJ9.gjLFekhvgDCgAIxmHTwMZA"
const DEFAULT_MAP_CENTER: [number, number] = [77.315672, 28.367188]
const DEMO_DATA: HeatmapDataType[] = [
  {
    id: "demo-1",
    raw_entry_id: "demo-raw-1",
    coordinates: { x: 77.315672, y: 28.367188 },
    air_quality: 175,
    pothole_density: 65,
    hygiene_level: 40,
    water_logging_level: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    raw_entry_id: "demo-raw-2",
    coordinates: { x: 77.315672 - 0.0015, y: 28.367188 - 0.0012 },
    air_quality: 140,
    pothole_density: 78,
    hygiene_level: 40,
    water_logging_level: 25,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    raw_entry_id: "demo-raw-3",
    coordinates: { x: 77.315672 + 0.0018, y: 28.367188 - 0.001 },
    air_quality: 120,
    pothole_density: 50,
    hygiene_level: 30,
    water_logging_level: 45,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-3b",
    raw_entry_id: "demo-raw-3b",
    coordinates: { x: 77.315672 + 0.0022, y: 28.367188 - 0.0007 },
    air_quality: 115,
    pothole_density: 55,
    hygiene_level: 25,
    water_logging_level: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-4",
    raw_entry_id: "demo-raw-4",
    coordinates: { x: 77.315672 - 0.0005, y: 28.367188 + 0.0015 },
    air_quality: 90,
    pothole_density: 35,
    hygiene_level: 70,
    water_logging_level: 20,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-1b",
    raw_entry_id: "demo-raw-1b",
    coordinates: { x: 77.315672 + 0.0005, y: 28.367188 + 0.0011 },
    air_quality: 180,
    pothole_density: 70,
    hygiene_level: 35,
    water_logging_level: 12,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-11",
    raw_entry_id: "demo-raw-11",
    coordinates: { x: 77.317, y: 28.368 },
    air_quality: 100,
    pothole_density: 20,
    hygiene_level: 30,
    water_logging_level: 85,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-11b",
    raw_entry_id: "demo-raw-11b",
    coordinates: { x: 77.3175, y: 28.3683 },
    air_quality: 95,
    pothole_density: 22,
    hygiene_level: 28,
    water_logging_level: 90,
    created_at: new Date().toISOString(),
  },
]
const USE_DEMO_DATA = true

interface DataLayer {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  mapColor: string
  bgColor: string
  hoverColor: string
  borderColor: string
  textColor: string
  active: boolean
}
interface Route {
  id: string
  geometry: any
  distance: number
  duration: number
  potholeRisk: number
  garbageIntensity: number
  floodRisk: number
  isRecommended?: boolean
  recommendReason?: string
}
interface PlaceSuggestion {
  id: string
  place_name: string
  center: [number, number]
}
interface NavigationInstruction {
  text: string
  distance: number
  maneuver: string
  type: string
}
class MyLocationControl implements mapboxgl.IControl {
  private _map?: mapboxgl.Map
  private _container: HTMLDivElement
  private _getUserLocation: () => void
  constructor(getUserLocationFn: () => void) {
    this._container = document.createElement("div")
    this._getUserLocation = getUserLocationFn
  }
  onAdd(map: mapboxgl.Map): HTMLElement {
    this._map = map
    this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group"
    const btn = document.createElement("button")
    btn.type = "button"
    btn.title = "My Location"
    btn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor"/><circle cx="12" cy="12" r="3" fill="#4E9F3D"/></svg>'
    btn.onclick = this._getUserLocation
    this._container.appendChild(btn)
    this._container.style.margin = "0 10px 10px 0"
    return this._container
  }
  onRemove(): void {
    if (this._container.parentNode) {
      this._container.parentNode.removeChild(this._container)
    }
    this._map = undefined
  }
}

const MapSection: React.FC = (): ReactNode => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [heatmapData, setHeatmapData] = useState<HeatmapDataType[]>([])
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  )
  const subscriptionRef = useRef<any>(null)
  const [dataLayers, setDataLayers] = useState<DataLayer[]>([
    {
      id: "air-pollution",
      name: "Air Pollution",
      icon: <Thermometer />,
      color: "citysense-blue",
      mapColor: "#3ABEFF",
      bgColor: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      borderColor: "border-blue-500",
      textColor: "text-blue-500",
      active: true,
    },
    {
      id: "potholes",
      name: "Potholes",
      icon: <AlertCircle />,
      color: "citysense-red",
      mapColor: "#FF6B6B",
      bgColor: "bg-red-500",
      hoverColor: "hover:bg-red-600",
      borderColor: "border-red-500",
      textColor: "text-red-500",
      active: false,
    },
    {
      id: "garbage",
      name: "Garbage/Trash",
      icon: <Trash2 />,
      color: "citysense-green",
      mapColor: "#4E9F3D",
      bgColor: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      borderColor: "border-green-500",
      textColor: "text-green-500",
      active: false,
    },
    {
      id: "flooding",
      name: "Flooding",
      icon: <Droplets />,
      color: "citysense-blue",
      mapColor: "#4285F4",
      bgColor: "bg-cyan-500",
      hoverColor: "hover:bg-cyan-600",
      borderColor: "border-cyan-500",
      textColor: "text-cyan-600",
      active: false,
    },
  ])
  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const [showNavigation, setShowNavigation] = useState(false)
  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [routes, setRoutes] = useState<Route[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [routeSearching, setRouteSearching] = useState(false)
  const fromMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const toMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const routeSourceRef = useRef<string | null>(null)
  const routeLayerRef = useRef<string | null>(null)
  const [fromSuggestions, setFromSuggestions] = useState<PlaceSuggestion[]>([])
  const [toSuggestions, setToSuggestions] = useState<PlaceSuggestion[]>([])
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [showToSuggestions, setShowToSuggestions] = useState(false)
  const [fromTypingTimeout, setFromTypingTimeout] =
    useState<NodeJS.Timeout | null>(null)
  const [toTypingTimeout, setToTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  )
  const [navigationActive, setNavigationActive] = useState(false)
  const [navigationInstructions, setNavigationInstructions] = useState<
    NavigationInstruction[]
  >([])
  const [currentInstruction, setCurrentInstruction] =
    useState<NavigationInstruction | null>(null)
  const [nextInstruction, setNextInstruction] =
    useState<NavigationInstruction | null>(null)
  const [distanceToNextInstruction, setDistanceToNextInstruction] =
    useState<number>(0)
  const [muteInstructions, setMuteInstructions] = useState(false)
  const [userWatchId, setUserWatchId] = useState<number | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [pinMode, setPinMode] = useState<"from" | "to">("from")
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false)
  const [initialLayerApplied, setInitialLayerApplied] = useState(false) // Track if initial layer is done

  // --- Helper: Calculate distance squared for {x, y} objects ---
  const distanceSquared = (
    coords1: { x: number; y: number },
    coords2: { x: number; y: number }
  ): number => {
    const dx = coords1.x - coords2.x
    const dy = coords1.y - coords2.y
    return dx * dx + dy * dy
  }
  // --- Helper: Calculate distance squared for [lng, lat] arrays ---
  const lngLatDistanceSquared = (p1: number[], p2: number[]): number => {
    const dx = p1[0] - p2[0]
    const dy = p1[1] - p2[1]
    const avgLatRad = ((p1[1] + p2[1]) / 2) * (Math.PI / 180)
    const dxCorrected = dx * Math.cos(avgLatRad)
    return dxCorrected * dxCorrected + dy * dy
  }
  // --- Helper: Calculate distance from a point [lng, lat] to a line segment [[lng, lat], [lng, lat]] ---
  const pointToLineSegmentDistance = (
    p: number[],
    a: number[],
    b: number[]
  ): number => {
    const l2 = lngLatDistanceSquared(a, b)
    if (l2 === 0) return lngLatDistanceSquared(p, a) ** 0.5 * 111320
    let t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / l2
    t = Math.max(0, Math.min(1, t))
    const projection = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]
    const distSq = lngLatDistanceSquared(p, projection)
    return Math.sqrt(distSq) * 111320
  }

  // --- Calculate hazard risk along NAV route ---
  const calculateHazardRisk = useCallback(
    (
      routeCoords: number[][],
      hazardType: "pothole_density" | "hygiene_level" | "water_logging_level"
    ): number => {
      if (!heatmapData?.length || !routeCoords?.length) return 0
      const PROXIMITY_THRESHOLD_METERS = 50
      let totalIntensity = 0
      let pointsNearRoute = 0
      heatmapData.forEach((point) => {
        let hazardValue = point[hazardType]
        if (hazardType === "hygiene_level" && hazardValue != null) {
          hazardValue = 100 - hazardValue
        }
        if (hazardValue == null || hazardValue <= 0) return
        const pointCoords = [point.coordinates.x, point.coordinates.y]
        let minDistanceToRoute = Infinity
        for (let i = 0; i < routeCoords.length - 1; i++) {
          minDistanceToRoute = Math.min(
            minDistanceToRoute,
            pointToLineSegmentDistance(
              pointCoords,
              routeCoords[i],
              routeCoords[i + 1]
            )
          )
          if (minDistanceToRoute <= PROXIMITY_THRESHOLD_METERS) break
        }
        if (minDistanceToRoute <= PROXIMITY_THRESHOLD_METERS) {
          totalIntensity += hazardValue
          pointsNearRoute++
        }
      })
      if (pointsNearRoute === 0) return 0
      const averageIntensity = totalIntensity / pointsNearRoute
      return Math.min(100, Math.max(0, Math.round(averageIntensity)))
    },
    [heatmapData]
  ) // Removed pointToLineSegmentDistance dependency

  // --- Find NAV routes ---
  const findRoutes = useCallback(async () => {
    // ... (findRoutes implementation remains the same)
    const fromSet = fromLocation.trim() !== "" || fromMarkerRef.current
    const toSet = toLocation.trim() !== "" || toMarkerRef.current
    if (!map.current || !fromSet || !toSet) {
      toast.error("Please set both From and To locations.")
      return
    }
    setRouteSearching(true)
    toast.loading("Finding routes...", { id: "route-search" })
    clearRouteLines()
    setRoutes([])
    setSelectedRouteId(null)
    try {
      let fromCoords: [number, number] | null = null
      let toCoords: [number, number] | null = null
      if (fromMarkerRef.current)
        fromCoords = fromMarkerRef.current.getLngLat().toArray()
      else fromCoords = await forwardGeocode(fromLocation)
      if (toMarkerRef.current)
        toCoords = toMarkerRef.current.getLngLat().toArray()
      else toCoords = await forwardGeocode(toLocation)
      if (!fromCoords || !toCoords) {
        toast.dismiss("route-search")
        toast.error("Could not find coordinates.")
        setRouteSearching(false)
        return
      }
      const markerHtml = (label: string, color: string) =>
        `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white;"><div style="color: white; font-weight: bold; font-size: 14px;">${label}</div></div>`
      if (!fromMarkerRef.current && map.current) {
        const el = document.createElement("div")
        el.innerHTML = markerHtml("A", "#33A9FF")
        fromMarkerRef.current = new mapboxgl.Marker(el)
          .setLngLat(fromCoords)
          .addTo(map.current)
      }
      if (!toMarkerRef.current && map.current) {
        const el = document.createElement("div")
        el.innerHTML = markerHtml("B", "#FF3366")
        toMarkerRef.current = new mapboxgl.Marker(el)
          .setLngLat(toCoords)
          .addTo(map.current)
      }
      const apiUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromCoords[0]},${fromCoords[1]};${toCoords[0]},${toCoords[1]}?alternatives=true&geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`
      const response = await fetch(apiUrl)
      const data = await response.json()
      if (!data.routes?.length) {
        toast.dismiss("route-search")
        toast.error("No routes found.")
      } else {
        const processedRoutes: Route[] = data.routes.map(
          (route: any, index: number): Route => ({
            id: `route-${index}-${Date.now()}`,
            geometry: route.geometry,
            distance: route.distance,
            duration: route.duration,
            potholeRisk: calculateHazardRisk(
              route.geometry.coordinates,
              "pothole_density"
            ),
            garbageIntensity: calculateHazardRisk(
              route.geometry.coordinates,
              "hygiene_level"
            ),
            floodRisk: calculateHazardRisk(
              route.geometry.coordinates,
              "water_logging_level"
            ),
          })
        )
        const sortedRoutes = [...processedRoutes].sort((a, b) => {
          const score = (r: Route) =>
            (r.floodRisk > 60 ? 10000 : r.floodRisk * 10) +
            (r.potholeRisk > 60 ? 5000 : r.potholeRisk * 5) +
            (r.garbageIntensity > 60 ? 2000 : r.garbageIntensity * 2) +
            r.duration
          return score(a) - score(b)
        })
        const recommendedRoute = sortedRoutes[0]
        let reason = "Balanced route"
        const reasons = []
        if (
          recommendedRoute.floodRisk <=
          Math.min(...processedRoutes.map((r) => r.floodRisk)) + 5
        )
          reasons.push("low flood risk")
        if (
          recommendedRoute.potholeRisk <=
          Math.min(...processedRoutes.map((r) => r.potholeRisk)) + 5
        )
          reasons.push("low pothole risk")
        if (
          recommendedRoute.garbageIntensity <=
          Math.min(...processedRoutes.map((r) => r.garbageIntensity)) + 5
        )
          reasons.push("low garbage risk")
        if (
          recommendedRoute.duration <=
          Math.min(...processedRoutes.map((r) => r.duration)) + 120
        )
          reasons.push("fast")
        if (reasons.length > 0 && reasons.length <= 2) {
          reason = `Good balance (${reasons.join(" & ")})`
        } else if (reasons.length > 2) {
          reason = "Overall best balance"
        } else if (
          recommendedRoute.duration <=
          Math.min(...processedRoutes.map((r) => r.duration)) + 120
        ) {
          reason = "Fastest route"
        }
        const finalRoutes = processedRoutes.map((route) => ({
          ...route,
          isRecommended: route.id === recommendedRoute.id,
          recommendReason:
            route.id === recommendedRoute.id ? reason : undefined,
        }))
        setRoutes(finalRoutes)
        setSelectedRouteId(recommendedRoute.id)
        displayRoute(recommendedRoute)
        toast.dismiss("route-search")
        toast.success(`Found ${finalRoutes.length} routes.`)
        const bounds = finalRoutes[0].geometry.coordinates.reduce(
          (b, coord) => b.extend(coord as mapboxgl.LngLatLike),
          new mapboxgl.LngLatBounds(fromCoords, fromCoords)
        )
        bounds.extend(toCoords)
        map.current?.fitBounds(bounds, {
          padding: { top: 150, bottom: 50, left: 50, right: 50 },
          maxZoom: 15,
        })
      }
    } catch (error) {
      console.error("Error finding routes:", error)
      toast.dismiss("route-search")
      toast.error("Error finding routes.")
    } finally {
      setRouteSearching(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLocation, toLocation, map, calculateHazardRisk])

  // --- Fetch Initial Heatmap Data ---
  const fetchHeatmapData = useCallback(async () => {
    if (heatmapData.length > 0 && USE_DEMO_DATA) return
    try {
      if (USE_DEMO_DATA) {
        setHeatmapData(DEMO_DATA)
        console.log("Demo data set.")
        return
      }
      const { data, error } = await supabase
        .from("heatmap_data")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      if (data) setHeatmapData(data as HeatmapDataType[])
      console.log("Real data fetched.")
    } catch (error) {
      console.error("Error fetching heatmap data:", error)
      toast.error("Failed to load map data")
    }
  }, [heatmapData.length])
  // --- Subscribe to Real-time Updates ---
  const subscribeToHeatmapData = useCallback(() => {
    if (USE_DEMO_DATA || subscriptionRef.current) return
    subscriptionRef.current = supabase
      .channel("heatmap-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "heatmap_data" },
        (payload) => {
          fetchHeatmapData()
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status)
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          toast.error("Real-time connection issue.")
          subscriptionRef.current = null
        }
      })
  }, [fetchHeatmapData])

  // --- AQI Heatmap Layer ---
  const addAQIHeatmap = useCallback(() => {
    if (!map.current || !heatmapData.length) return
    if (!map.current.isStyleLoaded()) {
      map.current.once("style.load", addAQIHeatmap)
      return
    }
    const sourceId = "air-quality-source"
    const heatmapLayerId = "air-quality-heatmap"
    if (map.current.getLayer(heatmapLayerId)) {
      try {
        map.current.removeLayer(heatmapLayerId)
      } catch (e) {}
    }
    if (map.current.getSource(sourceId)) {
      try {
        map.current.removeSource(sourceId)
      } catch (e) {}
    }
    const features = heatmapData
      .filter((p) => p.air_quality != null)
      .map((p) => ({
        type: "Feature" as const,
        properties: { intensity: p.air_quality },
        geometry: {
          type: "Point" as const,
          coordinates: [p.coordinates.x, p.coordinates.y],
        },
      }))
    if (features.length === 0) return
    const geojsonData = { type: "FeatureCollection" as const, features }
    try {
      map.current.addSource(sourceId, { type: "geojson", data: geojsonData })
      map.current.addLayer({
        id: heatmapLayerId,
        type: "heatmap",
        source: sourceId,
        maxzoom: 16,
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "intensity"],
            0,
            0,
            50,
            0.2,
            100,
            0.4,
            150,
            0.6,
            200,
            0.8,
            300,
            1.0,
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            1,
            15,
            3,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.1,
            "rgba(0,255,0,0.25)",
            0.3,
            "rgba(255,255,0,0.5)",
            0.5,
            "rgba(255,126,0,0.7)",
            0.7,
            "rgba(255,0,0,0.8)",
            0.9,
            "rgba(153,0,76,1)",
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            15,
            15,
            35,
          ],
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            0.8,
            16,
            0.6,
          ],
        },
      })
      console.log("AQI Heatmap Added")
    } catch (error) {
      console.error("Error adding air quality layers:", error)
    }
  }, [heatmapData])

  // --- Hazard Route Visualization ---
  // --- Hazard Route Visualization ---
  const addHazardRouteVisualization = useCallback(
    async (
      dataField: "pothole_density" | "hygiene_level" | "water_logging_level"
    ) => {
      if (!map.current || !heatmapData.length) {
        console.warn(
          `Cannot add ${dataField} routes: Map not loaded or no data`
        )
        return
      }
      if (!map.current.isStyleLoaded()) {
        // Wait for style if not loaded
        map.current.once("style.load", () =>
          addHazardRouteVisualization(dataField)
        )
        return
      }

      const sourceId = `${dataField}-route-source`
      const layerId = `${dataField}-route-line`

      // --- Cleanup existing layers/sources ---
      if (map.current.getLayer(layerId)) {
        try {
          map.current.removeLayer(layerId)
        } catch (e) {
          console.warn(`Error removing layer ${layerId}`, e)
        }
      }
      if (map.current.getSource(sourceId)) {
        try {
          map.current.removeSource(sourceId)
        } catch (e) {
          console.warn(`Error removing source ${sourceId}`, e)
        }
      }
      // --- End Cleanup ---

      console.log(`Generating ${dataField} route visualization...`)
      setIsLoadingRoutes(true) // Start loading indicator

      const SIGNIFICANCE_THRESHOLD = 30 // Min intensity to consider
      const MAX_DISTANCE_SQ = 0.0001 // Approx 1km squared (adjust as needed) - uses squared decimal degrees
      const MAX_ROUTES_TO_DRAW = 100 // Limit API calls and visual clutter

      // Filter points that meet the significance threshold
      const significantPoints = heatmapData.filter(
        (p) => p[dataField] != null && p[dataField] >= SIGNIFICANCE_THRESHOLD
      )

      if (significantPoints.length < 2) {
        console.log(`Not enough significant points for ${dataField} routes.`)
        setIsLoadingRoutes(false)
        return
      }

      const routePromises: Promise<any>[] = []
      const processedPairs = new Set<string>() // Avoid A->B and B->A duplicates

      // Find nearby pairs and create route promises
      for (let i = 0; i < significantPoints.length; i++) {
        let nearestNeighbor: HeatmapDataType | null = null
        let minDistanceSq = MAX_DISTANCE_SQ

        // Find the nearest significant neighbor within the max distance
        for (let j = i + 1; j < significantPoints.length; j++) {
          // Only check pairs once
          const p1 = significantPoints[i]
          const p2 = significantPoints[j]
          const distSq = distanceSquared(p1.coordinates, p2.coordinates) // Uses {x,y} distance

          if (distSq < minDistanceSq) {
            minDistanceSq = distSq
            nearestNeighbor = p2
          }
        }

        if (nearestNeighbor) {
          const p1 = significantPoints[i]
          const p2 = nearestNeighbor
          const pairKey = [p1.id, p2.id].sort().join("-") // Unique key for the pair
          if (processedPairs.has(pairKey)) continue // Skip if already processed

          processedPairs.add(pairKey)

          // Calculate average intensity (as risk score 0-100) for the segment
          let intensityP1 = p1[dataField] ?? 0
          let intensityP2 = p2[dataField] ?? 0
          // Handle hygiene inversion for risk calculation (lower score = higher risk)
          if (dataField === "hygiene_level") {
            intensityP1 = 100 - intensityP1
            intensityP2 = 100 - intensityP2
          }
          const avgIntensity = Math.min(
            100,
            Math.max(0, (intensityP1 + intensityP2) / 2)
          )

          // Prepare the API request for this pair
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${p1.coordinates.x},${p1.coordinates.y};${p2.coordinates.x},${p2.coordinates.y}?alternatives=false&geometries=geojson&overview=simplified&access_token=${MAPBOX_TOKEN}`
          routePromises.push(
            fetch(url)
              .then((res) =>
                res.ok ? res.json() : Promise.reject(`API Error ${res.status}`)
              )
              .then((data) => {
                // Return route geometry and calculated intensity if successful
                if (data.routes && data.routes.length > 0) {
                  return {
                    geometry: data.routes[0].geometry,
                    intensity: avgIntensity,
                  }
                }
                return null // No route found between points
              })
              .catch((err) => {
                console.warn(`Route fetch error for ${pairKey}:`, err)
                return null
              }) // Ignore errors for individual routes
          )
        }
        // Limit the total number of routes requested to avoid hitting API limits quickly
        if (processedPairs.size >= MAX_ROUTES_TO_DRAW) break
      }

      console.log(
        `Requesting ${routePromises.length} routes for ${dataField}...`
      )
      const routeResults = await Promise.allSettled(routePromises)

      // Filter out failed requests and null results
      const validRoutes = routeResults
        .filter((result) => result.status === "fulfilled" && result.value)
        .map((result) => (result as PromiseFulfilledResult<any>).value) // Type assertion

      if (validRoutes.length === 0) {
        console.log(`No valid routes found for ${dataField}.`)
        setIsLoadingRoutes(false)
        return
      }

      // Create GeoJSON FeatureCollection from the valid route geometries
      const routeFeatures = validRoutes.map((route) => ({
        type: "Feature" as const,
        properties: { intensity: route.intensity }, // Add intensity to properties
        geometry: route.geometry, // Geometry is already a LineString from Directions API
      }))
      const geojsonData = {
        type: "FeatureCollection" as const,
        features: routeFeatures,
      }

      // --- Define Color Ramps using Opacity ---
      let colorRamp: mapboxgl.Expression
      const MIN_INTENSITY = SIGNIFICANCE_THRESHOLD // Start ramp at the threshold
      const MAX_INTENSITY = 100 // Max possible risk/intensity value

      // Base colors (adjust as needed)
      const POTHHOLE_COLOR_BASE = "rgba(220, 38, 38, 1)" // Red-600
      const GARBAGE_COLOR_BASE = "rgba(22, 163, 74, 1)" // Green-600
      const FLOODING_COLOR_BASE = "rgba(37, 99, 235, 1)" // Blue-600

      // Helper to create opacity ramp expression
      const createOpacityRamp = (
        baseColor: string,
        minIntensity: number,
        maxIntensity: number
      ): mapboxgl.Expression => {
        const rgbaMatch = baseColor.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/
        )
        if (!rgbaMatch) {
          console.warn(`Failed to parse baseColor: ${baseColor}. Falling back.`)
          return ["literal", baseColor] // Return a literal expression
        } // Fallback to base color if regex fails
        const [r, g, b] = [rgbaMatch[1], rgbaMatch[2], rgbaMatch[3]]

        // Interpolate the alpha channel based on intensity
        return [
          "interpolate",
          ["linear"],
          ["get", "intensity"],
          minIntensity,
          `rgba(${r},${g},${b},0.4)`, // Low intensity = lower opacity (40%)
          (minIntensity + maxIntensity) / 1.5,
          `rgba(${r},${g},${b},0.7)`, // Medium intensity (70%)
          maxIntensity,
          `rgba(${r},${g},${b},0.9)`, // High intensity = higher opacity (90%)
        ]
      }

      // Assign the correct ramp based on the hazard type
      if (dataField === "pothole_density") {
        colorRamp = createOpacityRamp(
          POTHHOLE_COLOR_BASE,
          MIN_INTENSITY,
          MAX_INTENSITY
        )
      } else if (dataField === "hygiene_level") {
        // Intensity is already risk (100-score)
        colorRamp = createOpacityRamp(
          GARBAGE_COLOR_BASE,
          MIN_INTENSITY,
          MAX_INTENSITY
        )
      } else {
        // flooding
        colorRamp = createOpacityRamp(
          FLOODING_COLOR_BASE,
          MIN_INTENSITY,
          MAX_INTENSITY
        )
      }

      // Define line width ramp based on intensity
      const lineWidthRamp: mapboxgl.Expression = [
        "interpolate",
        ["linear"],
        ["get", "intensity"],
        MIN_INTENSITY,
        3, // Thinner for lower intensity
        MAX_INTENSITY,
        6, // Thicker for higher intensity
      ]
      // --- End Color Ramp Definitions ---

      try {
        if (!map.current) {
          // Check map still exists after async operations
          setIsLoadingRoutes(false)
          return
        }
        // Add the source with all route features
        map.current.addSource(sourceId, { type: "geojson", data: geojsonData })

        // Add the line layer styled by intensity
        map.current.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": colorRamp, // Use the opacity-based color ramp
            "line-width": lineWidthRamp, // Use the width ramp
            "line-opacity": 1, // Set base opacity to 1 (controlled by color alpha)
          },
        })
        console.log(
          `Successfully added ${validRoutes.length} ${dataField} route segments.`
        )
      } catch (error) {
        console.error(`Error adding ${dataField} route layer:`, error)
      } finally {
        setIsLoadingRoutes(false) // Stop loading indicator regardless of success/error
      }
    },
    [heatmapData]
  ) // Dependency remains heatmapData

  // --- Update Map Data Layers ---
  const updateMapLayers = useCallback(
    (activeId: string | null) => {
      if (!map.current) return
      if (navigationActive) {
        return
      }
      if (!map.current.isStyleLoaded()) {
        map.current.once("style.load", () => updateMapLayers(activeId))
        return
      }
      console.log(`Updating map layers. Requested: ${activeId}`)
      const managedLayerIds = [
        "air-quality-heatmap",
        "pothole_density-route-line",
        "hygiene_level-route-line",
        "water_logging_level-route-line",
      ]
      const managedSourceIds = [
        "air-quality-source",
        "pothole_density-route-source",
        "hygiene_level-route-source",
        "water_logging_level-route-source",
      ]
      managedLayerIds.forEach((layerId) => {
        try {
          if (map.current?.getLayer(layerId)) map.current.removeLayer(layerId)
        } catch (e) {
          /* ignore */
        }
      })
      managedSourceIds.forEach((sourceId) => {
        try {
          if (map.current?.getSource(sourceId))
            map.current.removeSource(sourceId)
        } catch (e) {
          /* ignore */
        }
      })
      if (!activeId) {
        setIsLoadingRoutes(false)
        return
      }
      if (heatmapData.length === 0 && !USE_DEMO_DATA) {
        console.log("Waiting for heatmap data before adding layer...")
        return
      } // Don't proceed if data isn't ready (unless demo)
      console.log("Adding layer:", activeId)
      try {
        if (activeId === "air-pollution") addAQIHeatmap()
        else if (activeId === "potholes")
          addHazardRouteVisualization("pothole_density")
        else if (activeId === "garbage")
          addHazardRouteVisualization("hygiene_level")
        else if (activeId === "flooding")
          addHazardRouteVisualization("water_logging_level")
      } catch (error) {
        console.error(`Error adding layer ${activeId}:`, error)
        setIsLoadingRoutes(false)
      }
    },
    [navigationActive, heatmapData, addAQIHeatmap, addHazardRouteVisualization]
  ) // Removed fetchHeatmapData from deps

  // --- Toggle Layer Function ---
  const toggleLayer = (id: string) => {
    if (
      dataLayers.find((layer) => layer.id === id && layer.active) ||
      navigationActive
    )
      return
    setDataLayers((prev) =>
      prev.map((layer) => ({ ...layer, active: layer.id === id }))
    )
    updateMapLayers(id)
  }

  // --- Map Initialization ---
  useEffect(() => {
    if (map.current || !mapContainer.current) return
    if (!MAPBOX_TOKEN) {
      toast.error("Mapbox token missing.")
      return
    }
    mapboxgl.accessToken = MAPBOX_TOKEN
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: DEFAULT_MAP_CENTER,
        zoom: 12.5,
      })
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right")
      map.current.addControl(
        new MyLocationControl(getUserLocation),
        "bottom-right"
      )
      map.current.on("load", () => {
        console.log("Map loaded event fired.")
        setMapLoaded(true)
      })
      map.current.on("error", (e) => {
        console.error("Mapbox error:", e)
        toast.error(`Map error: ${e?.error?.message || "Unknown"}`)
      })
    } catch (error) {
      console.error("Error initializing map:", error)
      toast.error("Failed to initialize map")
    }
    return () => {
      map.current?.remove()
      map.current = null
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe()
      if (fromTypingTimeout) clearTimeout(fromTypingTimeout)
      if (toTypingTimeout) clearTimeout(toTypingTimeout)
      if (userWatchId !== null) navigator.geolocation.clearWatch(userWatchId)
      window.speechSynthesis?.cancel()
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Effect for Fetching Initial Data ---
  useEffect(() => {
    // Fetch data once when component mounts (or if using demo data)
    fetchHeatmapData()
    // Subscribe only if not using demo data
    if (!USE_DEMO_DATA) {
      subscribeToHeatmapData()
    }
  }, [fetchHeatmapData, subscribeToHeatmapData]) // Run once on mount

  // --- Effect for Applying Initial Layer AFTER Map and Data are Ready ---
  useEffect(() => {
    if (mapLoaded && heatmapData.length > 0 && !initialLayerApplied) {
      console.log("Map loaded and data available, applying initial layer.")
      const activeLayer = dataLayers.find((l) => l.active)
      if (activeLayer) {
        updateMapLayers(activeLayer.id)
        setInitialLayerApplied(true) // Mark as applied
      }
    }
  }, [mapLoaded, heatmapData, dataLayers, updateMapLayers, initialLayerApplied]) // Add initialLayerApplied

  // --- Effect to Update Layers when Heatmap Data Changes (Real-time) ---
  useEffect(() => {
    if (
      mapLoaded &&
      map.current &&
      !USE_DEMO_DATA &&
      heatmapData.length > 0 &&
      initialLayerApplied
    ) {
      const activeLayer = dataLayers.find((l) => l.active)
      if (activeLayer && activeLayer.id !== "air-pollution") {
        updateMapLayers(activeLayer.id)
      }
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heatmapData, USE_DEMO_DATA, initialLayerApplied]) // Rerun if heatmapData changes (for non-demo) after initial load

  // --- Get User Location ---
  const getUserLocation = () => {
    // ... (getUserLocation remains the same)
    if (!map.current) return
    const coordinates: [number, number] = DEFAULT_MAP_CENTER
    setUserLocation(coordinates)
    const placeName = "YMCA University, Faridabad"
    if (showNavigation && (!fromLocation || fromLocation === "")) {
      setFromLocation(placeName)
      if (map.current && mapLoaded) {
        if (fromMarkerRef.current) fromMarkerRef.current.remove()
        const fromEl = document.createElement("div")
        fromEl.className = "marker-from"
        fromEl.innerHTML =
          '<div style="background-color: #33A9FF; width: 22px; height: 22px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white;"><div style="color: white; font-weight: bold; font-size: 14px;">A</div></div>'
        fromMarkerRef.current = new mapboxgl.Marker(fromEl)
          .setLngLat(coordinates)
          .addTo(map.current)
        toast.info("Navigation start set to YMCA University")
      }
    }
    if (!userLocationMarkerRef.current && map.current) {
      const el = document.createElement("div")
      el.className = "current-location-marker"
      el.innerHTML = `<div style="background-color: royalblue; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>`
      userLocationMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .addTo(map.current)
    } else if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setLngLat(coordinates)
    }
    map.current?.flyTo({ center: coordinates, zoom: 15, essential: true })
    toast.success("Location set to YMCA University")
  }
  // --- Automatically get user location on map load ---
  useEffect(() => {
    if (mapLoaded && !userLocation) getUserLocation()
  }, [mapLoaded, userLocation])

  // --- Navigation functions ---
  const toggleNavigation = () => {
    // ... (toggleNavigation remains the same)
    const newState = !showNavigation
    setShowNavigation(newState)
    if (newState) {
      if (userLocation && (!fromLocation || fromLocation === "")) {
        const placeName = "YMCA University, Faridabad"
        setFromLocation(placeName)
        if (map.current && mapLoaded) {
          if (fromMarkerRef.current) fromMarkerRef.current.remove()
          const fromEl = document.createElement("div")
          fromEl.className = "marker-from"
          fromEl.innerHTML =
            '<div style="background-color: #33A9FF; width: 22px; height: 22px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white;"><div style="color: white; font-weight: bold; font-size: 14px;">A</div></div>'
          fromMarkerRef.current = new mapboxgl.Marker(fromEl)
            .setLngLat(userLocation)
            .addTo(map.current)
        }
      }
      if (map.current) map.current.on("click", handleMapClick)
    } else {
      clearRoutesAndMarkers()
      setFromLocation("")
      setToLocation("")
      setRoutes([])
      setSelectedRouteId(null)
      if (map.current) map.current.off("click", handleMapClick)
      const activeLayer = dataLayers.find((l) => l.active)
      if (activeLayer) updateMapLayers(activeLayer.id)
    }
  }
  const handleMapClick = useCallback(
    async (e: mapboxgl.MapMouseEvent | any) => {
      // ... (handleMapClick remains the same)
      if (!showNavigation || !map.current || navigationActive) return
      const coords = e.lngLat
      const placeName = await reverseGeocode(coords.lng, coords.lat)
      const locationName =
        placeName || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
      const markerHtml = (label: string, color: string) =>
        `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white;"><div style="color: white; font-weight: bold; font-size: 14px;">${label}</div></div>`
      if (pinMode === "from") {
        setFromLocation(locationName)
        if (fromMarkerRef.current) fromMarkerRef.current.remove()
        const fromEl = document.createElement("div")
        fromEl.innerHTML = markerHtml("A", "#33A9FF")
        fromMarkerRef.current = new mapboxgl.Marker(fromEl)
          .setLngLat(coords)
          .addTo(map.current)
        toast.success("From location set", { duration: 2000 })
        setPinMode("to")
      } else {
        setToLocation(locationName)
        if (toMarkerRef.current) toMarkerRef.current.remove()
        const toEl = document.createElement("div")
        toEl.innerHTML = markerHtml("B", "#FF3366")
        toMarkerRef.current = new mapboxgl.Marker(toEl)
          .setLngLat(coords)
          .addTo(map.current)
        toast.success("To location set", { duration: 2000 })
        if (fromMarkerRef.current) setTimeout(() => findRoutes(), 100)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [showNavigation, navigationActive, pinMode, map, findRoutes]
  )

  // --- Geocoding & Route Display ---
  const clearRouteLines = () => {
    // ... (clearRouteLines remains the same)
    if (!map.current) return
    routes.forEach((route) => {
      const sourceId = `route-${route.id}`
      const layerId = `route-${route.id}`
      const casingLayerId = `${layerId}-casing`
      const pulseLayerId = `${layerId}-pulse`
      try {
        if (map.current?.getLayer(pulseLayerId))
          map.current.removeLayer(pulseLayerId)
        if (map.current?.getLayer(casingLayerId))
          map.current.removeLayer(casingLayerId)
        if (map.current?.getLayer(layerId)) map.current.removeLayer(layerId)
        if (map.current?.getSource(sourceId)) map.current.removeSource(sourceId)
      } catch (e) {
        console.warn("Error removing route layer/source:", e)
      }
    })
    routeLayerRef.current = null
    routeSourceRef.current = null
  }
  const clearRoutesAndMarkers = () => {
    // ... (clearRoutesAndMarkers remains the same)
    clearRouteLines()
    if (fromMarkerRef.current) {
      fromMarkerRef.current.remove()
      fromMarkerRef.current = null
    }
    if (toMarkerRef.current) {
      toMarkerRef.current.remove()
      toMarkerRef.current = null
    }
    setRoutes([])
    setSelectedRouteId(null)
  }
  const reverseGeocode = async (
    lng: number,
    lat: number
  ): Promise<string | null> => {
    // ... (reverseGeocode remains the same)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=address,poi,place,locality`
      )
      const data = await response.json()
      return data.features?.[0]?.place_name || null
    } catch (error) {
      console.error("Error reverse geocoding:", error)
      return null
    }
  }
  const forwardGeocode = async (
    query: string
  ): Promise<[number, number] | null> => {
    // ... (forwardGeocode remains the same)
    if (!query) return null
    try {
      const proximity = userLocation
        ? `${userLocation[0]},${userLocation[1]}`
        : `${DEFAULT_MAP_CENTER[0]},${DEFAULT_MAP_CENTER[1]}`
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${MAPBOX_TOKEN}&limit=1&proximity=${proximity}&country=in`
      )
      const data = await response.json()
      return data.features?.[0]?.center || null
    } catch (error) {
      console.error("Error forward geocoding:", error)
      return null
    }
  }
  const displayRoute = (route: Route | null, isNavigationMode = false) => {
    // ... (displayRoute remains the same)
    if (!map.current || !route) return
    clearRouteLines()
    const sourceId = `route-${route.id}`
    const layerId = `route-${route.id}`
    const casingLayerId = `${layerId}-casing`
    if (map.current.getSource(sourceId)) {
      try {
        map.current.removeSource(sourceId)
      } catch (e) {}
    }
    map.current.addSource(sourceId, {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: route.geometry },
    })
    const routeColor = isNavigationMode
      ? "#0ea5e9"
      : route.isRecommended
      ? "#10b981"
      : "#4F46E5"
    const routeWidth = isNavigationMode
      ? 8
      : route.id === selectedRouteId
      ? 7
      : 5
    const casingWidth = routeWidth + (isNavigationMode ? 4 : 3)
    if (map.current.getLayer(casingLayerId)) {
      try {
        map.current.removeLayer(casingLayerId)
      } catch (e) {}
    }
    map.current.addLayer({
      id: casingLayerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#ffffff",
        "line-width": casingWidth,
        "line-opacity": 0.6,
      },
    })
    if (map.current.getLayer(layerId)) {
      try {
        map.current.removeLayer(layerId)
      } catch (e) {}
    }
    map.current.addLayer(
      {
        id: layerId,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": routeColor,
          "line-width": routeWidth,
          "line-opacity": isNavigationMode ? 0.9 : 0.75,
        },
      },
      casingLayerId
    )
    routeSourceRef.current = sourceId
    routeLayerRef.current = layerId
  }

  // --- Suggestion Handling ---
  const getPlaceSuggestions = async (
    query: string,
    proximity?: [number, number]
  ): Promise<PlaceSuggestion[]> => {
    // ... (getPlaceSuggestions remains the same)
    if (!query || query.length < 3) return []
    try {
      const prox = proximity || DEFAULT_MAP_CENTER
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${MAPBOX_TOKEN}&proximity=${prox[0]},${
          prox[1]
        }&country=in&limit=5&types=poi,address,place,locality`
      )
      const data = await response.json()
      return (
        data.features?.map((f: any) => ({
          id: f.id,
          place_name: f.place_name,
          center: f.center,
        })) || []
      )
    } catch (error) {
      console.error("Error getting place suggestions:", error)
      return []
    }
  }
  const handleLocationInputChange = (value: string, type: "from" | "to") => {
    // ... (handleLocationInputChange remains the same)
    const setLocation = type === "from" ? setFromLocation : setToLocation
    const setSuggestions =
      type === "from" ? setFromSuggestions : setToSuggestions
    const setShowSuggestions =
      type === "from" ? setShowFromSuggestions : setShowToSuggestions
    const markerRef = type === "from" ? fromMarkerRef : toMarkerRef
    const timeoutState = type === "from" ? fromTypingTimeout : toTypingTimeout
    const setTimeoutState =
      type === "from" ? setFromTypingTimeout : setToTypingTimeout
    setLocation(value)
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
    if (timeoutState) clearTimeout(timeoutState)
    const timeoutId = setTimeout(async () => {
      if (value.length >= 3) {
        const suggestions = await getPlaceSuggestions(
          value,
          userLocation || undefined
        )
        setSuggestions(suggestions)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)
    setTimeoutState(timeoutId)
  }
  const selectSuggestion = (
    suggestion: PlaceSuggestion,
    type: "from" | "to"
  ) => {
    // ... (selectSuggestion remains the same)
    const setLocation = type === "from" ? setFromLocation : setToLocation
    const setShowSuggestions =
      type === "from" ? setShowFromSuggestions : setShowToSuggestions
    const markerRef = type === "from" ? fromMarkerRef : toMarkerRef
    const otherMarkerRef = type === "from" ? toMarkerRef : fromMarkerRef
    const otherLocation = type === "from" ? toLocation : fromLocation
    const markerHtml =
      type === "from"
        ? '<div style="background-color: #33A9FF; width: 22px; height: 22px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white;"><div style="color: white; font-weight: bold; font-size: 14px;">A</div></div>'
        : '<div style="background-color: #FF3366; width: 22px; height: 22px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white;"><div style="color: white; font-weight: bold; font-size: 14px;">B</div></div>'
    setLocation(suggestion.place_name)
    setShowSuggestions(false)
    if (map.current) {
      if (markerRef.current) markerRef.current.remove()
      const el = document.createElement("div")
      el.innerHTML = markerHtml
      markerRef.current = new mapboxgl.Marker(el)
        .setLngLat(suggestion.center)
        .addTo(map.current)
      if (otherLocation.trim() !== "" || otherMarkerRef.current) {
        setTimeout(() => findRoutes(), 100)
      }
    }
  }

  // --- Turn-by-Turn Navigation ---
  const getNavigationInstructions = async (
    route: Route
  ): Promise<NavigationInstruction[]> => {
    // ... (getNavigationInstructions remains the same)
    let fromCoordsLL = fromMarkerRef.current?.getLngLat()
    let toCoordsLL = toMarkerRef.current?.getLngLat()
    if (!fromCoordsLL || !toCoordsLL) {
      const fromGeo = await forwardGeocode(fromLocation)
      const toGeo = await forwardGeocode(toLocation)
      if (fromGeo) fromCoordsLL = new mapboxgl.LngLat(fromGeo[0], fromGeo[1])
      if (toGeo) toCoordsLL = new mapboxgl.LngLat(toGeo[0], toGeo[1])
    }
    if (!fromCoordsLL || !toCoordsLL) {
      toast.error("Missing start/end location for instructions.")
      return []
    }
    try {
      const apiUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromCoordsLL.lng},${fromCoordsLL.lat};${toCoordsLL.lng},${toCoordsLL.lat}?steps=true&geometries=geojson&language=en&overview=full&access_token=${MAPBOX_TOKEN}`
      const response = await fetch(apiUrl)
      const data = await response.json()
      const steps = data.routes?.[0]?.legs?.[0]?.steps
      if (!steps) return []
      const instructions: NavigationInstruction[] = steps.map((step: any) => ({
        text: step.maneuver.instruction,
        distance: step.distance,
        maneuver: step.maneuver.type,
        type: step.maneuver.modifier || step.maneuver.type || "straight",
      }))
      return instructions
    } catch (error) {
      console.error("Error getting nav instructions:", error)
      toast.error("Failed to get steps.")
      return []
    }
  }
  const startNavigation = async (route: Route) => {
    // ... (startNavigation logic is correct, uses corrected distance check)
    if (!map.current || !route || navigationActive) return
    if (!userLocation || !fromMarkerRef.current) {
      toast.error("Start point (A) must be set near your location.")
      getUserLocation()
      return
    }
    const fromMarkerPos = fromMarkerRef.current.getLngLat()
    const fromCoordsObj = { x: fromMarkerPos.lng, y: fromMarkerPos.lat }
    const userCoordsObj = { x: userLocation[0], y: userLocation[1] }
    const distSq = distanceSquared(fromCoordsObj, userCoordsObj)
    const distMeters =
      Math.sqrt(distSq) * 111320 * Math.cos((userLocation[1] * Math.PI) / 180) // Approx meters
    if (distMeters > 500) {
      toast.error(
        `Start (A) is approx ${distMeters.toFixed(
          0
        )}m away. Please move closer or reset start.`,
        { duration: 5000 }
      )
      return
    }
    toast.loading("Loading navigation steps...", { id: "nav-steps" })
    const instructions = await getNavigationInstructions(route)
    toast.dismiss("nav-steps")
    if (!instructions.length) {
      toast.error("Could not get instructions.")
      return
    }
    setNavigationActive(true)
    setShowNavigation(true)
    updateMapLayers(null)
    setNavigationInstructions(instructions)
    setCurrentInstruction(instructions[0])
    setNextInstruction(instructions[1] || null)
    setDistanceToNextInstruction(instructions[0].distance)
    if (!muteInstructions)
      speakInstruction(
        `Starting navigation. In ${formatDistance(instructions[0].distance)}, ${
          instructions[0].text
        }`
      )
    displayRoute(route, true)
    map.current.flyTo({
      center: userLocation,
      zoom: 17,
      pitch: 60,
      bearing: 0,
      duration: 1500,
    })
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => updateUserPositionDuringNav(pos, instructions),
        (err) => {
          console.error("Nav location error:", err)
          toast.error(`Location error: ${err.message}`)
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      )
      setUserWatchId(watchId)
      toast.success(
        `Navigation started (${Math.floor(route.duration / 60)} min)`
      )
    } else {
      toast.error("Geolocation unavailable.")
      setNavigationActive(false)
    }
  }
  const updateUserPositionDuringNav = (
    position: GeolocationPosition,
    instructions: NavigationInstruction[]
  ) => {
    // ... (updateUserPositionDuringNav remains the same)
    if (
      !map.current ||
      !navigationActive ||
      !userLocationMarkerRef.current ||
      !instructions.length
    )
      return
    const { latitude, longitude, heading } = position.coords
    const currentUserCoords: [number, number] = [longitude, latitude]
    setUserLocation(currentUserCoords)
    userLocationMarkerRef.current.setLngLat(currentUserCoords)
    map.current.easeTo({
      center: currentUserCoords,
      zoom: map.current.getZoom(),
      bearing: heading ?? map.current.getBearing(),
      pitch: 60,
      duration: 750,
    })
  }
  const stopNavigation = () => {
    // ... (stopNavigation remains the same)
    if (userWatchId !== null) {
      navigator.geolocation.clearWatch(userWatchId)
      setUserWatchId(null)
    }
    setNavigationActive(false)
    window.speechSynthesis?.cancel()
    toast.info("Navigation stopped")
    if (map.current) {
      const selectedRoute = routes.find((r) => r.id === selectedRouteId)
      if (selectedRoute) {
        displayRoute(selectedRoute, false)
        const routeCoords = selectedRoute.geometry.coordinates
        const bounds = routeCoords.reduce(
          (b, coord) => b.extend(coord as mapboxgl.LngLatLike),
          new mapboxgl.LngLatBounds(
            routeCoords[0] as mapboxgl.LngLatLike,
            routeCoords[0] as mapboxgl.LngLatLike
          )
        )
        if (fromMarkerRef.current)
          bounds.extend(fromMarkerRef.current.getLngLat())
        if (toMarkerRef.current) bounds.extend(toMarkerRef.current.getLngLat())
        map.current?.fitBounds(bounds, {
          padding: { top: 150, bottom: 50, left: 50, right: 50 },
          maxZoom: 15,
        })
      } else {
        map.current.flyTo({
          center: userLocation || DEFAULT_MAP_CENTER,
          zoom: 13,
          pitch: 0,
          bearing: 0,
          duration: 1000,
        })
      }
      const activeLayer = dataLayers.find((l) => l.active)
      if (activeLayer) updateMapLayers(activeLayer.id)
    }
  }
  const speakInstruction = (text: string) => {
    // ... (speakInstruction remains the same)
    if (muteInstructions || !window.speechSynthesis || !text) return
    window.speechSynthesis.cancel()
    speechSynthesisRef.current = new SpeechSynthesisUtterance(text)
    speechSynthesisRef.current.rate = 1.0
    speechSynthesisRef.current.pitch = 1
    window.speechSynthesis.speak(speechSynthesisRef.current)
  }
  const toggleMute = () => {
    // ... (toggleMute remains the same)
    const newMuteState = !muteInstructions
    setMuteInstructions(newMuteState)
    if (newMuteState) {
      window.speechSynthesis?.cancel()
      toast.info("Voice muted")
    } else {
      toast.info("Voice unmuted")
      if (currentInstruction)
        speakInstruction(
          `In ${formatDistance(distanceToNextInstruction)}, ${
            currentInstruction.text
          }`
        )
    }
  }
  const formatDistance = (meters: number): string => {
    // ... (formatDistance remains the same)
    if (!meters || meters < 0) return ""
    if (meters < 100) return `${Math.round(meters / 10) * 10} m`
    if (meters < 1000) return `${Math.round(meters)} m`
    return `${(meters / 1000).toFixed(1)} km`
  }
  const setFromToCurrentLocation = () => {
    // ... (setFromToCurrentLocation remains the same)
    if (!userLocation || !map.current) {
      getUserLocation()
      return
    }
    const placeName = "YMCA University, Faridabad"
    setFromLocation(placeName)
    if (fromMarkerRef.current) fromMarkerRef.current.remove()
    const el = document.createElement("div")
    el.innerHTML =
      '<div style="background-color: #33A9FF; width: 22px; height: 22px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white;"><div style="color: white; font-weight: bold; font-size: 14px;">A</div></div>'
    fromMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat(userLocation)
      .addTo(map.current)
    toast.success("From set to current location (YMCA)")
    setPinMode("to")
    if (toLocation.trim() !== "" || toMarkerRef.current)
      setTimeout(() => findRoutes(), 100)
  }

  return (
    <section className="py-16 bg-gray-50">
      {/* ... (JSX structure remains the same, including the loading indicator) ... */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {" "}
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
            Interactive City Map
          </h2>{" "}
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {" "}
            Explore urban conditions in real-time. Toggle data layers or get
            directions optimized for hazards.{" "}
          </p>{" "}
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 relative">
          {isLoadingRoutes && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
              {" "}
              <div className="text-center p-4 bg-gray-100 rounded shadow">
                {" "}
                <svg
                  className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  {" "}
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>{" "}
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>{" "}
                </svg>{" "}
                <p className="text-sm text-gray-700 font-medium">
                  Loading Hazard Segments...
                </p>{" "}
              </div>{" "}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {" "}
            {dataLayers.map((layer) => (
              <Button
                key={layer.id}
                variant={layer.active ? "default" : "outline"}
                size="sm"
                className={`${
                  layer.active
                    ? `${layer.bgColor} ${layer.hoverColor} text-white shadow-sm`
                    : `${layer.borderColor} ${layer.textColor} hover:bg-gray-100`
                } flex items-center gap-1.5 px-2 py-1 text-xs sm:text-sm rounded-md transition-all`}
                onClick={() => toggleLayer(layer.id)}
                disabled={
                  navigationActive || (layer.active && !navigationActive)
                }
              >
                {" "}
                {React.cloneElement(layer.icon as React.ReactElement, {
                  className: "h-4 w-4",
                })}{" "}
                <span>{layer.name}</span>{" "}
              </Button>
            ))}{" "}
            <Button
              variant={showNavigation ? "secondary" : "outline"}
              size="sm"
              className={`${
                showNavigation
                  ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                  : "border-purple-500 text-purple-500 hover:bg-purple-50"
              } flex items-center gap-1.5 ml-auto px-2 py-1 text-xs sm:text-sm rounded-md transition-all`}
              onClick={toggleNavigation}
              disabled={navigationActive}
            >
              {" "}
              <Navigation className="h-4 w-4" />{" "}
              <span>{showNavigation ? "Close Nav" : "Directions"}</span>{" "}
            </Button>{" "}
          </div>
          {showNavigation && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4 relative transition-all duration-300 ease-in-out">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleNavigation}
                className="absolute top-2 right-2 h-8 w-8 text-gray-500 hover:bg-gray-200"
                title="Close Navigation"
              >
                <X className="h-5 w-5" />
              </Button>
              {!navigationActive ? (
                <>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    Get Directions
                  </h3>
                  <div className="bg-gray-100 rounded-md p-2 mb-3 text-xs text-gray-600 flex items-center gap-2 flex-wrap">
                    {" "}
                    <span>Click map to:</span>{" "}
                    <Button
                      size="sm"
                      variant={pinMode === "from" ? "default" : "outline"}
                      onClick={() => setPinMode("from")}
                      className={`px-1.5 py-0.5 rounded-sm ${
                        pinMode === "from"
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "border-blue-300 text-blue-600"
                      }`}
                    >
                      <MapPin className="h-3 w-3 mr-1" /> Start (A)
                    </Button>{" "}
                    <Button
                      size="sm"
                      variant={pinMode === "to" ? "default" : "outline"}
                      onClick={() => setPinMode("to")}
                      className={`px-1.5 py-0.5 rounded-sm ${
                        pinMode === "to"
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "border-red-300 text-red-600"
                      }`}
                    >
                      <MapPin className="h-3 w-3 mr-1" /> End (B)
                    </Button>{" "}
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 relative">
                      {" "}
                      {/* From */}{" "}
                      <div className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        A
                      </div>{" "}
                      <div className="relative flex-1">
                        {" "}
                        <Input
                          placeholder="Start location"
                          value={fromLocation}
                          onChange={(e) =>
                            handleLocationInputChange(e.target.value, "from")
                          }
                          className="pr-10 text-sm rounded-md"
                          onFocus={() =>
                            fromSuggestions.length > 0 &&
                            setShowFromSuggestions(true)
                          }
                          onBlur={() =>
                            setTimeout(() => setShowFromSuggestions(false), 200)
                          }
                        />{" "}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-500 hover:text-blue-600"
                          onClick={setFromToCurrentLocation}
                          title="Use current location"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Button>{" "}
                        {showFromSuggestions && fromSuggestions.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            <ul className="py-1">
                              {fromSuggestions.map((s) => (
                                <li
                                  key={s.id}
                                  className="px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
                                  onMouseDown={() =>
                                    selectSuggestion(s, "from")
                                  }
                                >
                                  {s.place_name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}{" "}
                      </div>{" "}
                    </div>
                    <div className="flex items-center gap-2 relative">
                      {" "}
                      {/* To */}{" "}
                      <div className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        B
                      </div>{" "}
                      <div className="relative flex-1">
                        {" "}
                        <Input
                          placeholder="Destination"
                          value={toLocation}
                          onChange={(e) =>
                            handleLocationInputChange(e.target.value, "to")
                          }
                          className="pr-8 text-sm rounded-md"
                          onFocus={() =>
                            toSuggestions.length > 0 &&
                            setShowToSuggestions(true)
                          }
                          onBlur={() =>
                            setTimeout(() => setShowToSuggestions(false), 200)
                          }
                        />{" "}
                        <Search className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />{" "}
                        {showToSuggestions && toSuggestions.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            <ul className="py-1">
                              {toSuggestions.map((s) => (
                                <li
                                  key={s.id}
                                  className="px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
                                  onMouseDown={() => selectSuggestion(s, "to")}
                                >
                                  {s.place_name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}{" "}
                      </div>{" "}
                    </div>
                  </div>
                  <div className="mb-4">
                    {" "}
                    {/* Find Routes Button */}{" "}
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      onClick={findRoutes}
                      disabled={
                        routeSearching ||
                        (!fromLocation && !fromMarkerRef.current) ||
                        (!toLocation && !toMarkerRef.current)
                      }
                    >
                      {routeSearching ? "Searching..." : "Find Routes"}
                    </Button>{" "}
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      Navigation requires starting near your current location.
                    </p>{" "}
                  </div>
                  {routes.length > 0 && (
                    /* Route List */ <div className="max-h-60 overflow-y-auto pr-2 -mr-2">
                      {" "}
                      <h4 className="text-sm font-semibold mb-2 text-gray-700">
                        Available Routes ({routes.length})
                      </h4>{" "}
                      <div className="space-y-2">
                        {" "}
                        {routes.map((route) => (
                          <div
                            key={route.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-150 ${
                              selectedRouteId === route.id
                                ? "border-blue-500 bg-blue-50 shadow-md"
                                : "border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                            } ${
                              route.isRecommended &&
                              selectedRouteId !== route.id
                                ? "border-green-300 bg-green-50"
                                : ""
                            } ${
                              route.isRecommended &&
                              selectedRouteId === route.id
                                ? "border-green-500 bg-green-100"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedRouteId(route.id)
                              displayRoute(route)
                            }}
                          >
                            {" "}
                            <div className="flex justify-between items-center mb-1.5">
                              {" "}
                              <div className="flex items-baseline gap-2">
                                <span className="font-bold text-base text-blue-700">
                                  {Math.floor(route.duration / 60)} min
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({(route.distance / 1000).toFixed(1)} km)
                                </span>
                              </div>{" "}
                              {route.isRecommended && (
                                <span className="text-xs bg-green-600 text-white font-medium px-1.5 py-0.5 rounded-full">
                                  Recommended
                                </span>
                              )}{" "}
                            </div>{" "}
                            {route.isRecommended && route.recommendReason && (
                              <div className="text-xs text-green-700 mb-1.5 font-medium">
                                Reason: {route.recommendReason}
                              </div>
                            )}{" "}
                            <div className="grid grid-cols-3 gap-1 text-xs text-gray-600 border-t border-gray-200 pt-1.5 mt-1">
                              {" "}
                              <div
                                title={`Pothole Risk: ${route.potholeRisk.toFixed(
                                  0
                                )}%`}
                                className={`flex items-center gap-1 ${
                                  route.potholeRisk > 60
                                    ? "text-red-600 font-medium"
                                    : route.potholeRisk > 30
                                    ? "text-orange-600"
                                    : "text-gray-500"
                                }`}
                              >
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{route.potholeRisk.toFixed(0)}%</span>
                              </div>{" "}
                              <div
                                title={`Garbage Risk: ${route.garbageIntensity.toFixed(
                                  0
                                )}%`}
                                className={`flex items-center gap-1 ${
                                  route.garbageIntensity > 60
                                    ? "text-red-600 font-medium"
                                    : route.garbageIntensity > 30
                                    ? "text-orange-600"
                                    : "text-gray-500"
                                }`}
                              >
                                <Trash2 className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>
                                  {route.garbageIntensity.toFixed(0)}%
                                </span>
                              </div>{" "}
                              <div
                                title={`Flooding Risk: ${route.floodRisk.toFixed(
                                  0
                                )}%`}
                                className={`flex items-center gap-1 ${
                                  route.floodRisk > 60
                                    ? "text-blue-700 font-medium"
                                    : route.floodRisk > 30
                                    ? "text-blue-500"
                                    : "text-gray-500"
                                }`}
                              >
                                <Droplets className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{route.floodRisk.toFixed(0)}%</span>
                              </div>{" "}
                            </div>{" "}
                            {selectedRouteId === route.id && (
                              <Button
                                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-md"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startNavigation(route)
                                }}
                              >
                                <Play className="h-4 w-4 mr-1.5" /> Start
                                Navigation
                              </Button>
                            )}{" "}
                          </div>
                        ))}{" "}
                      </div>{" "}
                    </div>
                  )}
                </>
              ) : (
                /* --- Active Turn-by-Turn Navigation UI --- */
                <div className="turn-by-turn-navigation animate-fade-in">
                  {" "}
                  <div className="bg-blue-600 text-white p-3 rounded-lg shadow-md mb-3">
                    {" "}
                    <div className="flex items-center gap-3">
                      {" "}
                      <div className="flex-shrink-0">
                        {currentInstruction?.type?.includes("left") ? (
                          <CornerUpLeft className="h-8 w-8" />
                        ) : currentInstruction?.type?.includes("right") ? (
                          <ArrowUpRight className="h-8 w-8" />
                        ) : currentInstruction?.type?.includes("straight") ? (
                          <ArrowUpRight className="h-8 w-8 transform rotate-45" />
                        ) : (
                          <Navigation className="h-8 w-8" />
                        )}
                      </div>{" "}
                      <div className="flex-1 overflow-hidden">
                        {" "}
                        <div className="text-xl font-bold mb-1">
                          {formatDistance(distanceToNextInstruction)}
                        </div>{" "}
                        <div className="text-sm truncate font-medium">
                          {currentInstruction?.text || "Follow route"}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  {nextInstruction && (
                    <div className="flex items-center gap-3 mb-3 px-2 py-1 bg-gray-100 rounded text-xs">
                      {" "}
                      <div className="text-gray-500 font-medium">
                        Then:
                      </div>{" "}
                      <div className="flex-1 text-gray-700 truncate">
                        {nextInstruction.text}
                      </div>{" "}
                      <div className="flex-shrink-0">
                        {nextInstruction.type?.includes("left") ? (
                          <CornerUpLeft className="h-4 w-4 text-gray-500" />
                        ) : nextInstruction.type?.includes("right") ? (
                          <ArrowUpRight className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-gray-500 transform rotate-45" />
                        )}
                      </div>{" "}
                    </div>
                  )}{" "}
                  <div className="flex items-center justify-between mt-2">
                    {" "}
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 border-gray-300 text-gray-600 hover:bg-gray-200 rounded-full"
                      onClick={toggleMute}
                      title={muteInstructions ? "Unmute voice" : "Mute voice"}
                    >
                      {muteInstructions ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>{" "}
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md"
                      onClick={stopNavigation}
                    >
                      <X className="h-4 w-4 mr-1.5" /> End
                    </Button>{" "}
                  </div>{" "}
                </div>
              )}
            </div>
          )}

          <div
            className="rounded-lg overflow-hidden bg-gray-200 border border-gray-300 shadow-inner"
            style={{ height: "550px", position: "relative" }}
          >
            {" "}
            <div ref={mapContainer} className="h-full w-full" />{" "}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600">
            {" "}
            <span className="font-semibold mr-2">Legend:</span>{" "}
            <div
              className="flex items-center"
              title="Air Quality (Good to Hazardous)"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 mr-1.5"></span>
              Air Quality
            </div>{" "}
            <div
              className="flex items-center"
              title="Pothole Hazard Severity (Low to High)"
            >
              <span className="h-1 w-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 mr-1.5 opacity-80"></span>
              Pothole Segments
            </div>{" "}
            <div
              className="flex items-center"
              title="Garbage Hazard Severity (Low to High)"
            >
              <span className="h-1 w-4 bg-gradient-to-r from-green-300 via-yellow-400 to-orange-500 mr-1.5 opacity-80"></span>
              Garbage Segments
            </div>{" "}
            <div
              className="flex items-center"
              title="Flooding Hazard Severity (Low to High)"
            >
              <span className="h-1 w-4 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-700 mr-1.5 opacity-80"></span>
              Flooding Segments
            </div>{" "}
            <div className="flex items-center">
              <span className="h-1 w-4 bg-indigo-600 mr-1.5"></span>Nav Route
            </div>{" "}
            <div className="flex items-center">
              <span className="h-1 w-4 bg-green-500 mr-1.5"></span>Recommended
              Nav
            </div>{" "}
          </div>
        </div>
      </div>
      <style>{` .marker-from, .marker-to { cursor: pointer; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .animate-fade-in { animation: fadeIn 0.3s ease-in-out; } .max-h-60::-webkit-scrollbar { width: 6px; } .max-h-60::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px;} .max-h-60::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px;} .max-h-60::-webkit-scrollbar-thumb:hover { background: #aaa; } `}</style>
    </section>
  )
}

export default MapSection
