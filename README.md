# DeFi Agent Backend

## 📌 Overview
The **DeFi Agent Backend** is an Express.js-based API that provides various endpoints for DeFi-related functionalities, including market analysis, historical price tracking, lending/borrowing operations, trending pools, and user portfolio management.

## 🚀 Features
- Market analysis for DeFi assets
- Historical price tracking
- Lending & borrowing functionality
- Trending liquidity pool analysis
- User portfolio tracking

## 🛠️ Tech Stack
- **Backend**: Node.js, Express.js, TypeScript
- **Middleware**: CORS, Body-Parser
- **Environment Management**: dotenv

## 📂 Project Structure
```
DeFi-Agent-Backend/
│-- src/
|   |-- Components/
        |--Agents
        |-- Common
        |-- Functions
│   │-- Routes/
│   │   ├── Agent.ts
│   │   ├── MarketAnalysis.ts
│   │   ├── HistoricalPrice.ts
│   │   ├── LendingBorrowing.ts
│   │   ├── TrendingPool.ts
│   │   ├── UserPortfolio.ts
│   ├── index.ts
│-- .env
│-- package.json
│-- tsconfig.json
```

## 📌 Installation & Setup

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/Devanshgoel-123/MoveAi-Backend.git
cd AgentBackend
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Set Up Environment Variables
Create a `.env` file and add necessary configurations:
```
PORT=3002
DATABASE_URL
DIRECT_URL
PRIVATE_KEY
ANTHROPIC_API_KEY
HISTORY_API_KEY
BLOCK_API_KEY
COINMARKETCAP_API_KEY
```

### 4️⃣ Start the Server
```sh
npm run dev   # For development (with Nodemon)
npm start     # For production
```

## 📌 API Endpoints

| Method | Endpoint                    | Description                     |
|--------|-----------------------------|---------------------------------|
| `POST` | `/agent`                    | Interact with the agent         |
| `GET` | `/marketAnalysis`           | Get market analysis             |
| `GET` | `/historicalPrice`          | Fetch historical price data     |
| `POST` | `/lendingBorrow/:tokenName` | Handle lending/borrowing actions|
| `GET` | `/trendingPool/:tokenName`  | Get trending liquidity pools    |
| `GET` | `/userPortfolio`            | Fetch user portfolio data       |


## 📜 License
This project is licensed under the MIT License.

## 📬 Contact
For queries, reach out at [your-email@example.com](devanshgoel112233@gmail.com).

