import express from "express";
import { Request,Response } from "express";
import { getAllMarketsDataEchelon } from "../Components/DataRoutes/Echelon";
import { JouleFinanceUserData } from "../Components/DataRoutes/JouleFinance";

export const userPoolRouter=express.Router();


userPoolRouter.get("/",async(req:Request,res:Response):Promise<any>=>{
    try{
      const echelonData=await getAllMarketsDataEchelon();
      const jouleUserData=await JouleFinanceUserData();
      return res.json({
        echelonUserData:echelonData?.userPositions,
        echelonMarketData:echelonData?.marketDataFiltered,
        jouleUserData:jouleUserData
      })
    }catch(err){
        res.status(500).json(({
            message:"Error fetching the data of the user pool"
        }))
      console.log(err)
    }
})