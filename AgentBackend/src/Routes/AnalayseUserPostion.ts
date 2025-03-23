import {
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	HexInput,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import { config } from "../Components/Common/Constants"
import dotenv from "dotenv"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { EchelonBorrowTokenTool, EchelonWithdrawTokenTool, JouleBorrowTokenTool, JouleLendTokenTool, JouleWithdrawTokenTool, LocalSigner } from "move-agent-kit"
import { MemorySaver } from "@langchain/langgraph"
import { HumanMessage } from "@langchain/core/messages"
import express, { Router,Request,Response } from "express";
import { AgentRuntime } from "move-agent-kit"
import { Claudellm } from "../Components/Common/Constants"
import { UserPositionTool } from "../Tools/UserPostionTool"
dotenv.config()

export const userPositionRouter:Router=express.Router();

export const UserPostionAnalysisAgent = async () => {
	try{
		const aptosConfig = new AptosConfig({
			network: Network.MAINNET,
		})
		const aptos = new Aptos(aptosConfig)
		const account = await aptos.deriveAccountFromPrivateKey({
			privateKey: new Ed25519PrivateKey(
				PrivateKey.formatPrivateKey(`${process.env.PRIVATE_KEY}`, PrivateKeyVariants.Ed25519)
			),
		})
		const signer = new LocalSigner(account, Network.MAINNET)
		const agentRuntime = new AgentRuntime(signer, aptos,{
			PANORA_API_KEY: "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi",
		})
		
		const memory5 = new MemorySaver()
	   const llm=Claudellm;
		const agent = createReactAgent({
      llm,
      tools: [
        UserPositionTool,
        new EchelonBorrowTokenTool(agentRuntime),
        new EchelonWithdrawTokenTool(agentRuntime),
        new JouleBorrowTokenTool(agentRuntime),
        new JouleLendTokenTool(agentRuntime),
        new JouleWithdrawTokenTool(agentRuntime),
      ],
			checkpointSaver: memory5,
            messageModifier:`
    The agent's primary goal is to analyze the user's positions on supported protocols and suggest necessary actions if required. Follow these rules:
     Use the UserPositionTool to get the market Data, the user Position on various Protocols and then perform the following
    1. **Analyze User Positions**: Evaluate the user's holdings on supported protocols using the **UserPositionTool**.
    2. **Identify Risky or Loss-Making Positions**: If a position is causing a loss or is inefficient, suggest moving assets.
    3. **Recommend Necessary Transactions**:
       - If assets should be moved, specify the transaction details.
       - Suggest a better staking/lending/borrowing alternative if available.
       - If asset conversion is beneficial, recommend swapping to another token before reinvesting.
    4. **Answer Any User Queries**: If the user asks a general query, respond accurately while maintaining context.

    The response should always be structured in the following JSON format:
    \`\`\`json
    {
      "analysis": "<brief summary of the user's financial position>",
      "recommendedAction": {
        "actionRequired": <true/false>,
        "transactionDetails": "<description of the suggested transaction>",
        "justification": "<reasoning behind the recommendation>"
      },
      "userQueryResponse": "<response to any general query>"
    }
    \`\`\`
    
    Only suggest transactions if they are necessary. Keep recommendations clear and actionable while avoiding unnecessary details.
  `
		})
		return { agent, account, agentRuntime };
	}catch(err){
		console.log(err)
		return null
	}	
}

userPositionRouter.post("/", async (req: Request, res: Response):Promise<any> => {
    try {
        const agentCache = await UserPostionAnalysisAgent()
        
          if(agentCache===null){
                return res.status(400).json({ error: "Message is required" });
          }
          const { agent } = agentCache;
          const { message } = req.body;
          console.log("the message is:",message)
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
          let answer={
            agentResponse:""
          };
          let isParsed=false;
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
            agentResponse:true,
            isParsed:isParsed
           })
        } catch (error) {
            console.error("Agent execution error:", error);
            return res.status(500).json({ error: "Failed to process request", details: error });
        }
})
