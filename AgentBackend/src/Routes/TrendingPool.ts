

import axios from "axios";
import express from "express";
import dotenv from "dotenv";
import { Request,Response } from "express";
dotenv.config()
import { fetchTopPoolsOnNetwork } from "../Components/Functions/FetchTopPool";
export const TrendingPoolRouter=express.Router();


TrendingPoolRouter.get("/",async (req:Request,res:Response):Promise<any>=>{
    try{
        const { tokenName } = req.params;
        const poolData=await fetchTopPoolsOnNetwork(tokenName as string);
        return res.json({
            data:poolData
        })
    }catch(err){
        console.log("Failed to fetch the top trending pools on the network")
        return res.status(500).json({
            message:"Failed to fetch the top pools on the network"
        })
    }
})