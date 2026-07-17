import "dotenv/config";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  tool,
  createAgent,
} from "langchain"
import { ChatMistralAI } from "@langchain/mistralai";
import { tavilySearch } from "./internet.service.js";
import * as z from "zod";

const bigModel = new ChatMistralAI({
  model: "mistral-medium-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});

const samllModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});

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
});

export const generateResponse = async (messages) => {
  const response = await agent.invoke({
    messages: [
      new SystemMessage(`You are a helpful and precise assistant for answering questions.
      If you don't know the answer, say you don't know. 
      If the question requires up-to-date information, use the "searchInternet" tool to get the latest information from the internet and then answer based on the search results.`),

      ...messages.map((msg) => {
        if (msg.role === "user") {
          return new HumanMessage(msg.content);
        } else if (msg.role === "ai") {
          return new HumanMessage(msg.content);
        }
      }),
    ],
  });
  return response.messages[response.messages.length - 1].text;
};

export const generateTitle = async (messages) => {
  const response = await samllModel.invoke([
    new SystemMessage(`You are a helpful assistant that generates concise and descriptive     titles for chat conversations.
            
        User will provide you with the first message of a chat conversation, and you will generate a title that captures the essence of the conversation in 2-4 words. The title should be clear, relevant, and engaging, giving users a quick understanding of the chat's topic. `),
    new HumanMessage(`
          Generate a title for a chat conversation based on the following first message:
          "${messages}"
        `),
  ]);
  return response.text;
};
