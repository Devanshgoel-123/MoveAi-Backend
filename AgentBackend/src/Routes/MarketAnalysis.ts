import {
	AccountAddress,
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	HexInput,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import { MemorySaver } from "@langchain/langgraph";
import { AgentRuntime, AptosAccountAddressTool, AptosGetTokenPriceTool, EchoStakeTokenTool, JouleGetPoolDetails, ThalaStakeTokenTool } from "move-agent-kit"
import { ChatAnthropic } from "@langchain/anthropic"
import dotenv from "dotenv"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { LocalSigner } from "move-agent-kit"
import { fetchSupportedTokens, fetchTokenPriceInUsd, getFearGreedIndex } from "../Components/Common/Token";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { CoinGeckoId } from "../Types";
import { getHistoricalPrice } from "../Components/Functions/PriceHistory";
import express from "express";
import { Request,Response } from "express";
import { getTokenAmountOwnedByAccount } from "../Components/Common/Token";
import { ACCOUNT_ADDRESS } from "../Components/Common/Constants";
dotenv.config()

export const MarketAnalysisRouter=express.Router()

MarketAnalysisRouter.get("/:tokenName",async (req:Request,res:Response):Promise<any>=>{
    try {
        const { tokenName } = req.params;
        const {
          agentWalletAddress,
        }=req.query;
        
        if(agentWalletAddress===undefined){
          return res.json({
            data:"I am really sorry we couldn't process your request at the moment. \n Please Connect Your Wallet",
            agentResponse:false,
           })
        }
        const token=(await fetchSupportedTokens()).filter((item)=>item.name.toLowerCase()===tokenName?.toLowerCase())[0]
        console.log(token)
        let tokenId=undefined;
 if(tokenName.toLowerCase()==="usdc"){
   tokenId=CoinGeckoId["usdc"]
 }else if(tokenName.toLowerCase()==="aptos" || tokenName.toLowerCase()==="apt"){
   tokenId=CoinGeckoId["aptos"]
 }else if(tokenName.toLowerCase()==="usdt"){
    tokenId=CoinGeckoId['usdt']
 }else if(tokenName.toLowerCase()==="weth"){
   tokenId=CoinGeckoId["weth"]
 }else{
   tokenId=CoinGeckoId['thala']
 }
  console.log(tokenId)
        const priceData = await getHistoricalPrice(tokenId);
        const historicalPrices = priceData.map((item: [number, number]) => item[1]);
        const tokenPriceUsd = await fetchTokenPriceInUsd(token.token_address);
        const {
           value,
           value_classification
        }=await getFearGreedIndex()
        
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
           const tokenAmount = (await getTokenAmountOwnedByAccount(agentWalletAddress?.toString(), token.token_address))/(10**token.decimals);
           const agent = createReactAgent({
               llm,
               tools:[
                   new AptosGetTokenPriceTool(agentRuntime),
                   new AptosAccountAddressTool(agentRuntime),
                   new JouleGetPoolDetails(agentRuntime),
               ],
               checkpointSaver: memory5,
              messageModifier: `
              You are an expert DeFi Analyst Agent specializing in cryptocurrency analysis on the Aptos blockchain. Your purpose is to deliver precise, structured, and actionable insights on token performance that will directly benefit users making investment decisions.
              
              Guidelines:
              - Analyze key metrics: Total Value Locked (TVL), Market Capitalization, Liquidity, and Volume.
              - Thoroughly scan all major Aptos protocols ( Joule, Echelon only) where users can generate yield through staking, lending, or liquidity provision for ${tokenName}.
              - For each protocol, provide specific details on:
                * Current APY/APR rates for staking or liquidity pools
                * Lock-up periods and unstaking timeframes
                * Any rewards or additional tokens earned
                * Fee structures that might impact returns
                * Protocol-specific risks (smart contract risk, impermanent loss potential)
              - Calculate a Risk Score (0-100) by combining the Fear and Greed Index value (${value}) with liquidity and volatility metrics. Classify as Low (0-30), Moderate (31-60), or High (61-100).
              - Provide a data-backed recommendation on whether to hold, sell, or stake the token.
              - Compare staking opportunities across protocols to identify the best risk-adjusted returns suggesting the name of protocols and the percentage to allocate to that protocol.
              - Use the user's current balance of ${tokenAmount} ${tokenName} to provide personalized yield projections.
              - Never predict specific future prices, but analyze recent price action for relevant insights.
              - Present concrete data rather than vague statements or generic advice.
              
              IMPORTANT: Format your response for direct display on frontend:
              1. Use markdown formatting with # and ## for headers
              2. Use bullet points (•) for lists 
              3. Add clear section breaks between major segments
              4. Include spacing for readability
              5. Use bold for important values like risk score, user balance
              6. Organize information hierarchically with visual structure
              7. Keep formatting consistent throughout
              
              Response Format (include everything in JSON format):
              When formatting the agentResponse, replace placeholders with actual values and ensure all line breaks (\\n) are included for proper frontend rendering. The agentResponse field should contain the complete, formatted analysis ready for direct display.
              `
           })
           const response=[];
           const config = { 
               configurable: { 
                 thread_id: `aptos-agent-1` 
               } 
             };
           const stream = await agent.stream(
               {
                 messages: [
                   new HumanMessage(
                        `Give me a detailed analysis of ${tokenName}. Provide:
           - Token price: ${tokenPriceUsd} USD
           - Market capitalization, TVL, and liquidity
           - Risk score and classification (${value} - ${value_classification})
           - Historical performance insights
           - Should I hold, sell, or swap this token?
                       `),
                 ],
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
              agentResponse:true,
              isParsed:isParsed,
             })
        } catch (error) {
       console.log(error)
     return res.status(500).json({
        message:"Error performing the Market Analysis of the token "
     })
   }
})