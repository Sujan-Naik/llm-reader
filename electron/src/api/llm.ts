import { ipcMain } from 'electron';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

let openaiClient: OpenAI | undefined;
let xaiClient: OpenAI | undefined;

const USAGE_MARKER = "[[USAGE]]";

const OPENAI_PRICING = {
    "gpt-5": {input: 1.25, output: 10.00},
    "gpt-5-mini": {input: 0.25, output: 2.00},
    "gpt-5-nano": {input: 0.05, output: 0.40},
    "gpt-5-chat-latest": {input: 1.25, output: 10.00},
    "gpt-4.1": {input: 2.00, output: 8.00},
    "gpt-4.1-mini": {input: 0.40, output: 1.60},
    "gpt-4.1-nano": {input: 0.10, output: 0.40},
    "gpt-4o": {input: 2.50, output: 10.00},
    "gpt-4o-2024-05-13": {input: 5.00, output: 15.00},
    "gpt-4o-mini": {input: 0.15, output: 0.60},
    "o3": {input: 2.00, output: 8.00},
    "o4-mini": {input: 1.10, output: 4.40},
    "o3-mini": {input: 1.10, output: 4.40},
    "o1-mini": {input: 1.10, output: 4.40},
    "gpt-4-turbo": {input: 10.00, output: 30.00},
    "gpt-3.5-turbo": {input: 0.50, output: 1.50},
} as const;

const GROK_PRICING = {
    "grok-code-fast-1": {input: 0.20, output: 1.50, context: 256000},
    "grok-4-fast-reasoning": {input: 0.20, output: 0.80, context: 2000000},
    "grok-4-fast-non-reasoning": {input: 0.20, output: 0.80, context: 2000000},
    "grok-4-0709": {input: 5.00, output: 15.00, context: 256000},
    "grok-3-mini": {input: 0.30, output: 0.50, context: 131072},
    "grok-3": {input: 3.00, output: 15.00, context: 131072},
} as const;

const MODEL_PRICING = {...OPENAI_PRICING, ...GROK_PRICING} as const;

type ModelName = keyof typeof MODEL_PRICING;

interface StreamRequest {
    query?: string;
    model?: ModelName;
    messages?: ChatCompletionMessageParam[];
    temperature?: number;
    maxTokens?: number;
}

interface UsageInfo {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
    latencyMs: number;
    model: string;
}

const OPENAI_CAPABILITIES: Record<
    string,
    { supportsTemperature: boolean; tokenParam: "max_tokens" | "max_completion_tokens" }
> = {
    "gpt-5": {supportsTemperature: false, tokenParam: "max_completion_tokens"},
    "gpt-5-mini": {supportsTemperature: false, tokenParam: "max_completion_tokens"},
    "gpt-5-nano": {supportsTemperature: false, tokenParam: "max_completion_tokens"},
    "gpt-5-chat-latest": {supportsTemperature: false, tokenParam: "max_completion_tokens"},
    "gpt-4.1": {supportsTemperature: true, tokenParam: "max_tokens"},
    "gpt-4.1-mini": {supportsTemperature: true, tokenParam: "max_tokens"},
    "gpt-4.1-nano": {supportsTemperature: true, tokenParam: "max_tokens"},
    "gpt-4o": {supportsTemperature: true, tokenParam: "max_tokens"},
    "gpt-4o-2024-05-13": {supportsTemperature: true, tokenParam: "max_tokens"},
    "gpt-4o-mini": {supportsTemperature: true, tokenParam: "max_tokens"},
    "gpt-4-turbo": {supportsTemperature: true, tokenParam: "max_tokens"},
    "gpt-3.5-turbo": {supportsTemperature: true, tokenParam: "max_tokens"},
    "o3": {supportsTemperature: false, tokenParam: "max_completion_tokens"},
    "o4-mini": {supportsTemperature: false, tokenParam: "max_completion_tokens"},
    "o3-mini": {supportsTemperature: false, tokenParam: "max_completion_tokens"},
    "o1-mini": {supportsTemperature: false, tokenParam: "max_completion_tokens"},
};

const GROK_CAPABILITIES: Record<
    string,
    { supportsTemperature: boolean; tokenParam: "max_tokens" | "max_completion_tokens"; contextWindow: number }
> = {
    "grok-code-fast-1": {supportsTemperature: true, tokenParam: "max_tokens", contextWindow: 256000},
    "grok-4-fast-reasoning": {supportsTemperature: true, tokenParam: "max_tokens", contextWindow: 2000000},
    "grok-4-fast-non-reasoning": {supportsTemperature: true, tokenParam: "max_tokens", contextWindow: 2000000},
    "grok-4-0709": {supportsTemperature: true, tokenParam: "max_tokens", contextWindow: 256000},
    "grok-3-mini": {supportsTemperature: true, tokenParam: "max_tokens", contextWindow: 131072},
    "grok-3": {supportsTemperature: true, tokenParam: "max_tokens", contextWindow: 131072},
};

function getClient(model: ModelName): OpenAI {
    const isGrokModel = model in GROK_PRICING;
    if (isGrokModel) {
        if (!process.env.XAI_API_KEY) {
            throw new Error("XAI_API_KEY is required for Grok models");
        }
        if (!xaiClient) {
            xaiClient = new OpenAI({
                apiKey: process.env.XAI_API_KEY,
                baseURL: "https://api.x.ai/v1",
            });
        }
        return xaiClient;
    } else {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is required for OpenAI models");
        }
        if (!openaiClient) {
            openaiClient = new OpenAI({apiKey: process.env.OPENAI_TEST_KEY});
        }
        return openaiClient;
    }
}

export async function queryLLM(args: StreamRequest) {
    const {
        query: userQuery = "Hello",
        model = "gpt-4o-mini",
        messages = [],
        temperature = 0.7,
        maxTokens,
    } = args;

    if (!MODEL_PRICING[model]) {
        throw new Error(`Unknown model: ${model}`);
    }

    const systemPrompt: ChatCompletionMessageParam = {
        role: "system",
        content:
            "You are a helpful, concise assistant. Be brief unless more detail is requested - give responses in markdown. " +
            "Wrap code in code brackets.",
    };

    const userMessage: ChatCompletionMessageParam = {
        role: "user",
        content: userQuery,
    };

    const start = Date.now();

    const client = getClient(model);
    const isGrokModel = model in GROK_PRICING;
    const caps = isGrokModel ? GROK_CAPABILITIES[model] : (OPENAI_CAPABILITIES[model] as any);

    if (!caps) {
        throw new Error(`No capability map for model: ${model}`);
    }

    const requestPayload: any = {
        model,
        messages: [systemPrompt, ...messages, userMessage],
        stream: true,
        stream_options: {include_usage: true},
    };

    if (maxTokens) {
        requestPayload[caps.tokenParam] = maxTokens;
    }

    if (caps.supportsTemperature && typeof temperature === "number") {
        requestPayload.temperature = temperature;
    }

    const response = await client.chat.completions.create(requestPayload);

    if (!(Symbol.asyncIterator in response)) {
        throw new Error(
            `Model ${model} did not return a streaming response. ` +
            `Check if it supports 'stream: true'.`
        );
    }

    let finalUsage:
        | { prompt_tokens: number; completion_tokens: number; total_tokens: number }
        | undefined;

    let fullResponse = '';
    const chunks: string[] = [];

    for await (const chunk of response as any) {
        const content = chunk.choices?.[0]?.delta?.content || "";
        if (content) {
            fullResponse += content;
            chunks.push(content);
        }

        if ((chunk as any)?.usage) {
            finalUsage = (chunk as any).usage;
        }
    }

    const pricing = MODEL_PRICING[model] as { input: number; output: number };
    const inputTokens = finalUsage?.prompt_tokens ?? 0;
    const outputTokens = finalUsage?.completion_tokens ?? 0;
    const totalTokens = finalUsage?.total_tokens ?? inputTokens + outputTokens;

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    const totalCost = inputCost + outputCost;

    const latencyMs = Date.now() - start;

    const usageInfo: UsageInfo = {
        inputTokens,
        outputTokens,
        totalTokens,
        inputCost,
        outputCost,
        totalCost,
        latencyMs,
        model,
    };

    return {
        content: fullResponse,
        usage: usageInfo,
        chunks
    };
}