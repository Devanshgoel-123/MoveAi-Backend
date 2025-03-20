
import { tool } from "@langchain/core/tools";
import { z as Zod } from "zod";
import { fetchSupportedTokens,fetchTokenPriceInUsd } from "../Backend/Common/Token";
export const FetchTokenPriceInUsdTool = tool(
    async ({ tokenName}) => {
      try {
        const tokenAddress=(await fetchSupportedTokens()).filter((item)=>item.name.toLowerCase()===tokenName.toLowerCase())[0].token_address
        const priceInUsd=await fetchTokenPriceInUsd(tokenAddress)
        return priceInUsd
      } catch (error) {
        console.error("Error fetching user preference:", error);
        return {
          success: false,
          message: `Error fetching diversification preference: ${error instanceof Error ? error.message : String(error)}`,
          hasPreference: false
        };
      }
    },
    {
      name: "fetchTokenPriceInUsdTool",
      description: "Retrieves the current price of a specified cryptocurrency token in USD. The tool first checks if the token is supported and then fetches its latest price using the name of the cryptocurrency.",
      schema: Zod.object({
       tokenName: Zod.string().describe("The name of the token to find price of")
      })
    }
  );
  
  