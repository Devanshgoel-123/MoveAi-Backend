
import express from "express";
import { Request,Response } from "express";
import {
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import { MemorySaver } from "@langchain/langgraph"
import { AgentRuntime, AptosBalanceTool, AriesBorrowTool, AriesCreateProfileTool, AriesLendTool, EchelonBorrowTokenTool, EchelonLendTokenTool, JouleLendTokenTool, JouleWithdrawTokenTool } from "move-agent-kit"
import { ChatAnthropic } from "@langchain/anthropic"
import dotenv from "dotenv"
import { LocalSigner } from "move-agent-kit"
import { Claudellm } from "../Components/Common/Constants";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { fetchSupportedTokens } from "../Components/Common/Token";
import { HumanMessage } from "@langchain/core/messages";
import { config } from "../Components/Common/Constants";
export const lendBorrowRouterPost=express.Router();

dotenv.config()
lendBorrowRouterPost.post('/',async (req:Request,res:Response):Promise<any>=>{
    try{
        const { message } = req.body;
        const tokens=await fetchSupportedTokens();

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
		const llm = Claudellm
		const memory5 = new MemorySaver()
        const agent=createReactAgent({
            llm,
            tools:[
				new EchelonBorrowTokenTool(agentRuntime),
                new EchelonLendTokenTool(agentRuntime),
                new JouleLendTokenTool(agentRuntime),
                new JouleWithdrawTokenTool(agentRuntime),
                new AptosBalanceTool(agentRuntime),

			],
            checkpointer:memory5,
           messageModifier: `
You are a **DeFi Lending & Borrowing Execution Agent**, specializing in **Joule** and **Echelon** protocols. Your primary role is to process lending and borrowing transactions based on user input.

---

## **Your Responsibilities**
1. Execute lending or borrowing operations only for **Joule** and **Echelon** protocols.
2. Validate user input, ensuring they hold the required tokens for lending or meet collateral requirements for borrowing.
3. Return all responses as a **valid JSON object** that can be parsed using \`JSON.parse()\` without errors.

---

## **Response Format**
If the user requests **lending/borrowing**, return:  
\`\`\`json
{
  "protocol": "<Joule or Echelon>",
  "token": "<Token being lent/borrowed>",
  "amount": "<Amount of tokens>",
  "action": "<Lend or Borrow>",
  "transactionHash": "<Transaction ID after execution>",
  "confirmation": "<True if successfully executed, False otherwise>",
  "message": "<Success or failure message>"
}
\`\`\`

---

## **Example Responses**
✅ **User lends 200 APT on Joule**:
\`\`\`json
{
  "protocol": "Joule",
  "token": "APT",
  "amount": "200",
  "action": "Lend",
  "transactionHash": "0xabc123xyz",
  "confirmation": true,
  "message": "Successfully lent 200 APT on Joule."
}
\`\`\`

❌ **User tries to lend but has insufficient balance**:
\`\`\`json
{
  "protocol": "Echelon",
  "token": "APT",
  "amount": "500",
  "action": "Lend",
  "confirmation": false,
  "message": "Insufficient balance to lend 500 APT."
}
\`\`\`

✅ **User borrows 100 USDC from Echelon**:
\`\`\`json
{
  "protocol": "Echelon",
  "token": "USDC",
  "amount": "100",
  "action": "Borrow",
  "transactionHash": "0xdef456uvw",
  "confirmation": true,
  "message": "Successfully borrowed 100 USDC from Echelon."
}
\`\`\`

---

## **Workflow**
1. **Identify Action** – Determine whether the user wants to **lend or borrow**.
2. **Validate Balance or Collateral** – Ensure the user has sufficient funds for lending or meets collateral requirements for borrowing.
3. **Execute Transaction** – Simulate a successful operation and generate a transaction hash.
4. **Return JSON Response** – Always return a structured response to ensure smooth execution.

---
**⚠️ Note:**  
- Only **Joule and Echelon** protocols are supported.  
- If an unsupported protocol or token is requested, respond with an error message.  
`,
        })
const stream = await agent.stream(
    {
      messages: [new HumanMessage(message)],
    },
    config
  );

  const response = [];
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
   })
    }catch(err){
        console.error("Agent execution error:", err);
        return res.status(500).json({ error: "Failed to process request", details: err });
    }
})