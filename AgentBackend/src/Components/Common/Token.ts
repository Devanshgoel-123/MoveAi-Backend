import { SupabaseToken } from "../../Types";
import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();
import { AptosConfig, Network,Aptos } from "@aptos-labs/ts-sdk";
import axios from "axios";

export async function fetchSupportedTokens(): Promise<SupabaseToken[]> {
    try{
        const tokenData = await prisma.token.findMany()
//        const tokenData =[
//   {
//     "id": 1,
//     "token_id": 1,
//     "token_address": "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
//     "chain_id": 12,
//     "decimals": 6,
//     "type": "stablecoin",
//     "name": "usdt",
//     "image":"https://s2.coinmarketcap.com/static/img/coins/64x64/825.png"
//   },
//   {
//     "id": 2,
//     "token_id": 2,
//     "token_address": "0x1::aptos_coin::AptosCoin",
//     "chain_id": 12,
//     "decimals": 8,
//     "type": "native",
//     "name": "apt",
//     "image":"https://coin-images.coingecko.com/coins/images/26455/large/aptos_round.png?1696525528"
//   },
//   {
//     "id": 3,
//     "token_id": 3,
//     "token_address": "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
//     "chain_id": 12,
//     "decimals": 6,
//     "type": "stablecoin",
//     "name": "usdc",
//     "image":"https://coin-images.coingecko.com/coins/images/35261/large/USDC_Icon.png?1708008542"
//   },
//   {
//     "id": 4,
//     "token_id": 4,
//     "token_address": "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH",
//     "chain_id": 12,
//     "decimals": 6,
//     "type": "native",
//     "name": "weth",
//     "image":"https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png"
//   },
//   {
//     "id": 5,
//     "token_id": 5,
//     "token_address": "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL",
//     "chain_id": 12,
//     "decimals": 8,
//     "type": "other",
//     "name": "thl",
//     "image":"https://coin-images.coingecko.com/coins/images/29697/large/THL_Logomark.png?1728418092"
//   },
// ]
  
        return tokenData as SupabaseToken[] || [];
    }catch(error){
        console.error('Error fetching tokens:', error);
        throw new Error(`Failed to fetch supported tokens: ${error}`);
 }

}


export const fetchTokenPriceInUsd=async (tokenAddress:string)=>{
   try{
    const query = {
        tokenAddress: tokenAddress,
      }
   const url = `https://api.panora.exchange/prices?tokenAddress=${tokenAddress}`
    const result=await axios.get(url,{
        headers:{
            "x-api-key":"a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi",
        }
    })
    return result.data[0].usdPrice
   }catch(error){
    console.error('Error fetching tokens:', error);
    throw new Error(`Failed to fetch supported tokens: ${error}`);
}
}


export const getTokenAmountOwnedByAccount=async (userAddress:string,token_address:string)=>{
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(aptosConfig);

    const userOwnedTokens=await aptos.getAccountCoinAmount({
        accountAddress:userAddress,
        coinType:token_address as `${string}::${string}::${string}`
    })

    return userOwnedTokens
}

export const getFearGreedIndex=async ()=>{
  try{
  const url = "https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical?start=1&limit=30";
  const response = await axios.get(url, {
    headers: {
      "X-CMC_PRO_API_KEY": process.env.COINMARKETCAP_API_KEY!,
      "Accept": "application/json",
    },
  });
  const data = await response.data.data
  const answer=data.map((item:GreedIndex)=>{
       return {
        value_classification:item.value_classification,
        value:item.value
       }
  })
  console.log("The greed index is",answer)
  return answer
  }catch(err){
    console.log(err)
    return "Error fetching getFearGreedIndex"
  }
}


export interface GreedIndex{
  timestamp:string;
  value:number;
  value_classification:string;
}