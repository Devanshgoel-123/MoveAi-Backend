import { EchelonClient } from "@echelonmarket/echelon-sdk";
import { Account, Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { ACCOUNT_ADDRESS } from "../../Common/Constants";
import { Network } from "@aptos-labs/ts-sdk";
const aptosConfig = new AptosConfig({
    network: Network.MAINNET,
})
const aptos = new Aptos(aptosConfig)

;

export const getAllMarketsDataEchelon=async ()=>{
   try{
    const client = new EchelonClient(aptos, "0xc6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba");
    const markets = await client.getAllMarkets();
    const marketData = await Promise.all(
        markets.map(async (market) => {
            const temp =(await client.getAccountSupply(ACCOUNT_ADDRESS, market)) || 0;
            const supply = temp / 1e6;
            const supplyApr = await client.getSupplyApr(market);
            const coin = await client.getMarketCoin(market);
            const borrowApr=await client.getBorrowApr(market)
            const coinPrice=await client.getCoinPrice(market);
            return supply >= 0 ? { market, coin, supply, supplyApr, borrowApr,coinPrice } : null;
        })
    );
    const marketDataFiltered=marketData.filter((item)=>{
        return item?.coin.toLowerCase().includes("usdc") || item?.coin.toLowerCase().includes("usdt") || item?.coin.toLowerCase().includes("aptos") || item?.coin.toLowerCase().includes("weth") || item?.coin.toLowerCase().includes("thl")
    })
    console.log("market data is:",marketDataFiltered)
    const userPositions = marketDataFiltered.filter((item)=>{
        return item?.supply!==undefined && item?.supply>0 
    });
    console.log("user position is",userPositions);
    return {userPositions,marketDataFiltered};
   }catch(err){
    console.log(err,"During echelon markets")
   }
}


