import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import fetch from "node-fetch"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY

const HEATMAP_TABLE = "heatmap_data"

async function startService() {
  console.log("Starting heatmap data processing service...")

  setupRealtimeSubscription()

  console.log("Listening for new entries in raw_table...")

  await processUnprocessedEntries()
}

function setupRealtimeSubscription() {
  try {
    const channel = supabase
      .channel("raw-table-inserts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "raw_table",
        },
        (payload) => {
          console.log("🔔 Realtime event received:", payload.eventType)
          if (payload.new && payload.new.id) {
            console.log(`New entry detected with ID: ${payload.new.id}`)
            handleNewEntry(payload)
          } else {
            console.warn(
              "Received payload without expected data structure:",
              payload
            )
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to raw_table changes")
        } else if (status === "CHANNEL_ERROR") {
          console.error("Channel error:", err)
          setTimeout(() => {
            console.log("Reconnecting...")
            setupRealtimeSubscription()
          }, 5000)
        } else if (status === "TIMED_OUT") {
          console.error("Subscription timed out")
          setTimeout(() => {
            console.log("Attempting to reconnect after timeout...")
            setupRealtimeSubscription()
          }, 5000)
        } else {
          console.log(`Subscription status: ${status}`)
        }
      })

    global.supabaseChannel = channel

    setInterval(() => {
      if (channel) {
        console.log("Sending heartbeat to keep connection alive...")
        channel.send({
          type: "broadcast",
          event: "heartbeat",
          payload: { timestamp: new Date().toISOString() },
        })
      }
    }, 30000)
  } catch (error) {
    console.error("Error setting up realtime subscription:", error)
    setTimeout(() => {
      console.log("Attempting to reconnect after error...")
      setupRealtimeSubscription()
    }, 5000)
  }
}

async function processUnprocessedEntries() {
  console.log("Checking for unprocessed entries...")

  const { data, error } = await supabase
    .from("raw_table")
    .select("*")
    .eq("processed", false)

  if (error) {
    console.error("Error fetching unprocessed entries:", error)
    return
  }

  console.log(`Found ${data?.length || 0} pending entries to process`)

  if (data && data.length > 0) {
    for (const entry of data) {
      await processEntry(entry)

      const { error: updateError } = await supabase
        .from("raw_table")
        .update({ processed: true })
        .eq("id", entry.id)

      if (updateError) {
        console.error(
          `Error updating pending status for entry ${entry.id}:`,
          updateError
        )
      } else {
        console.log(`Updated pending status for entry ${entry.id}`)
      }
    }
  }
}

async function handleNewEntry(payload) {
  console.log("New entry detected:", payload.new.id)
  await processEntry(payload.new)

  const { error: updateError } = await supabase
    .from("raw_table")
    .update({ processed: true })
    .eq("id", payload.new.id)

  if (updateError) {
    console.error(
      `Error updating pending status for entry ${payload.new.id}:`,
      updateError
    )
  } else {
    console.log(`Updated pending status for entry ${payload.new.id}`)
  }
}

async function processEntry(entry) {
  try {
    console.log(`Processing entry ${entry.id}`)

    const { data: existingData } = await supabase
      .from(HEATMAP_TABLE)
      .select("id")
      .eq("raw_entry_id", entry.id)
      .limit(1)

    if (existingData && existingData.length > 0) {
      console.log(`Entry ${entry.id} already processed, skipping`)
      return
    }

    if (!entry.coordinates) {
      console.warn(`Entry ${entry.id} has no coordinates, skipping`)
      return
    }

    const coordinates = parsePointData(entry.coordinates)
    if (!coordinates) {
      console.warn(`Could not parse coordinates for entry ${entry.id}`)
      return
    }

    const heatmapData = await generateHeatmapData(entry, coordinates)

    const { error } = await supabase.from(HEATMAP_TABLE).insert({
      raw_entry_id: entry.id,
      coordinates: entry.coordinates,
      air_quality: heatmapData.airQuality,
      pothole_density: heatmapData.potholeDensity,
      hygiene_level: heatmapData.hygieneLevel,
      water_logging_level: heatmapData.waterLoggingLevel,
      pothole_data: heatmapData.potholeData,
      created_at: new Date(),
    })

    if (error) {
      console.error(
        `Error inserting heatmap data for entry ${entry.id}:`,
        error
      )
      return
    }

    console.log(`Successfully processed entry ${entry.id}`)
  } catch (error) {
    console.error(`Error processing entry ${entry.id}:`, error)
  }
}

async function generateHeatmapData(entry, coordinates) {
  const airQuality = generateRandomValue(45, 50)

  let potholeDensity = 0
  let potholeData = null

  if (entry.image_url) {
    const potholeResult = await detectPotholes(entry.image_url)
    potholeData = potholeResult

    if (
      potholeResult &&
      potholeResult.length > 0 &&
      potholeResult[0].predictions &&
      potholeResult[0].predictions.predictions
    ) {
      const detections = potholeResult[0].predictions.predictions

      if (detections.length > 0) {
        const totalConfidence = detections.reduce(
          (sum, detection) => sum + detection.confidence,
          0
        )
        potholeDensity = Math.min(
          100,
          (totalConfidence / detections.length) * detections.length * 25
        )
      }
    }
  } else {
    potholeDensity = 0
  }

  const hygieneLevel = 0
  const waterLoggingLevel = 0

  return {
    airQuality,
    potholeDensity,
    hygieneLevel,
    waterLoggingLevel,
    potholeData,
  }
}

async function detectPotholes(imageUrl) {
  try {
    console.log(`Detecting potholes in image: ${imageUrl}`)

    const response = await fetch(
      "https://serverless.roboflow.com/infer/workflows/swayam-iftnk/custom-workflow-2",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: ROBOFLOW_API_KEY,
          inputs: {
            image: { type: "url", value: imageUrl },
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Roboflow API error: ${response.statusText}`)
    }

    const result = await response.json()
    console.log(
      `Pothole detection complete: Found ${
        result[0]?.predictions?.predictions?.length || 0
      } potholes`
    )

    return result
  } catch (error) {
    console.error("Error detecting potholes:", error)
    return null
  }
}

function parsePointData(pointData) {
  if (typeof pointData === "string") {
    const match = pointData.match(/\((-?\d+\.?\d*),(-?\d+\.?\d*)\)/)
    if (match) {
      return {
        longitude: parseFloat(match[1]),
        latitude: parseFloat(match[2]),
      }
    }
  } else if (pointData && typeof pointData === "object") {
    return {
      longitude: pointData.x || pointData.longitude,
      latitude: pointData.y || pointData.latitude,
    }
  }

  return null
}

function generateRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

startService().catch((err) => {
  console.error("Fatal error starting service:", err)
  process.exit(1)
})

process.on("SIGINT", async () => {
  console.log("Service shutdown initiated...")
  if (global.supabaseChannel) {
    console.log("Unsubscribing from Supabase channel...")
    global.supabaseChannel.unsubscribe()
  }
  process.exit(0)
})
