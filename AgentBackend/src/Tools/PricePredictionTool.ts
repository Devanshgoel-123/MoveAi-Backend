// import * as tf from '@tensorflow/tfjs';
// import { getHistoricalPrice } from '../Functions/PriceHistory';
// import { CoinGeckoId } from '../Types';
// import { tool } from '@langchain/core/tools';
// import { z as Zod } from "zod";


// let model: tf.Sequential | null = null; 

// async function loadModel() {
//   if (model) {
//     model.dispose();
//     model = null;
//     tf.disposeVariables();
//     console.log("Previous model disposed.");
//   }
//   if (!model) {
//     const windowSize=14;
//     console.log("Loading model...");
//     model = tf.sequential();
//     model.add(tf.layers.lstm({
//       units: 50,
//       returnSequences: false,
//       inputShape: [windowSize, 1]
//     }));
//     model.add(tf.layers.dense({ units: 1 }));
//     model.compile({
//       optimizer: 'adam',
//       loss: 'meanSquaredError'
//     });
//     console.log("Model loaded successfully.");
//   }
// }
// /**
//  * Tool to predict the price of the token user has requested or a cron job to predict the price of token
//  * 
//  * @param historicalPrices - Array of historical token prices (oldest to newest)
//  * @param windowSize - Number of past days to use for prediction (default: 14)
//  * @returns Promise containing the predicted price for the next day
//  */
// export async function PredictNextDayPrice(tokenName:string): Promise<number> {
//   const windowSize=14;
//   let tokenId=undefined;
//   if(tokenName.toLowerCase()==="usdc"){
//     tokenId=CoinGeckoId["usdc"]
//   }else if(tokenName.toLowerCase()==="aptos" || tokenName.toLowerCase()==="apt"){
//     tokenId=CoinGeckoId["aptos"]
//   }else if(tokenName.toLowerCase()==="usdt"){
//      tokenId=CoinGeckoId['usdt']
//   }else if(tokenName.toLowerCase()==="weth"){
//     tokenId=CoinGeckoId["weth"]
//   }else{
//     tokenId=CoinGeckoId['thala']
//   }
//    console.log(tokenId)
//    const priceData = await getHistoricalPrice(tokenId);
//    const historicalPrices = priceData.slice(-30).map((item: [number, number]) => item[1]);
//   if (historicalPrices.length < windowSize * 2) {
//     throw new Error(`Insufficient data. Need at least ${windowSize * 2} data points.`);
//   }
  
//   const min = Math.min(...historicalPrices);
//   const max = Math.max(...historicalPrices);
//   const normalizedPrices = historicalPrices.map((price:number)=> (price - min) / (max - min));
//   await loadModel();

//   const dataset = [];
//   for (let i = 0; i <= normalizedPrices.length - windowSize - 1; i++) {
//     const x = normalizedPrices.slice(i, i + windowSize);
//     const y = normalizedPrices[i + windowSize];
//     dataset.push({ x, y });
//   }
//   const lastWindow = normalizedPrices.slice(-windowSize);
//   const inputTensor = tf.tensor2d(lastWindow, [1, windowSize]).reshape([1, windowSize, 1]);
//   const predictionTensor = model!.predict(inputTensor) as tf.Tensor;
//   const predictedValue = await predictionTensor.data();
//   inputTensor.dispose();
//   predictionTensor.dispose();
//   const nextDayPrice=predictedValue[0] * (max - min) + min;
//   return nextDayPrice;
// }



// export const PricePredictionTool=tool(
//   async ({tokenName}) => {
//     try {
//       console.log(`Predicting the price for token${tokenName}...`);
//       const result=await PredictNextDayPrice(tokenName)
//       return `The predicted price of ${tokenName} token is : $${result}`
//     } catch (error) {
//       console.error("Error in Predicting the price of token:", error);
//       return {
//         success: false,
//         message: `Error Predicting price of token : ${error}`
//       };
//     }
//   },
//   {
//     name: "PricePredictorTool",
//     description: "Predicts the price of the token using the name of the token and then it also gives the current price of the token suggesting a decrease or increase in the token",
//     schema: Zod.object({
//       tokenName: Zod.string().describe("The currency to predict the price of token for usdc,aptos, usdt etc.."),
//     })
//   }
// )