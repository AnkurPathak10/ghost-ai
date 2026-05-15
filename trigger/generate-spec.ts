import { randomUUID } from "node:crypto";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { put } from "@vercel/blob";
import { generateText } from "ai";
import { logger, metadata, task } from "@trigger.dev/sdk/v3";

import {
  generateSpecTaskPayloadSchema,
  type GenerateSpecTaskPayload,
} from "../lib/spec-generation/spec-generation-schemas";
import { getUnacceleratedPrisma } from "../lib/prisma";
import { GENERATE_SPEC_TASK_ID } from "../lib/trigger-task-ids";

function resolveGoogleGenerativeAiApiKey(): string {
  const key =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "No Google AI API key: set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY (or GOOGLE_API_KEY)."
    );
  }
  return key;
}

function buildSpecPrompt(payload: GenerateSpecTaskPayload): string {
  const chatBlock =
    payload.chatHistory.length === 0
      ? "(No sidebar chat yet.)"
      : payload.chatHistory
          .map(
            (m) =>
              `- [${m.role}] ${m.sender} @ ${new Date(m.timestamp).toISOString()}: ${m.content}`
          )
          .join("\n");

  const snapshot = {
    nodes: payload.nodes.map((n) => ({
      id: n.id,
      position: n.position,
      width: n.width,
      height: n.height,
      data: n.data,
    })),
    edges: payload.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: typeof e.label === "string" ? e.label : undefined,
    })),
  };

  return `Project id: ${payload.projectId}
Room id: ${payload.roomId}

## Sidebar chat (most recent context first in list order as given)
${chatBlock}

## Current canvas (nodes and edges)
${JSON.stringify(snapshot, null, 2)}

Write a single cohesive technical specification in Markdown. Include: overview, key components and responsibilities inferred from node labels, relationships and data flow from edges, and notable constraints or open questions suggested by the diagram and chat. Use \`###\` headings and bullet lists where helpful. Do not wrap the document in a fenced code block.`;
}

const SYSTEM = `You are Ghost AI's technical spec author. Produce clear, professional Markdown for engineers. Stay grounded in the provided canvas structure and chat; label inferred behavior as assumptions when the diagram is ambiguous. Do not include placeholder sections with "TBD" unless the inputs truly lack that information.`;

function getBlobReadWriteToken(): string | null {
  const t = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return typeof t === "string" && t.length > 0 ? t : null;
}

export const generateSpecTask = task({
  id: GENERATE_SPEC_TASK_ID,
  run: async (rawPayload: unknown, { ctx }) => {
    const parsed = generateSpecTaskPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      logger.error("generate-spec invalid payload", {
        issues: parsed.error.flatten(),
      });
      await metadata
        .set("phase", "error")
        .set("status", "invalid_payload")
        .set("error", "Invalid task payload");
      return {
        ok: false as const,
        error: "Invalid task payload",
      };
    }

    const payload = parsed.data;
    const runId = ctx.run.id;

    await metadata
      .set("phase", "start")
      .set("status", "starting")
      .set("scope", "spec")
      .set("projectId", payload.projectId)
      .set("roomId", payload.roomId);

    try {
      await metadata.set("phase", "generating").set("status", "generating");

      const googleGenAi = createGoogleGenerativeAI({
        apiKey: resolveGoogleGenerativeAiApiKey(),
      });

      const result = await generateText({
        model: googleGenAi("gemini-2.5-flash"),
        system: SYSTEM,
        prompt: buildSpecPrompt(payload),
      });

      const markdown = result.text?.trim() ?? "";
      if (!markdown) {
        throw new Error("Model returned empty spec content.");
      }

      const blobToken = getBlobReadWriteToken();
      if (!blobToken) {
        const msg =
          "Spec storage is not configured (BLOB_READ_WRITE_TOKEN).";
        logger.error("generate-spec: blob token missing", { runId, projectId: payload.projectId });
        await metadata.set("phase", "error").set("status", "error").set("error", msg);
        return { ok: false as const, error: msg };
      }

      let db;
      try {
        db = getUnacceleratedPrisma();
      } catch (configErr) {
        const msg =
          "Could not connect to the database for spec metadata (set DIRECT_DATABASE_URL when using Prisma Accelerate).";
        logger.error("generate-spec: Prisma direct client unavailable", {
          error: configErr,
          runId,
          projectId: payload.projectId,
        });
        await metadata.set("phase", "error").set("status", "error").set("error", msg);
        return { ok: false as const, error: msg };
      }

      const specId = randomUUID();
      const pathname = `specs/${payload.projectId}/${specId}.md`;

      let blobUrl: string;
      try {
        const blob = await put(pathname, markdown, {
          access: "private",
          addRandomSuffix: false,
          allowOverwrite: true,
          token: blobToken,
        });
        blobUrl = blob.url;
      } catch (blobErr) {
        const message =
          blobErr instanceof Error ? blobErr.message : "Blob upload failed.";
        logger.error("generate-spec: blob upload failed", {
          error: message,
          runId,
          projectId: payload.projectId,
        });
        await metadata.set("phase", "error").set("status", "error").set("error", message);
        return { ok: false as const, error: message };
      }

      try {
        await db.projectSpec.create({
          data: {
            id: specId,
            projectId: payload.projectId,
            filePath: blobUrl,
          },
        });
      } catch (dbErr) {
        const message =
          dbErr instanceof Error ? dbErr.message : "Failed to save spec metadata.";
        logger.error("generate-spec: ProjectSpec create failed", {
          error: message,
          runId,
          projectId: payload.projectId,
        });
        await metadata.set("phase", "error").set("status", "error").set("error", message);
        return { ok: false as const, error: message };
      }

      await metadata
        .set("phase", "complete")
        .set("status", "complete")
        .set("specId", specId);

      logger.info("generate-spec completed", {
        runId,
        projectId: payload.projectId,
        roomId: payload.roomId,
        specId,
        charCount: markdown.length,
      });

      return {
        ok: true as const,
        markdown,
        specId,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Spec generation failed unexpectedly.";
      logger.error("generate-spec failed", {
        error: message,
        runId,
        projectId: payload.projectId,
        roomId: payload.roomId,
      });
      try {
        await metadata.set("phase", "error").set("status", "error").set("error", message);
      } catch {
        /* ignore metadata failures */
      }
      return {
        ok: false as const,
        error: message,
      };
    }
  },
});
