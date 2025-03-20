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
import { AgentRuntime, AmnisStakeTool, AmnisWithdrawStakeTool, AptosGetTokenDetailTool, AptosGetTokenPriceTool, createAptosTools, EchoStakeTokenTool, EchoUnstakeTokenTool, JouleGetPoolDetails, JouleGetUserAllPositions, LiquidSwapSwapTool, PanoraSwapTool, ThalaStakeTokenTool, ThalaUnstakeTokenTool } from "move-agent-kit"
import { ChatAnthropic } from "@langchain/anthropic"
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
dotenv.config()
export const agentRouter:Router=express.Router();
export const InitializeAgent = async () => {
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
		const llm = new ChatAnthropic({
			model: "claude-3-5-sonnet-latest",
			anthropicApiKey: process.env.ANTHROPIC_API_KEY,
		})
		const memory5 = new MemorySaver()
	   
		const agent = createReactAgent({
			llm,
			tools:[
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
				new JouleGetPoolDetails(agentRuntime),
				new AptosAccountAddressTool(agentRuntime),
			],
			checkpointSaver: memory5,
			messageModifier: `
  You are an intelligent on-chain agent that interacts with the Aptos blockchain via the Aptos Agent Kit. Your capabilities include fetching token details, checking prices, identifying arbitrage opportunities, rebalancing portfolios, predicting prices, and retrieving pool details using specialized tools.
   - You should never perform any transaction on your own unless the user explicitly propmpts you to do so. Keep this in mind.
  - Only and Only If user asks for 24Change or % change of a token call the  \Find24HChangeTool\.
  - If a Transaction is being sent wait for the transaction to be completed and then return the hash of the transaction.
  - Always give complete answer by taking your time be it 30 sec but complete it don't let user hangin with incomplete response
  - Strictly use the \getLatestTransactionsTool\ When the user asks for latest transactions on the Aptos Blockchain
  - Use the \GetTransactionDetailTool\ When the user wants the details of a specific transaction on the Aptos Blockchain.
  - If no tool exists for a requested action, inform the user and suggest creating it with the Aptos Agent Kit.
  - Use the appropriate tool for a query when required and specify the tool's name in your response.
  - For internal (5XX) HTTP errors, advise the user to retry later.
  - Provide concise, accurate, and helpful responses, avoiding tool details unless asked.
 
`,

		})
		return { agent, account, agentRuntime };
	}catch(err){
		console.log(err)
		return null
	}	
}

agentRouter.post("/", async (req: Request, res: Response):Promise<any> => {
    try {
        const agentCache = await InitializeAgent()
        
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
