import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { agentRouter } from "./Routes/Agent";
import { MarketAnalysisRouter } from "./Routes/MarketAnalysis";
import { HistoricalPriceRouter } from "./Routes/HistoricalPrice";
import { LendingBorrowingRouter } from "./Routes/LendingBorrowing";
import { TrendingPoolRouter } from "./Routes/TrendingPool";
import { UserPortfolioRouter } from "./Routes/UserPortfolio";
import bodyParser from "body-parser";
import { userPositionRouter } from "./Routes/AnalayseUserPostion";
import { userPoolRouter } from "./Routes/getUserPositons";
import { lendBorrowRouterPost } from "./Routes/LendBorrow";
import cors from "cors";
dotenv.config();


const app: Express = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/agent",agentRouter)
app.use("/marketAnalysis",MarketAnalysisRouter)
app.use("/historicalPrice",HistoricalPriceRouter)
app.use("/lendingBorrow",LendingBorrowingRouter)
app.use("/trendingPool",TrendingPoolRouter)
app.use("/userPortfolio",UserPortfolioRouter)
app.use("/userAnalysis",userPositionRouter) //this is for the yield agent
app.use("/getUserPoolData",userPoolRouter)
app.use("/lendBorrowPost",lendBorrowRouterPost)
const port = process.env.PORT || 3002;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});



app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});


