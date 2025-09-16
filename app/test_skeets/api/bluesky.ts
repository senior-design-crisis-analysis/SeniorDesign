// lib/bluesky.ts
import { BskyAgent } from "@atproto/api";

const agent = new BskyAgent({
  service: "https://bsky.social", // main Bluesky service
});

async function getAgent() {
  // Ensure we only login once per session
  if (!agent.session) {
    await agent.login({
      identifier: process.env.BLUESKY_USERNAME as string,
      password: process.env.BLUESKY_PASSWORD as string,
    });
  }
  return agent;
}

export async function getProfile(handle: string) {
  const agent = await getAgent();
  const response = await agent.getProfile({ actor: handle });
  return response.data;
}
