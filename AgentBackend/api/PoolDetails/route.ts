import { NextRequest, NextResponse } from "next/server"
import { InitializeAgent } from "../Agent/route"
import { fetchSupportedTokens } from "@/Components/Backend/Common/Token";



export async function GET(request:NextRequest){
    try{
        const agentRuntimeAll=await InitializeAgent()
        const agentRuntime=agentRuntimeAll?.agentRuntime;
        if(agentRuntime===null || agentRuntime===undefined){
            return NextResponse.json(
                { error: "Failed to answer your query" },
                { status: 500 }
            );
        }
       const tokenAddress=(await fetchSupportedTokens()).map((item)=> item.token_address);
       const errorAddresses: string[] = [];
       const poolDetails=await Promise.all(tokenAddress.map( async (address:string)=>{
        try {
            return await agentRuntime.getPoolDetails(address);
        } catch (error) {
            console.error(`Error fetching pool details for ${address}:`, error);
            errorAddresses.push(address);
            return null; 
        }
       }))
       const filteredData = poolDetails.filter(Boolean); 
       return NextResponse.json({
        success: true,
        poolDetails: filteredData,
        failedAddresses: errorAddresses
    });

} catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
        { error: "An unexpected error occurred", details: err },
        { status: 500 }
    );
}
}