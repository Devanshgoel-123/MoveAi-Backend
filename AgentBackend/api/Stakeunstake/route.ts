import { config } from "dotenv"
import { HumanMessage } from "@langchain/core/messages"
import { NextRequest, NextResponse } from "next/server"
import { StakeUnstakeAgent } from "@/Components/Backend/Agents/StakeUnstakeAgent"

config()

export async function POST(request: NextRequest) {
	try {
	const agentCache = await StakeUnstakeAgent()
	
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
	  console.log(response)
	  const finalLength=response.length;
	  let answer;
	  try {
		answer = JSON.parse(response[finalLength - 1].content);
	  } catch (error) {
		console.error("JSON parsing error:", error);
		answer = response[finalLength - 1].content; 
	  }
	  return NextResponse.json({
		data:answer,
		agentResponse:true
	   })
	} catch (error) {
	  console.error("Agent execution error:", error);
	  return NextResponse.json(
		{ error: "Failed to process request", details: error},
		{ status: 500 }
	  );
	}
  }
  
