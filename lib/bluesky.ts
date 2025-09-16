// lib/bluesky.ts
import { BskyAgent } from "@atproto/api";

const agent = new BskyAgent({
  service: "https://bsky.social", // or your own PDS
});

export async function loginToBluesky() {
  await agent.login({
    identifier: process.env.BLUESKY_USERNAME as string,
    password: process.env.BLUESKY_PASSWORD as string,
  });
  return agent;
}
