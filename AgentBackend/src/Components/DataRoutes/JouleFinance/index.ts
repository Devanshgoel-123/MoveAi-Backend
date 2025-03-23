import { AgentRuntime } from "move-agent-kit"
import { LocalSigner } from "move-agent-kit"
import {
    AccountAddress,
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	HexInput,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import axios from "axios"
import { ACCOUNT_ADDRESS } from "../../Common/Constants"

export const JouleFinanceUserData=async()=>{
    try{
        const aptosConfig = new AptosConfig({
			network: Network.MAINNET,
		})
		const aptos = new Aptos(aptosConfig)
		const account = await aptos.deriveAccountFromPrivateKey({
			privateKey: new Ed25519PrivateKey(
				PrivateKey.formatPrivateKey(`${process.env.PRIVATE_KEY}`, PrivateKeyVariants.Ed25519)
			),
		})
        const signer = new LocalSigner(account, Network.MAINNET)
		const agentRuntime = new AgentRuntime(signer, aptos,{
			PANORA_API_KEY: "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi",
		})
		const userAddress=AccountAddress.fromString(ACCOUNT_ADDRESS)
        console.log(userAddress.toString())
		const userPositions = await agentRuntime.getUserAllPositions(userAddress);
        console.log("the user positions are",userPositions)
		const filteredUserPosition=extractUserPositions(userPositions)
        return filteredUserPosition
    }catch(err){
        console.log(err)
        return err
    }
}

export const JouleFinanceMarketData=async ()=>{
	try{
		const response=await axios.get("https://price-api.joule.finance/api/market")
		const marketData=response.data.data;
		const filteredData=marketData.filter((item:any)=>{
			return item?.asset.assetName.toLowerCase().includes("usdc") || item?.asset.assetName.toLowerCase().includes("usdt") || item?.asset.assetName.toLowerCase().includes("aptos") || item?.asset.assetName.toLowerCase().includes("weth") || item?.asset.assetName.toLowerCase().includes("thl")
		})
		const finalData=filteredData.map((item:any)=>{
			return {
				coin:`::apt::${item.asset.assetName}`,
				borrowApr:item.borrowApy,
				supplyApr:item.depositApy,
				coinPrice:item.priceInfo.price
			}
		})
		
		return finalData
	}catch(err){
		console.log(err)
	}
}

interface Position {
	positionId: string;
	tokenAddress: string;
	amount: string;
	type: "lend" | "borrow";
  }

  function extractUserPositions(jouleUserData: any): Position[] {
	const positions: Position[] = [];
    const userPosition=jouleUserData[0];
	  userPosition.user_position_ids.forEach((positionId: string) => {
		const positionData = userPosition.positions_map.data.find((p: any) => p.key === positionId);
		if (positionData) {
		
		  positionData.value.lend_positions.data.forEach((lend: any) => {
			positions.push({
			  positionId,
			  tokenAddress: lend.key,
			  amount: lend.value,
			  type: "lend",
			});
		  });
		  
		 
		  positionData.value.borrow_positions.data.forEach((borrow: any) => {
			positions.push({
			  positionId,
			  tokenAddress: borrow.key,
			  amount: borrow.value,
			  type: "borrow",
			});
		  });
		}
	  });
	
  
	return positions;
  }