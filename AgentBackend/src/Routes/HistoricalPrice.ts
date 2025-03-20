
import axios from "axios";
import express from "express";
import dotenv from "dotenv";
import { Request,Response } from "express";
dotenv.config()
const historicalPriceRouter=express.Router();


historicalPriceRouter.get("/",async (req:Request,res:Response):Promise<any>=>{
    try {
        const timeTo=new Date().getTime()/1000;
        const { tokenId } = req.body;
        const timeFrom=(new Date().getTime()/1000)-(6*30*86400);
        const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart/range?vs_currency=usd&from=${timeFrom}&to=${timeTo}&precision=4`;
        const headers = {
          accept: 'application/json',
          'x-cg-demo-api-key':`${process.env.HISTORY_API_KEY}`
        };
        const response = await axios.get(url, {headers });
        console.log(response.data.prices);
        return res.json({
            data:response.data
        })
	} catch (error) {
	  return res.status(500).json({
        message:"Unable to fetch the past price of token"
      })
	}
})

