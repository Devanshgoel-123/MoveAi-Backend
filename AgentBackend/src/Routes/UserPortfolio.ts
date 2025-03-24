import axios from "axios";
import express from "express";
import dotenv from "dotenv";
import { Request,Response } from "express";
import { fetchUserPortfolio } from "../Tools/PortfolioManager";
import { ACCOUNT_ADDRESS } from "../Components/Common/Constants";
import { calculateCurrentAllocation } from "../Tools/PortfolioManager";
dotenv.config()

export const UserPortfolioRouter=express.Router();

UserPortfolioRouter.get("/",async (req:Request,res:Response):Promise<any>=>{
    try{ 
        const {
            agentWalletAddress,
            agentKey
        }=req.query;
        console.log("the agent wallet Address is:",agentWalletAddress)
        if(agentWalletAddress==="" || agentWalletAddress===undefined) return res.send({
            data:"Please connect your wallet"
        })
        const accountAddress=agentWalletAddress;
        const userPortfolio=await fetchUserPortfolio(agentWalletAddress.toString())
        const userAllocations= calculateCurrentAllocation(userPortfolio)
        console.log("the user portfolio is",userPortfolio);
        console.log("the user allocations are",userAllocations);
	    return res.json({
        userPortfolio,
	  });
    }catch(err){
        console.log("error fetching user portfolio",err)
        return res.status(500).json({
            message:"Error fetching the user portfolio"
        })
    }
})