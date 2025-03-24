import { tool } from "@langchain/core/tools";
import { JouleFinanceUserData } from "../Components/DataRoutes/JouleFinance";
import { getAllMarketsDataEchelon } from "../Components/DataRoutes/Echelon";
import { z as Zod } from "zod";


export const UserPositionTool=tool(
    async({AccountAddress})=>{
      const joulePositions=await JouleFinanceUserData(AccountAddress);
      const echelonResult=(await getAllMarketsDataEchelon(AccountAddress));
      const echelonUserPosition=echelonResult?.userPositions;
      const echelonMarketData=echelonResult?.marketDataFiltered
      return {
        joulePositions,
        echelonUserPosition,
        echelonMarketData
      }
    },
    {
        name:"UserPortfolioDataTool",
        description:"Retrieves and analyzes the user's positions across multiple DeFi protocols, including Joule Finance and Echelon. The tool provides insights into user holdings, risk exposure, and market data, enabling the agent to assess portfolio health. It helps identify loss-making or inefficient positions and suggests optimal asset allocation strategies, including staking, lending, borrowing, or swapping assets for better yield or risk management.",
        schema:Zod.object({
        AccountAddress: Zod.string().describe("The account address of the user."),
        })
    }
)