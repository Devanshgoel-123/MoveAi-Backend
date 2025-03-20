
import dotenv from "dotenv";
import axios from "axios";
import { tool } from "@langchain/core/tools";
import { Tx } from "../../src/Types";
import { FilteredTx } from "../../src/Types";
import Zod from "zod";
dotenv.config();

export const getTransactionByHash=async (hash:string)=>{
    try{
        const url=`https://aptos.blockpi.network/aptos/v1/${process.env.BLOCK_API_KEY}/v1/transactions/by_hash/${hash}`
        const response = await axios.get(url);
        const data = response.data;
        const sender = data.sender;
        const success = data.success;
        const vmStatus = data.vm_status;
        let value = "0";
        for (const change of data.changes) {
            if (change.data?.data?.coin?.value) {
                value = (Number((change.data.data.coin.value))/10**8).toString();
                break; 
            }
        }
        const receiver = "N/A";
        const finalData = {
            hash: data.hash,
            gasUsed: data.gas_used,
            value,
            sender,
            receiver,
            vmStatus,
            success,
        };
        return finalData;
    }catch(err){
        console.log(err)
    }
}

export const getLatestTransaction=async ()=>{
    try{
        const url=`https://aptos.blockpi.network/aptos/v1/${process.env.BLOCK_API_KEY}/v1/transactions?limit=5`
        const response=await axios.get(url)
        const data=response.data;
        console.log("the data is:",data[0].changes)
        const finalData=processTransactions(data);
        console.log("The final data is",finalData)
        return finalData;
    }catch(error){
        console.log(error)
        return "Couldn't find Transactions right now"
    }
}


export const GetTransactionDetailTool= tool(
    async ({ hash }) => {
        try {
            if(hash.slice(0,2)!=="0x"){
                return "Please provide a valid hash on the aptos blockchain."
            }
            const result = await getTransactionByHash(hash);
            console.log("the final result is",result)
            return {
              success: true,
              data: result
            };
          } catch (error) {
            console.error("Error finding best yield opportunity:", error);
            return {
              success: false,
              message: `Please provide a valid hash on the aptos blockchain :  We can't find details for transaction with hash ${hash}`
            };
          }
    },
    {
      name: "GetTransactionByHashTool",
      description: "Fetches the Details of the transaction using the hash of the transaction provided by the user",
      schema: Zod.object({
        hash: Zod.string().describe("The hash of the transaction we need the details of")
      })
    }
  );


export const GetLatestTransactionsTool=tool(
    async () => {
        try {
            const result = await getLatestTransaction();
            console.log("the latest transactions are:",result)
            return {
              success: true,
              data: result
            };
          } catch (error) {
            console.error("Error finding best yield opportunity:", error);
            return {
              success: false,
              message: "Unable to fetch the latest transactions sorry for the inconvenience"
            };
          }
    },
    {
      name: "GetLatestTransactionTool",
      description: "Fetches the Latest Transactions on the blockchain.",
    }
  );





const processTransactions=(txArray:Tx[]) =>{
    return txArray.map((tx)=> filterTransaction(tx));
}

const filterTransaction=(tx:Tx):FilteredTx=>{
    const timestampMicros = parseInt(tx.timestamp);
    const time = new Date(timestampMicros / 1000).toISOString().replace('T', ' ').slice(0, 19);
    let value = "0";
    if (tx.events && tx.events.length>1) {
        value = (tx.events[0].data.amount) 
    }
    let coinName = "Unknown";
    if (tx.payload && tx.payload.function) {
        if (tx.payload.function.toLowerCase().includes("apt")) {
            coinName = "apt";
        } else if (tx.payload.function.toLowerCase().includes("TeviStar")) {
            coinName = "tevistart"; 
        }else if (tx.payload.function.toLowerCase().includes("usdc")) {
            coinName = "usdc"; 
        }else if (tx.payload.function.toLowerCase().includes("usdt")) {
            coinName = "usdt"; 
        }else if (tx.payload.function.toLowerCase().includes("thl")) {
            coinName = "thl"; 
        }
    }

    const gasUsed = parseInt(tx.gas_used);
    const fromSender = tx.sender;
    const toSender = (tx.payload && tx.payload.arguments && tx.payload.arguments.length > 0) 
        ? tx.payload.arguments[0] 
        : "N/A";

    return {
        time,
        value,
        coin_name: coinName,
        gas_used: gasUsed,
        from_sender: fromSender,
        to_sender: toSender,
    };
}

