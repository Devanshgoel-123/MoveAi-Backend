import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import dotenv from "dotenv";
dotenv.config()
export const DEFAULT_STABLE = 50;
export const DEFAULT_NATIVE = 30;
export const DEFAULT_OTHER = 30;
export const ACCOUNT_ADDRESS = "0x5bafe2c53415743947065e902274f85e6300e9fb27d21bc29c2ce217ea0b37c2";

export const DAPP_LOGO="https://images.scalebranding.com/cute-robot-logo-2c42937a-c1fe-493a-b639-d22a0b5f4671.png";

export const config = { 
    configurable: { 
      thread_id: `aptos-agent-1` 
    } 
  };


// export const llm = new ChatAnthropic({
// 			model: "claude-3-5-sonnet-latest",
// 			anthropicApiKey: process.env.ANTHROPIC_API_KEY,
// 		})
  export const llm=new ChatGoogleGenerativeAI({
      model:"gemini-2.0-flash",
      apiKey:`${process.env.GEMINI_API_KEY}`,
      maxRetries:2
    })