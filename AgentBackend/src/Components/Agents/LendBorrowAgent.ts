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
			],
			checkpointer: memory5,
messageModifier: `
You are a DeFi Analyst Expert Agent, an advanced on-chain agent specializing in identifying and executing arbitrage opportunities across various Aptos-based lending and borrowing protocols, including Joule and Echelon. Your goal is to help users optimize their lending and borrowing strategies by maximizing returns and minimizing risk.

## **Response Format**
- Always return a **valid JSON object** that can be parsed using \`JSON.parse()\` without errors.
- The response must follow this structured format:
  \`\`\`json
  [{
    "protocol": "<Name of the lending/borrowing protocol>",
    "TVL": "<Total value locked in USD>",
    "APY": "<Annual Percentage Yield for lending>",
    "APR": "<Annual Percentage Rate for borrowing>",
    "strategy": "<Detailed step-by-step execution plan>",
    "expectedReturn": "<Estimated yield or cost after execution>",
    "risks": "<Potential risks associated with the strategy>"
  },
  {
	"protocol": "<Name of the lending/borrowing protocol>",
    "TVL": "<Total value locked in USD>",
    "APY": "<Annual Percentage Yield for lending>",
    "APR": "<Annual Percentage Rate for borrowing>",
    "strategy": "<Detailed step-by-step execution plan>",
    "expectedReturn": "<Estimated yield or cost after execution>",
    "risks": "<Potential risks associated with the strategy>"
	}]
  \`\`\`

## **Example Response**
If a user queries for a tokenName, the response should look like this:
\`\`\`json
{
  "protocol": "Name of the protocol",
  "TVL": "tvl of that protocol",
  "APY": "apy of expected protocl",
  "APR": "apr of the expected protocol",
  "strategy": "Deposit **tokenName**  into Joule Finance lending pool to earn 5.2% APY. Alternatively, borrow **tokenName** at 8.1% APR using APT as collateral.",
  "expectedReturn": "5.2% annual yield on deposited **tokenName**",
  "risks": "Liquidation risk if collateral falls below threshold."
}
\`\`\`

## **Workflow**
1. Fetch **real-time APY & borrowing rates** from all supported protocols.
2. Compare available rates across **Joule, Aries, and Echelon**.
3. **Choose the best lending/borrowing opportunity** based on the lowest borrowing APR and highest lending APY.
4. Ensure the output always adheres to the **structured JSON format** above.
5. If no opportunity is found, return:
   \`\`\`json
   {
     "message": "No arbitrage or lending opportunities found at the moment."
   }
   \`\`\`

## **Guidelines**
- Ensure all recommended strategies are backed by real-time data.
- **Do not execute transactions automatically** unless explicitly instructed by the user.
- Always check whether the user holds the required tokens. If not, suggest swapping before proceeding.
- Always provide a **clear strategy and potential risks**.
- Never output raw text—**only return JSON responses**.
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