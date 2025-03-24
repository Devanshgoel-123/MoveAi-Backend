import express, { Router } from "express";
import { Response,Request } from "express";
import { PrismaClient } from "@prisma/client";
import { AptosAccount } from "@martiandao/aptos-web3.js";
import dotenv from "dotenv";
import crypto from "crypto";
export const walletRouter:Router=express.Router();

const prisma=new PrismaClient();
const ALGORITHM = "aes-256-cbc"; 
const SECRET_KEY = process.env.ENCRYPTION_KEY || "default_key_should_be_32_bytes"; 
const IV = Buffer.alloc(16, "0"); 
const key = crypto.createHash("sha256").update(String(SECRET_KEY)).digest();

export function encryptPrivateKey(privateKey: string): string {
    const cipher = crypto.createCipheriv(ALGORITHM, key, IV);
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
}

export function decryptPrivateKey(encryptedData: string): string {
    if (!encryptedData) {
        throw new Error("No encrypted data provided");
    }
    const decipher = crypto.createDecipheriv(ALGORITHM, key, IV);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
walletRouter.post("/",async (req:Request,res:Response):Promise<any>=>{
    try{
    const {walletAddress}=req.body;
     const user=await prisma.user.findFirst({
        where:{
            primaryWalletAddress:walletAddress.toLowerCase()
        }
     })
     if(user===null){
        const wallet=new AptosAccount();
        const agentWalletAddress = wallet.address().hex();
        const privateKey = wallet.toPrivateKeyObject().privateKeyHex;
        const encryptedKey = encryptPrivateKey(privateKey);
        const user = await prisma.user.create({
            data: {
                primaryWalletAddress: walletAddress,
                privateKey: encryptedKey,
                agentWalletAddress:agentWalletAddress
            },
        });
        return res.status(201).json({
            success: true,
            walletAddress:user.primaryWalletAddress,
            agentWalletAddress:user.agentWalletAddress
        });

    }else{
        return res.status(201).json({
            success: true,
            walletAddress:user.primaryWalletAddress,
            agentWalletAddress:user.agentWalletAddress,
        });
    }
}catch(err){
         console.log("the error here is,",err)
         return err;
    }
})