import axios from "axios";
import dotenv from "dotenv";
dotenv.config()
export const getHistoricalPrice = async (tokenId:string) => {
  try {
    const timeTo=new Date().getTime()/1000;
    const timeFrom=(new Date().getTime()/1000)-(4*30*86400);
    const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart/range?vs_currency=usd&from=${timeFrom}&to=${timeTo}&precision=4`;
    const headers = {
      accept: 'application/json',
      'x-cg-demo-api-key':`${process.env.HISTORY_API_KEY}`
    };

    const response = await axios.get(url, {headers });
    console.log(response.data.prices);
    return response.data.prices;
  } catch (error) {
    console.error('Error fetching historical price:', error);
  }
};

