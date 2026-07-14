import { ChatMistralAI } from "@langchain/mistralai";
import { createAgent, HumanMessage, tool } from "langchain";
import { tavilySearch } from "./index.js";
import * as z from "zod";
import readline from "readline/promises";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const model = new ChatMistralAI({
  model: "mistral-small-latest",
});

const searchTool = tool(
    tavilySearch,
    {
        name:"Web_Search_tool",
        description: "This tool searches the web",
        schema:z.object({
            query:z.string().describe("This is the query.")
        })
    }
);

const agent=createAgent({
    model,
    tools: [searchTool]
})

let messages = [];

while (true) {
  const userInput = await rl.question("You: ");
  messages.push(new HumanMessage(userInput));

  const response = await agent.invoke({ messages });

  messages.push(response.messages[response.messages.length-1])

  console.log("AI: " , response.messages[response.messages.length-1].content,  { depth: null });
}

rl.close();
