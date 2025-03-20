import { NextRequest, NextResponse } from "next/server";
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
import { AgentRuntime, AptosAccountAddressTool, AptosGetTokenPriceTool } from "move-agent-kit"
import { ChatAnthropic } from "@langchain/anthropic"
import { config } from "dotenv"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { LocalSigner } from "move-agent-kit"
import { fetchSupportedTokens, fetchTokenPriceInUsd, getFearGreedIndex } from "@/Components/Backend/Common/Token";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { CoinGeckoId } from "@/Components/Backend/Types";
import { getHistoricalPrice } from "@/Components/Backend/Functions/PriceHistory";
import { ACCOUNT_ADDRESS } from "@/Components/Backend/Common/Constants";
config()

export async function GET(request: NextRequest) {
	try {
         const tokenName = request.nextUrl.searchParams.get("tokenName") || "usdc";
		 console.log(tokenName)
		 console.log(await fetchSupportedTokens())
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
		    // console.log(await agentRuntime?.getUserAllPositions(ACCOUNT_ADDRESS as unknown as AccountAddress))
		    // console.log(await agentRuntime?.getPoolDetails(token.token_address))
			// console.log(await agentRuntime.getTokenByTokenName(tokenName))
			const agent = createReactAgent({
				llm,
				tools:[
					new AptosGetTokenPriceTool(agentRuntime),
					new AptosAccountAddressTool(agentRuntime),
				],
				checkpointSaver: memory5,
				messageModifier: `
				 You are an expert DeFi Analyst Agent specializing in cryptocurrency analysis.
        Your purpose is to provide structured, detailed insights on token performance.
		use historical Prices also for market analysis ${historicalPrices}
        
        Guidelines:
        - Focus on key metrics: TVL, Market Cap, Risk Score, Liquidity.
        - Never predict future prices.
        - Offer risk assessments based on historical trends.
        - If the token is high risk, suggest stablecoin hedging but do not take action.
        - Ensure responses are structured, professional, and readable.
				`,
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
			  return NextResponse.json({
			   data:answer || "I am really sorry we couldn't process your request at the moment. \n Please Try Again Later",
			   agentResponse:true,
			   isParsed:isParsed,
			   position:agentRuntime?.getUserAllPositions(ACCOUNT_ADDRESS as unknown as AccountAddress),
			   detailsPool:agentRuntime?.getPoolDetails(token.token_address)
			  })
		 } catch (error) {
		console.log(error)
	  return NextResponse.json(
		{ error: "Failed to process request", details: error},
		{ status: 500 }
	  );
	}
  }
  