import { tool } from "@langchain/core/tools";
import { z as Zod } from "zod";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
enum TokenCategory {
  STABLECOIN = "stablecoin",
  NATIVE = "native",
  OTHER = "other"
}

interface UserPreference {
  walletAddress: string;
  targetAllocation: Record<TokenCategory, number>;
  lastUpdated?: Date;
}

export const GetUserDiversificationPreferenceTool = tool(
  async ({ walletAddress }) => {
    try {
      const preference = await prisma.userPortfolioPreference.findUnique({
        where: { walletAddress }
      });
      if (!preference) {
        return {
          success: false,
          message: `No diversification preferences found for wallet address: ${walletAddress}`,
          hasPreference: false
        };
      }
      
      // Format the response
      const userPreference: UserPreference = {
        walletAddress: preference.walletAddress,
        targetAllocation: {
          [TokenCategory.STABLECOIN]: preference.StablePercentage,
          [TokenCategory.NATIVE]: preference.NativePercentage,
          [TokenCategory.OTHER]: preference.OtherPercentage
        },
      };
      
      return {
        success: true,
        message: "User diversification preferences found",
        hasPreference: true,
        preference: userPreference,
        // Include summary for quick reference
        summary: {
          stablecoinPercentage: preference.StablePercentage,
          nativePercentage: preference.NativePercentage,
          otherPercentage: preference.OtherPercentage,
        }
      };
    } catch (error) {
      console.error("Error fetching user preference:", error);
      return {
        success: false,
        message: `Error fetching diversification preference: ${error instanceof Error ? error.message : String(error)}`,
        hasPreference: false
      };
    }
  },
  {
    name: "getUserDiversificationPreference",
    description: "Fetches a user's portfolio diversification preferences based on their wallet address",
    schema: Zod.object({
      walletAddress: Zod.string().describe("The blockchain wallet address of the user")
    })
  }
);

