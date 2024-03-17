import { WebClient } from '@slack/web-api'

const web = new WebClient(process.env.SLACK_TOKEN, {})

export function sendSlackMessage (message: string): void {
  if (process.env.SLACK_CHANNEL == null) throw new Error('SLACK_CHANNEL is not defined')

  web.chat.postMessage({
    channel: process.env.SLACK_CHANNEL,
    text: message
  })
    .catch(console.error)
}
