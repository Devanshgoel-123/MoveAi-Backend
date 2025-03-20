
import axios from "axios";
import express from "express";
import dotenv from "dotenv";
import { LendingBorrowingAgent } from "../Components/Agents/LendBorrowAgent";
import { Request,Response } from "express";
import { config } from "../Components/Common/Constants";
import { HumanMessage } from "@langchain/core/messages";
dotenv.config()
export const LendingBorrowingRouter=express.Router();

 LendingBorrowingRouter.post("/:tokenName",async (req: Request, res: Response):Promise<any> => {
    try {
        const { tokenName } = req.params;
        const { message } = req.body;
        if (!tokenName) {
            return res.status(400).json({ error: "Please provide a token name" });
        }
        
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const agentCache = await LendingBorrowingAgent(tokenName);
        if (!agentCache) {
            return res.status(500).json({ error: "Failed to answer your query" });
        }
        const { agent } = agentCache;
       
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        } 
          const response = [];
          
          const stream = await agent.stream(
            {
              messages: [new HumanMessage(message)],
            },
            config
          );
      
          for await (const chunk of stream) {
            if ("agent" in chunk) {
              response.push({
                type: "agent",
                content: chunk.agent.messages[0].content
              });
            } else if ("tools" in chunk) {
              response.push({
                type: "tools",
                content: chunk.tools.messages[0].content
              });
            }
          }
          const finalLength=response.length;
          console.log("the response is",response)
          let answer;
          let isParsed;
           try {
             answer = JSON.parse(response[finalLength - 1].content);
             isParsed=true;
             console.log(answer)
             console.log("case 1",typeof answer)
           } catch (error) {
            console.error("JSON parsing error:", error);
            isParsed = false;
            let tempString = response[finalLength - 1].content;
            const match = tempString.match(/\{.*\}/s); 
            if (match) {
                try {
                    const extractedJSON = JSON.parse(match[0]); 
                    console.log("the new answer is:", extractedJSON.agentResponse);
                    answer = extractedJSON;
                } catch (error) {
                    console.error("Invalid JSON:", error);
                    answer = { agentResponse: tempString }; 
                }
            } else {
                answer = { agentResponse: tempString }; 
            }
            console.log("case 2", typeof answer);
            console.log("the answer is:", answer);
           }
           return res.json({
            data:answer || "I am really sorry we couldn't process your request at the moment. \n Please Try Again Later",
           })
        } catch (error) {
          console.error("Agent execution error:", error);
          return res.status(500).json({ error: "Failed to process request", details: error });
        }
 })