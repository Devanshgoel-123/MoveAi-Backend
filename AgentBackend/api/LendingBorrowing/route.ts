
import { config } from "dotenv"
import { HumanMessage } from "@langchain/core/messages"
import { NextRequest, NextResponse } from "next/server"
import { LendingBorrowingAgent } from "@/Components/Backend/Agents/LendBorrowAgent"
config()


export async function POST(request: NextRequest) {
	try {
	const tokenName = request.nextUrl.searchParams.get("tokenName");
	if(tokenName===null){
		return NextResponse.json(
			{ error: "Please provide a token Name"},
			{ status: 200 }
		  );
	}
	const agentCache = await LendingBorrowingAgent(tokenName)
	
	  if(agentCache===null){
		return NextResponse.json(
			{ error: "Failed to answer your query" },
			{ status: 500 }
		);
	  }
	  const { agent, account } = agentCache;
	  const body = await request.json();
	  
	  const { message } = body;
	  console.log("the message is:",message)
	  if (!message) {
		return NextResponse.json(
		  { error: "Message is required" },
		  { status: 400 }
		);
	  }
	  const config = { 
		configurable: { 
		  thread_id: `aptos-agent-1` 
		} 
	  };
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
	   })
	} catch (error) {
	  console.error("Agent execution error:", error);
	  return NextResponse.json(
		{ error: "Failed to process request", details: error},
		{ status: 500 }
	  );
	}
  }
  