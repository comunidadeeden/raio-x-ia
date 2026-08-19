import { createGateway } from "ai";
import { getAIEnv } from "@/lib/env";

export function getConfiguredModel() {
  const env = getAIEnv();
  const modelId = env.AI_MODEL.includes("/")
    ? env.AI_MODEL
    : `${env.AI_PROVIDER}/${env.AI_MODEL}`;
  const gateway = createGateway({ apiKey: env.AI_API_KEY });
  return gateway(modelId);
}
