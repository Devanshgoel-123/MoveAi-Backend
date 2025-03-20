
import axios from "axios"
export const fetchTopPoolsOnNetwork=async(tokenName:string)=>{
    try{
        const result=await axios.get("https://api.geckoterminal.com/api/v2/networks/aptos/pools?page=5&sort=h24_volume_usd_desc")
        const filteredData = result.data.data.filter((item: { attributes: { name: string | string[]; }; }) => {
            return (item.attributes.name.includes(tokenName.toUpperCase())) ;
          });
          const poolFinalData = filteredData
          .filter((item: { relationships: { dex: { data: { id: any; }; }; }; }) => {
            const dexId = item.relationships.dex.data.id;
            return dexId.includes("liquid") || dexId.includes("joule") || dexId.includes("thala");
          })
          .map((item: { id: any; attributes: { price_change_percentage: { [x: string]: any; }; }; relationships: { dex: { data: { id: any; }; }; base_token: { data: { id: any; }; }; quote_token: { data: { id: any; }; }; }; }) => {
            return {
              id: item.id,
              changePercentage: item.attributes.price_change_percentage["h24"],
              dex: item.relationships.dex.data.id,
              base_token: item.relationships.base_token.data.id,
              quote_token: item.relationships.quote_token.data.id,
            };
          });
        console.log(poolFinalData)
        return poolFinalData
    }catch(error){
        console.log(error)
    }
}