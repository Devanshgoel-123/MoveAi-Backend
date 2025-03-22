import { tool } from "@langchain/core/tools";
import { z as Zod } from "zod";
import {StakingUnstakingBestOpppurtunityTool } from "./StakeUnstakeAgent";
import { LendingBorrowingBestOpppurtunityTool } from "./LendBorrowAgent";
import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { config } from "dotenv";
import { llm } from "../Common/Constants";
import { HumanMessage } from "@langchain/core/messages";
config();

export const YieldOptimizationTool = tool(
  async ({ tokenName, riskTolerance, amount }) => {
    try {
      
      const memory = new MemorySaver();
      const config = { 
		configurable: { 
		  thread_id: `aptos-agent-1` 
		} 
	  };
      const agent = createReactAgent({
        llm,
        tools: [
           LendingBorrowingBestOpppurtunityTool,
           StakingUnstakingBestOpppurtunityTool
        ],
        checkpointSaver: memory,
        messageModifier: `
You are YieldOptimizer, an advanced agent designed to maximize returns on ${tokenName} across staking, lending, and borrowing opportunities on the Aptos blockchain. Your goal is to analyze options using only the following protocols: Thala, Joule, Echo, and Ams, consider the user's risk tolerance (${riskTolerance}), and recommend the best yield farming strategy. Here's how you operate:

### Responsibilities:
1. **Analyze Options**: Use the StakeUnstakeBestOpportunityTool and LendingBorrowingBestOpportunityTool to fetch real-time data on staking, lending, and borrowing for ${tokenName}.
2. **Evaluate Metrics**:
   - Staking: APY, lockup periods, risks (e.g., protocol stability).
   - Lending: APY, liquidity risks, fees.
   - Borrowing: APR, collateral requirements, liquidation risks.
3. **Incorporate Risk Tolerance**:
   - Low Risk: Prioritize stable protocols, shorter lockups, lower leverage, and minimal liquidation risk.
   - Medium Risk: Balance yield and risk, allowing moderate lockups or collateralized borrowing.
   - High Risk: Maximize yield with longer lockups, leveraged borrowing, or newer protocols.
4. **Propose Strategies**:
   - Suggest staking, lending, borrowing, or a combination (e.g., lend 50%, stake 50%) based on ${amount} tokens.
   - Highlight yields, risks, and trade-offs for each option.
   - If borrowing is suggested, explain how to reinvest (e.g., stake borrowed funds).
5. **Execution**:
   - Do NOT execute any transactions unless the user explicitly says "execute this strategy."
   - If instructed, break the strategy into steps and execute them sequentially, confirming each step.
   - Dont return any incomplete information always wait for the complete output then also provide the user with an answer.
### Guidelines:
- Always fetch fresh data from both tools before responding.
- Consider the user's input amount (${amount} tokens) for precise recommendations.
- Tailor strategies to ${riskTolerance}:
  - Low: Avoid high volatility or untested protocols.
  - Medium: Allow moderate risk for better returns.
  - High: Optimize for maximum yield, even with higher risk.
- Format responses in JSON with:
  - "summary": Brief overview of the best strategy.
  - "options": Array of detailed strategies (protocol, action, yield, risk, notes).
  - "recommendation": The top suggested strategy.
- Be concise but thorough—focus on actionable insights.
- If data is unclear or risks are unknown, state assumptions and suggest caution.
- Ask clarifying questions if risk tolerance or intent is ambiguous (e.g., "Do you prefer liquidity over yield?").
- If any required parameters is not given then consider risk as medium and avoid giving out random values
`,
      });

      const prompt = `Analyze staking, lending, and borrowing options for ${amount} ${tokenName} with a ${riskTolerance} risk tolerance. Provide a JSON response with a summary, options, and recommendation.`;
      const response = [];
	  const stream = await agent.stream(
		{
		  messages: [new HumanMessage(prompt)],
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
       return answer;
    } catch (error) {
      console.log("Error in YieldOptimizationTool:", error);
      return "Error optimizing yield strategy.";
    }
  },
  {
    name: "YieldOptimizationTool",
    description: `
      This tool optimizes yield farming strategies for a given token on the aptos chain by analyzing staking, lending, and borrowing opportunities across Aptos protocols like Joule Finance, Aries, Echelon, Echo, Thala and Amnis only no other protocol. It evaluates key metrics such as APY (for staking/lending), APR (for borrowing), lockup periods, collateral requirements, fees, liquidity, and risks. Based on the user's token name, amount, and risk tolerance (low, medium, high), it compares all options in real time and recommends a tailored strategy to maximize returns while aligning with the user's risk profile. The output includes a detailed summary of viable strategies, a top recommendation, and trade-offs (e.g., high yield with long lockup vs. moderate yield with flexibility). Designed for users seeking to optimize their DeFi returns, it supports informed decision-making and can execute strategies step-by-step upon explicit user request.
    `,
    schema: Zod.object({
      tokenName: Zod.string().describe("The token to optimize yield for, e.g., APT, USDC, USDT."),
      riskTolerance: Zod.enum(["low", "medium", "high"]).describe("The user's risk preference: low (safe), medium (balanced), high (aggressive)."),
      amount: Zod.number().describe("The amount of tokens to allocate for yield farming."),
    }),
  }
);