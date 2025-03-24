import {
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	HexInput,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import { llm } from "../Components/Common/Constants"
import { config } from "../Components/Common/Constants"
import { AgentRuntime, AptosGetTokenDetailTool, AptosGetTokenPriceTool, EchelonBorrowTokenTool, EchelonLendTokenTool, JouleBorrowTokenTool, JouleLendTokenTool, PanoraSwapTool } from "move-agent-kit"
import dotenv from "dotenv"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { LocalSigner } from "move-agent-kit"
import { PortfolioRebalancerTool } from "../Tools/PortfolioManager"
import { MemorySaver } from "@langchain/langgraph"
import { HumanMessage } from "@langchain/core/messages"
import { GetUserDiversificationPreferenceTool } from "../Tools/PortfolioDiversificationTool"
import { AptosBalanceTool, AptosAccountAddressTool } from "move-agent-kit"
import { FetchTokenPriceInUsdTool } from "../Tools/FetchTokenPriceTool"
import { Find24HChangeTool } from "../Tools/VolatilityTool"
import { GetLatestTransactionsTool, GetTransactionDetailTool } from "../Tools/GetTransactionTool"
import { YieldOptimizationTool } from "../Components/Agents/BestYieldOptimisingAgent"
import { LendingBorrowingBestOpppurtunityTool } from "../Components/Agents/LendBorrowAgent"
import express, { Router,Request,Response } from "express";
import { StakingUnstakingBestOpppurtunityTool } from "../Components/Agents/StakeUnstakeAgent"
import { Claudellm } from "../Components/Common/Constants"
import { decryptPrivateKey } from "./Wallet"
dotenv.config()
export const agentRouter:Router=express.Router();
export const InitializeAgent = async ({
  key
}:{
  key:string
}) => {
	try{

		const aptosConfig = new AptosConfig({
			network: Network.MAINNET,
		})
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
    const llm=Claudellm
		const memory5 = new MemorySaver()
		const agent = createReactAgent({
      llm,
      tools: [
        PortfolioRebalancerTool,
        GetUserDiversificationPreferenceTool,
        FetchTokenPriceInUsdTool,
        Find24HChangeTool,
        GetLatestTransactionsTool,
        GetTransactionDetailTool,
        YieldOptimizationTool,
        LendingBorrowingBestOpppurtunityTool,
        StakingUnstakingBestOpppurtunityTool,
        new PanoraSwapTool(agentRuntime),
        new AptosGetTokenDetailTool(agentRuntime),
        new AptosGetTokenPriceTool(agentRuntime),
        new AptosBalanceTool(agentRuntime),
        new AptosAccountAddressTool(agentRuntime),
        new JouleLendTokenTool(agentRuntime),
        new EchelonLendTokenTool(agentRuntime),
        new EchelonBorrowTokenTool(agentRuntime),
        new JouleBorrowTokenTool(agentRuntime)
      ],
			checkpointSaver: memory5,
messageModifier: `
		You are an intelligent on-chain agent that interacts with the Aptos blockchain via the Aptos Agent Kit.
		Your capabilities include fetching token details, checking prices, identifying arbitrage opportunities, 
		rebalancing portfolios, fetch the latest transactions, and retrieving pool details using specialized tools.
    You only Support assets like usdc, usdt, apt, weth, thl and no other asset.
    For the protocols you have access to only Joule Finance and Echelon Markets no other protocol should be used.
    Never List the tool you have if any information is missiing ask the user for it like the transaction hash or anything.
		**Guidelines:**
		- Use **UserPortfolioTool** to fetch user token balances, then find the best strategies using **YieldOptimizationTool**.
		- **NEVER perform a transaction** unless the user explicitly requests it.
		- When calling **YieldOptimizationTool**, return its response **as is** without summarization.
    - You can fetch the price of a token using **AptosGetTokenPriceTool**.
    - You can always swap asset when users asks you to using the **PanoraSwapTool**.
		- If the user asks for **24H change or % change**, call **Find24HChangeTool**.
		- For transactions, **wait for completion** before returning the transaction hash.
		- Use **GetLatestTransactionsTool** for recent Aptos blockchain transactions.
		- Use **GetTransactionDetailTool** for details of a specific transaction.
		- If no tool exists for an action, inform the user and suggest creating it with Aptos Agent Kit.
		- For **5XX HTTP errors**, advise retrying later.
		- Provide complete, accurate, and **concise responses** without tool details unless asked.
	`,
		})
		return { agent, account, agentRuntime };
	}catch(err){
		console.log("facing the error at agent,",err)
		return null
	}	
}

agentRouter.post("/", async (req: Request, res: Response):Promise<any> => {
    try {
      const { message,agentKey } = req.body;
      console.log(agentKey)
       const privateKey=decryptPrivateKey(agentKey);
        const agentCache = await InitializeAgent({
          key:privateKey
        })
          if(agentCache===null){
                return res.status(400).json({ error: "Please fund your wallet so that we can go ahead with your query" });
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
