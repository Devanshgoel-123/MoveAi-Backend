import axios from "axios";
import { fetchSupportedTokens } from "../Backend/Common/Token";
import { z as Zod } from "zod";
import { tool } from "@langchain/core/tools";
import { SupabaseToken } from "../../src/Types";
export const fetch24HChangeForTokens=async()=>{
    try{
        const tokensArray=await fetchSupportedTokens();
        const formattedTokens = tokensArray.map((item) => {
          const chainName = "aptos"
          return `${chainName}:${item.token_address}`;
        }).join(",");
        const response=await axios.get(`https://coins.llama.fi/percentage/${formattedTokens}`,{
            headers:{
                "Accept":"application/json"
            }
        })
        console.log(response.data.coins)
        const extractedData = Object.entries(response.data.coins).map(([key, change]) => {
            const tokenAddress = key.split(':')[1];
            return { 
                tokenAddress:tokenAddress,
                change24H:change,
            };
          });
          return extractedData;
    }catch(err){
        console.log(err)
        throw new Error("Failed fetching the 24hr change")
    }  
  }


  export const Find24HChangeTool=tool(
    async ({tokenName}) => {
      try {
        console.log(`Fetching the 24h change of ${tokenName}...`);
        const result=await fetch24HChangeForTokens();
        const tokenAddress=(await fetchSupportedTokens()).filter((item:SupabaseToken)=>(item.name===tokenName.toLowerCase() || item.name.includes(tokenName.toLowerCase())))[0].token_address;
        console.log(result,tokenAddress,await fetchSupportedTokens())
        console.log("the 24change response is:",result.filter((item)=>item.tokenAddress===tokenAddress)[0]);
        return result.filter((item)=>item.tokenAddress===tokenAddress)[0].change24H
      } catch (error) {
        console.error("Error Fetching the 24h change of token:", error);
        return {
          success: false,
          message: `Error Fetching the 24h change of token : ${error}`
        };
      }
    },
    {
      name: "Find24HChangeTool",
      description: "Fetches the % change of tokens over the 24h",
      schema: Zod.object({
        tokenName: Zod.string().describe("The token to find the %change for."),
      })
    }
  )