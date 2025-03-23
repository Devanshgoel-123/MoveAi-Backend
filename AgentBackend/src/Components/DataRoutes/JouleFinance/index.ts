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
        return {
            userPositions
        }
    }catch(err){
        console.log(err)
        return err
    }
}