import { ACCOUNT_ADDRESS } from "@/Components/Backend/Common/Constants";
import { fetchSupportedTokens, getTokenAmountOwnedByAccount } from "@/Components/Backend/Common/Token";
// import { FindAndExecuteArbritrageOppurtunity } from "@/Components/Backend/Tools/ArbritrageFinder";

export async function GET(request: Request) {
    try{
        const supportedTokens=await fetchSupportedTokens();
        const results = await Promise.all(
            supportedTokens.map(async (token) => {
                const userWalletBalance=await getTokenAmountOwnedByAccount(ACCOUNT_ADDRESS, token.token_address);
                console.log("the user Wallet Balance for token:",token.name,userWalletBalance,token.decimals)
                const formattedBalance=Math.floor(userWalletBalance)/10**(token.decimals)
                console.log("the formatted Balance is:",formattedBalance)
                return formattedBalance
                // if(formattedBalance>0){
                //     const response = await FindAndExecuteArbritrageOppurtunity(
                //         token.name.toLowerCase(),
                //         formattedBalance,
                //         5,
                //         supportedTokens
                //     )
                // return response
                // }
            })
        );
        return new Response(JSON.stringify({
            success:true,
            message:results
        }),{
            status:200,
            headers:{
                'Content-Type': 'application/json'
            }
        })
    }catch (err) {
        console.error("Error diversifying portfolio:", err);
        return new Response(JSON.stringify({ 
            success: false, 
            message: "Error finding any arbitrage oppurtunity" 
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}