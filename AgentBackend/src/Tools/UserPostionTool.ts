import { tool } from "@langchain/core/tools";
import { JouleFinanceUserData } from "../Components/DataRoutes/JouleFinance";
import { getAllMarketsDataEchelon } from "../Components/DataRoutes/Echelon";
import { AccountAddress } from "@aptos-labs/ts-sdk";



export const UserPositionTool=tool(
    async()=>{
      const joulePositions=await JouleFinanceUserData();
      const echelonResult=(await getAllMarketsDataEchelon());
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
    }
)