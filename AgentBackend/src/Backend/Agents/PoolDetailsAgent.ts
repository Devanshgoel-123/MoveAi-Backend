import { InitializeAgent } from "../../../api/Agent/route"


export const getPoolDetails=async ()=>{
		try {
            const result=await InitializeAgent()
            const runtime=result?.agentRuntime
			const poolDetails = await runtime?.getPoolDetails("APT")
            console.log("the pool Details are",poolDetails);
			return poolDetails.marketSize
		} catch (error) {
			console.log(error)
			return error
		}
	}
