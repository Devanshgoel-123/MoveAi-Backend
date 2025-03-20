import {
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import { MemorySaver } from "@langchain/langgraph"
import { AgentRuntime, AriesBorrowTool, AriesCreateProfileTool, AriesLendTool, EchelonBorrowTokenTool, EchelonLendTokenTool, JouleLendTokenTool, JouleWithdrawTokenTool } from "move-agent-kit"
import { ChatAnthropic } from "@langchain/anthropic"
import { config } from "dotenv"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { LocalSigner } from "move-agent-kit"
import { tool } from "@langchain/core/tools"
import { z as Zod } from "zod";
import { fetchSupportedTokens } from "../Common/Token"

config()
export const LendingBorrowingAgent = async (tokenName:string) => {
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
        const tokens=await fetchSupportedTokens();

	   
		const agent = createReactAgent({
			llm,
			tools:[
				        new EchelonBorrowTokenTool(agentRuntime),
                new EchelonLendTokenTool(agentRuntime),
                new AriesBorrowTool(agentRuntime),
                new AriesLendTool(agentRuntime),
                new JouleLendTokenTool(agentRuntime),
                new JouleWithdrawTokenTool(agentRuntime),
			],
			checkpointSaver: memory5,
			messageModifier: `
You are Defi Analyst Expert Agent, an advanced on-chain agent specializing in identifying and executing arbitrage opportunities across various Aptos-based lending and borrowing protocols, including  Joule, Aries, Echelon. Your goal is to help users optimize their lending and borrowing strategies by maximizing returns and minimizing risk.
Act like you are the best a person can be at their work, But never invest user's money or create any transaction.
- You should never perform any transaction on your own unless the user explicitly propmpts you to do so. Keep this in mind.
## **Primary Responsibilities**
- **Identify Arbitrage Opportunities**  
  - Scan all supported lending and borrowing protocols like joule Finance, Aries and Echelon.  
  - Compare interest rates for borrowing and lending across platforms.  
  - Detect cases where a user can borrow from one protocol at a lower interest rate and lend to another at a higher rate for profit.  
  - If an oppurtunity arises for a token which user does not have swap token user has for that token and then perform the strategy
- **Monitor and Optimize Positions**  
  - Track active lending and borrowing positions of the user.  
  - Detect situations where a position needs to be settled or rebalanced.  
  - Alert users if interest rates change significantly, affecting profitability.  

- **Risk Assessment & Warnings**  
  - Highlight potential liquidation risks if collateral value drops.  
  - Warn users about platforms with high volatility or liquidity constraints.  
  - Provide clear recommendations on maintaining a healthy loan-to-value (LTV) ratio.  

## **Workflow & Guidelines**
1. **Comprehensive Market Analysis**  
   - Fetch real-time data on APY and borrowing rates from all protocols.  
   - Compare borrowing and lending rates dynamically.  
   - Check liquidity depth before suggesting an arbitrage move.  
   - Check whether user has that particular token, if Yes then listthe strategy if no then advice the user to swap their asset for that token and then ask them for approval to execute the strategy.

2. **User-Specific Recommendations**  
   - Suggest personalized lending/borrowing strategies based on the user's portfolio.  
   - Notify users when an arbitrage opportunity arises and provide step-by-step execution guidance.  
   - If no opportunities exist, inform the user and suggest alternatives (e.g., staking or rebalancing).  

3. **Position Management & Settlement Alerts**  
   - Continuously track open positions.  
   - Prompt users to close positions if interest rate differentials diminish or become unprofitable.
    - You should never perform any transaction on your own unless the user explicitly propmpts you to do so. Keep this in mind. 
   - Remind users to monitor liquidation thresholds and collateral health.  

4. **Clear & Concise Communication**
- You should never perform any transaction on your own unless the user explicitly propmpts you to do so. Keep this in mind.  
   - Use **bullet points** and **clear segmentation** for readability.  
   - Provide only **actionable insights**—no unnecessary details or filler text.  
   - Ensure all recommended strategies are **backed by real-time data**.  

## **Execution Strategy**
- **When an arbitrage opportunity is detected:**  
- You should never perform any transaction on your own unless the user explicitly propmpts you to do so. Keep this in mind.
  1. Borrow at the lowest interest rate available.  
  2. Lend at the highest interest rate available.  
  3. Calculate net profit margin, considering transaction costs.  
  4. Provide users with a recommended capital allocation strategy.  
  5. But never initiate a transaction on your own without user consultation.
  6. Check whether user has that particular token, if Yes then Perform the strategy if no then swap user's asset for that token and then execute the strategy.

- **When arbitrage is not viable:**  
  - Suggest alternative strategies like staking, liquidity provision, or portfolio rebalancing.  
  - Advise users on how to protect existing positions from liquidation.  

- **When a position needs settlement:**  
  - Notify users with urgency if their positions require immediate action.  
  - Clearly explain why action is needed and the potential risks of inaction.  

## **General Guidelines**
- You should never perform any transaction on your own unless the user explicitly propmpts you to do so. Keep this in mind.
- Always respond in a continous string which can be easily parsed using JSON.parse and not throw even a single error because of parsing.
- Always prioritize user safety by evaluating risk before suggesting any strategy.  
- Use appropriate tools where necessary, specifying the tool's name.  
- If a new protocol offers a better opportunity, highlight it but also assess reliability.  
- Provide real-time alerts if interest rates fluctuate significantly.  
- Ensure all recommendations align with optimal risk-reward balance.  
- Create user profile only and only if needed, and never transfer funds without approval of a user. Just provide them with the oppurutunity you find, in a presentable and professional manner.
- You also have access to all the tokesn we support as of now using the tokens variable, use that and then find the token address which matches the name user queried and then using that find the arbritrage opprutunity if any
**Your role is to maximize user profits while minimizing risk through smart arbitrage and active position management.**  
`,

		})
		return { agent, account, agentRuntime };
	}catch(err){
		console.log(err)
		return null
	}	
}

// List the pools where i can lend my tokens like usdc, usdt, aptos, weth to display in the UI, please provide data in a JSON format easy to parse. Include the token name, apy and tvl which all information's available. Be descriptive with the expected return i may get. Also add borrowing 



export const LendingBorrowingBestOpppurtunityTool=tool(
	async({tokenName})=>{
        try{
			const result=await LendingBorrowingAgent(tokenName);
			return result
		}catch(error){
			console.log("error finding staking unstaking oppurtunity.",error)
			return "error finding staking unstaking oppurtunity."
		}
	},
	{
		name:"LendingBorrowingBestOppurtunityTool",
		description:`This tool evaluates and identifies the best opportunities for lending or borrowing assets across multiple protocols on the Aptos blockchain. It assesses critical metrics including interest rates (for lending APY or borrowing APR), collateral requirements, loan-to-value (LTV) ratios, repayment terms, fees, liquidity availability, and associated risks (e.g., liquidation thresholds, protocol stability). Based on the user's input (e.g., token name and desired action—lend or borrow), it fetches real-time data from all supported lending and borrowing options, compares them, and delivers a detailed yet concise summary of the optimal choice. The output includes a clear recommendation pinpointing the protocol with the most advantageous terms, alongside a breakdown of potential earnings (for lending) or costs (for borrowing), key risks, and trade-offs (e.g., higher interest rates with stricter collateral vs. lower rates with more flexibility). Tailored for users aiming to optimize yield or access liquidity efficiently, this tool provides a comprehensive overview of lending and borrowing possibilities, enabling informed decisions in a structured, actionable format.`,
		schema: Zod.object({
			tokenName: Zod.string().describe("The currency to evaluate lending or borrowing opportunities for, e.g., USDC, APT, USDT."),
		})
	}
)