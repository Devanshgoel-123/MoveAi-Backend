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
import dotenv, { decrypt } from "dotenv"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { EchelonBorrowTokenTool, EchelonWithdrawTokenTool, JouleBorrowTokenTool, JouleLendTokenTool, JouleWithdrawTokenTool, LocalSigner, PanoraSwapTool } from "move-agent-kit"
import { MemorySaver } from "@langchain/langgraph"
import { HumanMessage } from "@langchain/core/messages"
import express, { Router,Request,Response } from "express";
import { AgentRuntime } from "move-agent-kit"
import { Claudellm } from "../Components/Common/Constants"
import { UserPositionTool } from "../Tools/UserPostionTool"
import { decryptPrivateKey } from "./Wallet"
dotenv.config()

export const userPositionRouter:Router=express.Router();

export const UserPostionAnalysisAgent = async (key:string,accountAddress:string) => {
	try{
		const aptosConfig = new AptosConfig({
			network: Network.MAINNET,
		})
    const AccountAddress=accountAddress
		const aptos = new Aptos(aptosConfig)
		const account = await aptos.deriveAccountFromPrivateKey({
			privateKey: new Ed25519PrivateKey(
				PrivateKey.formatPrivateKey(`${key || process.env.PRIVATE_KEY}`, PrivateKeyVariants.Ed25519)
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
        new PanoraSwapTool(agentRuntime)
      ],
			checkpointSaver: memory5,
messageModifier: `
  The agent's primary goal is to analyze the user's positions on supported protocols and suggest necessary actions if required. Follow these rules:
  
  - Use the **UserPositionTool** to fetch market data and the user's positions across protocols use the account address as ${AccountAddress}.
  - Only support **USDC, USDT, WETH, APT, and THL** tokens. Do not recommend any other tokens for yield opportunities.
  - Provide a **concise** but **complete** response for every action.
  - If the user greets you then respond normally 
  **Steps to Follow:**
  1. **Analyze User Positions**: Evaluate the user's holdings using **UserPositionTool**.
  2. **Identify Risky or Loss-Making Positions**: If a position is inefficient or causing a loss, suggest moving assets.
  3. **Recommend Necessary Transactions**:
     - If assets should be moved, specify **transaction details**.
     - Suggest better lending/borrowing alternatives if available.
     - If asset conversion is beneficial, recommend swapping tokens before reinvesting.
  4. **Answer Any User Queries**: If the user asks a general question, respond accurately while maintaining context.
  5. **Execute Token Swaps (if required)**:
     - If a swap is necessary, ask for **user confirmation** before proceeding.
     - Use **PanoraSwapTool** to execute the swap.

  **Response Format (Always in JSON):**
  \`\`\`json
  {
    "analysis": "<Brief summary of the user's financial position>",
    "recommendedAction": {
      "actionRequired": <true/false>,
      "transactionDetails": "<Short description of the suggested transaction>",
      "justification": "<Reasoning behind the recommendation>",
      "netProfit": "<Estimated net profit from the transaction>"
    },
    "userQueryResponse": "<Response to any general query>",
    "swap": [
      {
        "from": "<Token1>",
        "to": "<Token2>",
        "amount": <Amount of Token1 to swap>
      }
    ]
  }
  \`\`\`

  **Important Rules:**
  - **Only suggest transactions if necessary**. Do not recommend swaps or lending unless they improve the user's position.
  - Always **ask for confirmation** before swapping tokens.
  - Keep the response **structured**, **clear**, and **actionable** while avoiding unnecessary details.
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
        const {
          agentWalletAddress,
          agentKey,
          message
        }=req.body;
        const privateKey=decryptPrivateKey(agentKey)
        const agentCache=await UserPostionAnalysisAgent(`${privateKey}`,agentWalletAddress.toString())
        
          if(agentCache===null){
                return res.status(400).json({ error: "Please fund the wallet to initialise the agent with your key" });
          }
          const { agent } = agentCache;
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
