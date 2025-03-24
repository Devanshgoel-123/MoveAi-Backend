import { InitializeAgent } from "../../Routes/Agent"
import dotenv from "dotenv";
dotenv.config()

export const getPoolDetails=async ()=>{
		try {
            const result=await InitializeAgent({key:`${process.env.PRIVATE_KEY}`})
            const runtime=result?.agentRuntime
			const poolDetails = await runtime?.getPoolDetails("APT")
            console.log("the pool Details are",poolDetails);
			return poolDetails.marketSize
		} catch (error) {
			console.log(error)
			return error
		}
	}
