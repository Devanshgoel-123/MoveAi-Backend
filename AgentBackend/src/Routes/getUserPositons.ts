import express from "express";
import { Request,Response } from "express";
import { getAllMarketsDataEchelon } from "../Components/DataRoutes/Echelon";
import { JouleFinanceMarketData, JouleFinanceUserData } from "../Components/DataRoutes/JouleFinance";

export const userPoolRouter=express.Router();


userPoolRouter.get("/",async(req:Request,res:Response):Promise<any>=>{
    try{
      const {
        agentWalletAddress
      }=req.query;
      if(agentWalletAddress==="" || agentWalletAddress===undefined){
        return res.status(500).json(({
          message:"Please connect Your Wallet and then continue"
      }))
      }
      const echelonData=await getAllMarketsDataEchelon(agentWalletAddress.toString());
      const jouleUserData=await JouleFinanceUserData(agentWalletAddress.toString());
      const jouleMarketData=await JouleFinanceMarketData(agentWalletAddress.toString());
      return res.json({
        echelonUserData:echelonData?.userPositions,
        echelonMarketData:echelonData?.marketDataFiltered,
        jouleUserData:jouleUserData,
        jouleMarketData:jouleMarketData
      })
    }catch(err){
        res.status(500).json(({
            message:"Error fetching the data of the user pool"
        }))
      console.log(err)
    }
})