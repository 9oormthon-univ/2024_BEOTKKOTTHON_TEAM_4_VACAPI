import {WebClient} from "@slack/web-api";

const web = new WebClient(process.env.SLACK_TOKEN, {});

export function sendSlackMessage(message: string) {
    console.log(process.env)
    web.chat.postMessage({
        channel: process.env.SLACK_CHANNEL || "",
        text: message,
    })
        .catch(console.error);
}
