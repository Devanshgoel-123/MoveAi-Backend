
import { NextRequest, NextResponse } from "next/server";
import { fetchUserPortfolio } from "@/Components/Backend/Tools/PortfolioManager";
import { calculateCurrentAllocation } from "@/Components/Backend/Tools/PortfolioManager";
import { ACCOUNT_ADDRESS } from "@/Components/Backend/Common/Constants";
export async function GET(request: NextRequest) {
	try {
        const accountAddress=ACCOUNT_ADDRESS;
        const userPortfolio=await fetchUserPortfolio(accountAddress);
        const userAllocations= calculateCurrentAllocation(userPortfolio)
        console.log("the user portfolio is",userPortfolio);
        console.log("the user allocations are",userAllocations);
	  return NextResponse.json({
		userPortfolio,
	  });
	} catch (error) {
	  
	  return NextResponse.json(
		{ error: "Failed to process request", details: error},
		{ status: 500 }
	  );
	}
  }
  