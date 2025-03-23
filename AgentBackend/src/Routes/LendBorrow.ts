import express from "express";
import { Request, Response } from "express";
import {
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import { MemorySaver } from "@langchain/langgraph";
import {
  AgentRuntime,
  AptosAccountAddressTool,
  AptosBalanceTool,
  AriesBorrowTool,
  AriesCreateProfileTool,
  AriesLendTool,
  EchelonBorrowTokenTool,
  EchelonLendTokenTool,
  JouleLendTokenTool,
  JouleWithdrawTokenTool,
} from "move-agent-kit";
import { ChatAnthropic } from "@langchain/anthropic";
import { llm } from "../Components/Common/Constants";
import dotenv from "dotenv";
import { LocalSigner } from "move-agent-kit";
import { Claudellm } from "../Components/Common/Constants";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { fetchSupportedTokens } from "../Components/Common/Token";
import { HumanMessage } from "@langchain/core/messages";
import { config } from "../Components/Common/Constants";
export const lendBorrowRouterPost = express.Router();

dotenv.config();
lendBorrowRouterPost.post(
  "/",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { message } = req.body;
      const tokens = await fetchSupportedTokens();

      const aptosConfig = new AptosConfig({
        network: Network.MAINNET,
      });
      const aptos = new Aptos(aptosConfig);
      const account = await aptos.deriveAccountFromPrivateKey({
        privateKey: new Ed25519PrivateKey(
          PrivateKey.formatPrivateKey(
            `${process.env.PRIVATE_KEY}`,
            PrivateKeyVariants.Ed25519
          )
        ),
      });
      const signer = new LocalSigner(account, Network.MAINNET);
      const agentRuntime = new AgentRuntime(signer, aptos, {
        PANORA_API_KEY:
          "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi",
      });
      // const llm = Claudellm;
      const memory5 = new MemorySaver();
      const agent = createReactAgent({
        llm,
        tools: [
          new EchelonBorrowTokenTool(agentRuntime),
          new EchelonLendTokenTool(agentRuntime),
          new JouleLendTokenTool(agentRuntime),
          new JouleWithdrawTokenTool(agentRuntime),
          new AptosBalanceTool(agentRuntime),
          new AptosAccountAddressTool(agentRuntime),
        ],
        checkpointer: memory5,
        messageModifier: `
Here’s the updated prompt with the additional instruction:  
---  

You are a **DeFi Lending & Borrowing Execution Agent**, specializing in **Joule** and **Echelon** protocols. Your role is to process lending and borrowing transactions based on user input.  

## **Your Responsibilities**  
- Execute lending or borrowing operations only for **Joule** and **Echelon** protocols.  
- Validate user input, ensuring they hold the required tokens for lending or meet collateral requirements for borrowing.  
- Return responses in a simple, user-readable format with **markdown styling**.  
- **Do not include unnecessary information** in the response. If the user requests their positions, only return their positions without extra details.  

## **Response Format**  
If a transaction is successful, respond as:  
php
✅ Successfully lent <amount> <token> on <protocol>.  
Transaction ID: <transactionHash>  
  
If a transaction fails, respond as:  
perl
❌ Unable to complete the transaction.  
Reason: <failure message>  
  

## **Example Responses**  
✅ **User lends 200 APT on Joule**  
php
✅ Successfully lent 200 APT on Joule.  
Transaction ID: 0xabc123xyz  
  

❌ **User tries to lend but has insufficient balance**  
perl
❌ Unable to complete the transaction.  
Reason: Insufficient balance to lend 500 APT.  
  

✅ **User borrows 100 USDC from Echelon**  
php
✅ Successfully borrowed 100 USDC from Echelon.  
Transaction ID: 0xdef456uvw  
  

## **Workflow**  
1. **Identify Action** – Determine whether the user wants to lend or borrow.  
2. **Validate Balance or Collateral** – Ensure the user has sufficient funds for lending or meets collateral requirements for borrowing.  
3. **Execute Transaction** – Simulate a successful operation and generate a transaction hash.  
4. **Return a Readable Response** – Always format the response in **markdown** for clarity.  

---  

⚠️ **Note:**  
- Only **Joule and Echelon** protocols are supported.  
- If an unsupported protocol or token is requested, respond with:  
perl
❌ Unsupported protocol or token. Please use Joule or Echelon.  

- **When asked for positions, return only the positions without extra details.**
`,
      });
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
            content: chunk.agent.messages[0].content,
          });
        } else if ("tools" in chunk) {
          response.push({
            type: "tools",
            content: chunk.tools.messages[0].content,
          });
        }
      }
      const finalLength = response.length;
      console.log("the response is", response);
      let answer;
      let isParsed;

      return res.json({
        data:
          response[finalLength - 1].content ||
          "I am really sorry we couldn't process your request at the moment. \n Please Try Again Later",
      });
    } catch (err) {
      console.error("Agent execution error:", err);
      return res
        .status(500)
        .json({ error: "Failed to process request", details: err });
    }
  }
);
