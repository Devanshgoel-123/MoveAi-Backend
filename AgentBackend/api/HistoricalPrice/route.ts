import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config()
export async function GET(request: NextRequest) {
	try {
        const timeTo=new Date().getTime()/1000;
        const tokenId = request.nextUrl.searchParams.get("tokenId");
        const timeFrom=(new Date().getTime()/1000)-(6*30*86400);
        const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart/range?vs_currency=usd&from=${timeFrom}&to=${timeTo}&precision=4`;
        const headers = {
          accept: 'application/json',
          'x-cg-demo-api-key':`${process.env.HISTORY_API_KEY}`
        };
        const response = await axios.get(url, {headers });
        console.log(response.data.prices);
        return NextResponse.json({
            data:response.data
        })
	} catch (error) {
	  return NextResponse.json(
		{ error: "Failed to process request", details: error},
		{ status: 500 }
	  );
	}
  }
  