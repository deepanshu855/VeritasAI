import "dotenv/config";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  tool,
  createAgent,
  modelFallbackMiddleware,
} from "langchain";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tavilySearch } from "./internet.service.js";
import * as z from "zod";

const smallModel = new ChatGroq({
  model: "openai/gpt-oss-20b",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0,
});

// Primary: retries a few times to ride out short rate-limit waits
const bigModel = new ChatGroq({
  model: "openai/gpt-oss-120b",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0,
  maxTokens: 1024,
  maxRetries: 3,
});

// Fallback 1: Groq Qwen (same provider, different model/rate-limit bucket)
const groqQwen = new ChatGroq({
  model: "qwen/qwen3.8-27b",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0,
  maxTokens: 1024,
  maxRetries: 0,
});

// Fallback 2: Gemini (only if key is set)
const gemini = process.env.GEMINI_API_KEY
  ? new ChatGoogleGenerativeAI({
      model: "gemini-3.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0,
      maxOutputTokens: 1024,
      maxRetries: 0,
    })
  : null;

// Fallback 3: OpenRouter free router (only if key is set)
const openrouter = process.env.OPENROUTER_API_KEY
  ? new ChatOpenAI({
      model: "openrouter/free",
      apiKey: process.env.OPENROUTER_API_KEY,
      temperature: 0,
      maxTokens: 1024,
      configuration: { baseURL: "https://openrouter.ai/api/v1" },
      maxRetries: 0,
    })
  : null;

const fallbacks = [groqQwen, gemini, openrouter].filter(Boolean);

const searchInternetTool = tool(tavilySearch, {
  name: "searchInternet",
  description: "Use this tool to get the latest information from the internet.",
  schema: z.object({
    query: z.string().describe("The search query to look up on the internet."),
  }),
});

const agent = createAgent({
  model: bigModel,
  tools: [searchInternetTool],
  middleware: [modelFallbackMiddleware(...fallbacks)],
});

export const generateResponse = async (messages) => {
  const response = await agent.invoke({
    messages: [
      new SystemMessage(`You are a helpful and precise assistant for answering questions.
      If you don't know the answer, say you don't know. 
      If the question requires up-to-date information, use the "searchInternet" tool to get the latest information from the internet and then answer based on the search results.`),

      ...messages.map((msg) =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
    ],
  });
  return response.messages[response.messages.length - 1].text;
};

export const generateTitle = async (messages) => {
  const response = await smallModel.invoke([
    new SystemMessage(`You are a helpful assistant that generates concise and descriptive titles for chat conversations.

User will provide you with the first message of a chat conversation, and you will generate a title that captures the essence of the conversation in 2-4 words. The title should be clear, relevant, and engaging, giving users a quick understanding of the chat's topic.`),
    new HumanMessage(`
      Generate a title for a chat conversation based on the following first message:
      "${messages}"
    `),
  ]);
  return response.text;
};