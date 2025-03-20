import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { agentRouter } from "./Routes/Agent";
import cors from "cors";
dotenv.config();

const app: Express = express();
app.use(cors());
app.use("/agent",agentRouter)
const port = process.env.PORT || 5174;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});



app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});


