interface DiscordEmbedField {
  name: string
  value: string
  inline?: boolean
}

interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: DiscordEmbedField[]
  timestamp?: string
  footer?: {
    text: string
  }
}

interface DiscordWebhookPayload {
  username?: string
  avatar_url?: string
  content?: string
  embeds?: DiscordEmbed[]
}

interface EventData {
  event: string
  url?: string
  referrer?: string
  [key: string]: unknown
}

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1410733340084015214/Ydp1bquncROUJ_grG-zg1tReLO9hgpyndACglVViWreRK6azU7caf6EAwszq67hr4nlv"

async function sendDiscordNotification(
  event: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const embed: DiscordEmbed = {
      title: event,
      description: data ? Object.entries(data)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `**${key}:** ${value}`)
        .join('\n') : undefined,
      color: 0x6366f1,
      timestamp: new Date().toISOString()
    }


    const payload: DiscordWebhookPayload = {
      username: "Better Gradient Bot",
      embeds: [embed]
    }

    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
  } catch (error) {
    console.error("Failed to send Discord notification:", error)
  }
}

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void
    }
  }
}

async function trackUmamiEvent(
  event: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    if (typeof window !== "undefined" && window.umami) {
      if (data && Object.keys(data).length > 0) {
        window.umami.track(event, data)
      } else {
        window.umami.track(event)
      }
    }
  } catch (error) {
    console.error("Failed to track Umami event:", error)
  }
}

async function trackEvent(
  event: string,
  data?: Record<string, unknown>
): Promise<void> {
  await Promise.allSettled([
    sendDiscordNotification(event, data),
    trackUmamiEvent(event, data)
  ])
}

export { sendDiscordNotification, trackUmamiEvent, trackEvent, type EventData }