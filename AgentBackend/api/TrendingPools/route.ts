
import { NextRequest, NextResponse } from "next/server";
import { fetchTopPoolsOnNetwork } from "@/Components/Backend/Functions/FetchTopPool";
export async function GET(request: NextRequest) {
	try {
       const tokenName = request.nextUrl.searchParams.get("tokenName");
       const poolData=await fetchTopPoolsOnNetwork(tokenName as string);
	  return NextResponse.json({
		data:poolData
	  });
	} catch (error) {
	  console.log(error)
	  return NextResponse.json(
		{ error: "Failed to process request", details: error},
		{ status: 500 }
	  );
	}
  }
  


