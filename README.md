# 🫙 Web3 Tip Jar

A decentralized tip jar dapp where users can send tips in ETH or ERC-20 tokens on the Sepolia testnet.

## 🚀 Features

- **Wallet Connection**: Connect with MetaMask, WalletConnect, or injected wallets
- **ETH Tips**: Send tips directly in ETH
- **Token Tips**: Send tips using custom ERC-20 tokens
- **Real-time Stats**: View total tips received and your contribution history
- **Responsive UI**: Beautiful, modern interface with dark mode support

## 🛠️ Tech Stack

### Smart Contracts
- **Hardhat**: Development environment and testing framework
- **Solidity**: Smart contract language
- **OpenZeppelin**: Secure, audited contract libraries
- **Viem**: Type-safe Ethereum library for testing

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Wagmi**: React hooks for Ethereum
- **Viem**: Type-safe Ethereum library

## 📁 Project Structure

```
web3-tipjar/
├── contracts/                 # Smart contracts
│   ├── contracts/
│   │   ├── TipJar.sol        # Main tip jar contract
│   │   └── TipToken.sol      # ERC-20 token for testing
│   ├── test/
│   │   └── TipJar.test.js    # Contract tests
│   └── scripts/
│       └── deploy.js         # Deployment script
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components
│   │   └── lib/              # Configuration and utilities
│   └── contract-addresses.json # Deployed contract addresses
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or compatible wallet
- Sepolia testnet ETH (get from [faucets](https://ethereum.org/en/developers/docs/networks/#sepolia))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd web3-tipjar
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install contract dependencies
   cd contracts
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # In frontend directory, create .env.local
   echo "NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id" > .env.local
   ```

4. **Deploy contracts to Sepolia**
   ```bash
   # From contracts directory
   npx hardhat run scripts/deploy.js --network sepolia
   ```

5. **Start the frontend**
   ```bash
   # From frontend directory
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🧪 Testing

### Smart Contract Tests
```bash
cd contracts
npx hardhat test
```

### Frontend Development
```bash
cd frontend
npm run dev
```

## 📝 Smart Contracts

### TipJar.sol
The main contract that handles:
- ETH tips via `tip()` function
- ERC-20 token tips via `tipWithToken()` function
- Owner withdrawals via `withdrawETH()` and `withdrawToken()`
- Event emission for tracking tips

### TipToken.sol
A simple ERC-20 token for testing:
- 1,000,000 tokens minted to deployer
- Owner can mint additional tokens
- Used for testing token tipping functionality

## 🔧 Configuration

### Network Configuration
The app is configured for Sepolia testnet by default. To change networks:

1. Update `hardhat.config.ts` in contracts directory
2. Update `wagmi.ts` in frontend/src/lib directory
3. Redeploy contracts to the new network

### WalletConnect Project ID
Get your project ID from [WalletConnect Cloud](https://cloud.reown.com) and add it to your `.env.local` file.

## 🎯 Usage

1. **Connect Wallet**: Click "Connect" and select your preferred wallet
2. **Choose Tip Type**: Toggle between ETH and TIP token tips
3. **Enter Amount**: Specify the amount you want to tip
4. **Send Tip**: Click the tip button and confirm the transaction
5. **View History**: Check your tipping history and total contributions

## 🚧 Roadmap

- [ ] Deploy to mainnet
- [ ] Add more ERC-20 token support
- [ ] Implement tip history with event logs
- [ ] Add admin dashboard for withdrawals
- [ ] Support for multiple tip recipients
- [ ] Mobile app version

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This is a demo project for educational purposes. Use at your own risk. Always test thoroughly before using with real funds.