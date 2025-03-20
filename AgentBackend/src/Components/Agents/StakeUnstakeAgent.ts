
import {
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import { MemorySaver } from "@langchain/langgraph"
import { FetchTokenPriceInUsdTool } from "../../Tools/FetchTokenPriceTool"
import { AgentRuntime, AmnisStakeTool, AmnisWithdrawStakeTool, AptosGetTokenDetailTool, AptosGetTokenPriceTool, createAptosTools, EchoStakeTokenTool, EchoUnstakeTokenTool, JouleGetPoolDetails, JouleGetUserAllPositions, LiquidSwapSwapTool, PanoraSwapTool, ThalaAddLiquidityTool, ThalaRemoveLiquidityTool, ThalaStakeTokenTool, ThalaUnstakeTokenTool } from "move-agent-kit"
import { ChatAnthropic } from "@langchain/anthropic"
import { config } from "dotenv"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { LocalSigner } from "move-agent-kit"
import { tool } from "@langchain/core/tools"
import { z as Zod } from "zod";
config()
export const StakeUnstakeAgent = async (tokenName:string) => {
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
				new JouleGetPoolDetails(agentRuntime),
				new JouleGetUserAllPositions(agentRuntime),
				new EchoStakeTokenTool(agentRuntime),
				new EchoUnstakeTokenTool(agentRuntime),
				new ThalaStakeTokenTool(agentRuntime),
				new ThalaUnstakeTokenTool(agentRuntime),
				new AmnisStakeTool(agentRuntime),
			    new AmnisWithdrawStakeTool(agentRuntime),
                FetchTokenPriceInUsdTool,
                new ThalaAddLiquidityTool(agentRuntime),
                new ThalaRemoveLiquidityTool(agentRuntime)
			],
			checkpointSaver: memory5,
			messageModifier: `
  You are AptosStakeAdvisor, an intelligent on-chain agent that helps users stake, unstake, and optimize token allocations across various Aptos-based protocols like Thala, Joule, and Echo. You analyze staking pools for ${tokenName} in real time, evaluating:
- Return on Investment (ROI) and Annual Percentage Yield (APY)
- Risk Factors (protocol reliability, lock-up periods, liquidity constraints)
- Diversification Strategies (spreading risk across multiple pools)
- Your Responsibilities:
- Fetch all available staking pools and their key metrics.
- Compare and rank pools based on APY, risk, and potential earnings.
- Suggest an optimized staking strategy, ensuring maximized returns while maintaining a balanced risk-reward ratio.
- If one pool dominates, recommend full allocation; otherwise, propose diversified staking across multiple pools.
- Clearly state any lock-up periods, withdrawal restrictions, or risks associated with the staking pools.
- Guidelines:
-Always wait for all tool outputs before responding.
- Concise Responses Only – No unnecessary details, just insights that matter.
- You should never perform any transaction on your own unless the user explicitly propmpts you to do so. Keep this in mind.
- If staking opportunities change frequently, notify users about real-time fluctuations.
- If a user already has staked tokens, suggest rebalancing if better opportunities exist.
- If a pool is risky, warn the user and suggest alternatives.
- Use appropriate tools when required, specifying the tool's name.
- Format the response for readability, using line breaks and bullet points where necessary.
- Always do the complete research dont ask user to research on their own, be precise and concise. Always consider all the proctols like thala, joule, echo and amnis protocol.
- Always answer in a JSON format with a continous string so that it can be easily parsed
`,
		})
		return { agent, account, agentRuntime };
	}catch(err){
		console.log(err)
		return null
	}	
}




export const StakingUnstakingBestOpppurtunityTool=tool(
	async({tokenName})=>{
        try{
			const result=await StakeUnstakeAgent(tokenName);
			return result
		}catch(error){
			console.log("error finding staking unstaking oppurtunity.",error)
			return "error finding staking unstaking oppurtunity."
		}
	},
	{
		name:"StakeUnstakeBestOppurtunityTool",
		description:`This tool analyzes and identifies the optimal opportunities for staking or unstaking assets across multiple distinct protocols. It evaluates key factors such as annual percentage yield (APY), lockup periods, fees, risks, and liquidity conditions for each protocol. Based on the user's input (e.g., amount to stake or unstake), it retrieves real-time data from all available staking and unstaking options, compares them, and returns a detailed summary of the best opportunity. The output includes a clear recommendation, highlighting the protocol with the most favorable conditions, alongside a breakdown of returns, potential risks, and any trade-offs (e.g., higher APY with longer lockup vs. lower APY with instant access). Designed for users seeking to maximize returns or flexibility, this tool ensures informed decision-making by presenting a holistic view of staking and unstaking possibilities in a concise, actionable format.`,
		schema: Zod.object({
			tokenName: Zod.string().describe("The currency to evaluate staking or unstaking opportunities for, e.g., USDC, APT, USDT.."),
		})
	}
)