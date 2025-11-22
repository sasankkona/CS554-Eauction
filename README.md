# E-Auction Platform - Blockchain-Based Decentralized Auction System

A fully functional decentralized auction platform built with **Solidity**, **Hardhat**, **React**, and **ethers.js**. This platform allows users to create auctions, place bids, and manage their auctions in a trustless, blockchain-powered environment.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
  - [System Architecture](#system-architecture)
  - [Component Architecture](#component-architecture)
  - [Dependency Graph](#dependency-graph)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [Smart Contract Details](#smart-contract-details)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     E-AUCTION PLATFORM                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │         │                  │
│   React Frontend │◄───────►│   ethers.js      │◄───────►│   MetaMask       │
│   (UI Layer)     │         │   (Web3 Client)  │         │   (Wallet)       │
│                  │         │                  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
        │                             │                             │
        │                             │                             │
        └─────────────────────────────┴─────────────────────────────┘
                                      │
                                      ▼
                        ┌──────────────────────────┐
                        │   Ethereum Network       │
                        │   (Localhost/Testnet)    │
                        └──────────────────────────┘
                                      │
                                      ▼
                        ┌──────────────────────────┐
                        │   Auction Smart Contract │
                        │   (Solidity)             │
                        └──────────────────────────┘
                                      │
                        ┌─────────────┴─────────────┐
                        │                           │
                   ┌────▼────┐               ┌─────▼─────┐
                   │ Storage │               │  Events   │
                   │ Layer   │               │ (Logs)    │
                   └─────────┘               └───────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  App.jsx (Main Container)                                   │
│    ├── Header Component                                     │
│    ├── Tabs (Active/Ended/Create)                          │
│    ├── AuctionCard Component (Display & Interaction)       │
│    └── CreateAuction Component (Form)                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   WEB3 SERVICE LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  web3.js (Blockchain Interaction)                          │
│    ├── Wallet Connection                                    │
│    ├── Contract Interaction                                 │
│    ├── Transaction Management                               │
│    └── Event Listeners                                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  SMART CONTRACT LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Auction.sol                                                │
│    ├── createAuction()                                      │
│    ├── placeBid()                                          │
│    ├── endAuction()                                        │
│    ├── withdraw()                                          │
│    └── View Functions                                       │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DEPENDENCY GRAPH                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   package.json  │────►│ hardhat.config.cjs │     │   .gitignore   │
│   (root)        │     │   (networks)     │     │   (excludes)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   contracts/    │────►│   ignition/     │────►│   test/         │
│   Auction.sol   │     │   Auction.js    │     │   Auction.js    │
│   Lock.sol      │     │   Lock.js       │     │   Lock.js       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                                ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   frontend/     │────►│   web3.js       │────►│   Auction.sol   │
│   package.json  │     │   (ethers.js)   │     │   (contract)    │
│   vite.config.js│     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   main.jsx      │────►│   App.jsx       │────►│ AuctionCard.jsx │
│   (entry)       │     │   (container)   │     │ (component)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                       │
                                │                       │
                                └───────────────────────┼───────────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │ CreateAuction.jsx│
                                                │   (component)    │
                                                └─────────────────┘
```

**Dependency Legend:**
- **Solid Arrows (────►)**: Direct file/module dependencies
- **Dashed Arrows (····►)**: Configuration or build dependencies
- **Vertical Flow**: Layered architecture (frontend → web3 → contracts)

**Key Dependencies:**
- **Contracts** → **Ignition** → **Tests**: Smart contracts are deployed via ignition modules and tested
- **Contracts** → **Web3.js** → **Frontend**: Frontend interacts with contracts through web3 service layer
- **App.jsx** → **Components**: Main app renders auction components
- **Package.json** → **All**: Defines project dependencies and scripts
- **Hardhat Config** → **Ignition/Tests**: Provides network configurations

---

## Features

### Smart Contract Features
- Create auctions with title, description, starting price, and duration
- Place bids on active auctions (automatic outbid handling)
- Allow bidders to increase their own bids
- Automatic refund system for outbid bidders
- Seller can end auction after time expires
- Withdraw funds for outbid bidders
- Event emission for all major actions
- Complete access control and validation

### Frontend Features
- Modern, responsive UI with gradient design
- MetaMask wallet integration
- Real-time auction countdown timers
- Live balance updates
- Badge system (Seller, Winner, Outbid)
- Event-driven updates
- Mobile-responsive design
- Fast and intuitive user experience

---

## Technology Stack

### Blockchain
- **Solidity** `^0.8.28` - Smart contract language
- **Hardhat** `^2.22.6` - Development environment
- **ethers.js** `^6.15.0` - Ethereum library

### Frontend
- **React** `^18.3.1` - UI framework
- **Vite** `^6.0.1` - Build tool
- **CSS3** - Styling

### Testing
- **Chai** `^4.5.0` - Assertion library
- **Hardhat Network Helpers** - Time manipulation for testing

---

## Project Structure

```
cs554-eauction3/
│
├── contracts/                      # Smart Contracts
│   ├── Auction.sol                # Main auction contract 
│   └── Lock.sol                   # Sample contract (unused)
│
├── ignition/                      # Deployment Modules
│   └── modules/
│       ├── Auction.js            # Auction deployment script
│       └── Lock.js               # Lock deployment script (unused)
│
├── test/                          # Smart Contract Tests
│   ├── Auction.js                # Comprehensive auction tests 
│   └── Lock.js                   # Sample tests (unused)
│
├── frontend/                      # React Frontend Application
│   ├── src/
│   │   ├── components/           # React Components
│   │   │   ├── AuctionCard.jsx  # Individual auction display 
│   │   │   └── CreateAuction.jsx # Auction creation form 
│   │   │
│   │   ├── utils/                # Utility Functions
│   │   │   └── web3.js          # Web3/Blockchain interaction 
│   │   │
│   │   ├── App.jsx               # Main application component 
│   │   ├── App.css               # Application styles 
│   │   └── main.jsx              # React entry point
│   │
│   ├── index.html                # HTML template
│   ├── vite.config.js            # Vite configuration
│   ├── package.json              # Frontend dependencies
│   └── node_modules/             # Frontend dependencies
│
├── node_modules/                  # Backend dependencies
├── hardhat.config.cjs            # Hardhat configuration
├── package.json                  # Backend dependencies
├── package-lock.json             # Dependency lock file
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

### Detailed File Descriptions

#### Smart Contracts (`contracts/`)

**`Auction.sol`** 
```
Purpose: Main smart contract implementing auction logic
Key Components:
  - Structs:
    └── AuctionItem: Stores auction details
  - Mappings:
    ├── auctions: auction ID → auction data
    └── pendingReturns: auction ID → bidder → amount
  - Functions:
    ├── createAuction(): Create new auction
    ├── placeBid(): Place/increase bid
    ├── endAuction(): End auction and transfer funds
    ├── withdraw(): Withdraw outbid funds
    ├── getAuction(): Get auction details
    ├── getActiveAuctions(): List active auctions
    ├── getTotalAuctions(): Get auction count
    └── getPendingReturn(): Check pending withdrawals
  - Events:
    ├── AuctionCreated
    ├── BidPlaced
    ├── AuctionEnded
    └── FundsWithdrawn
```

#### Deployment (`ignition/modules/`)

**`Auction.js`** 
```
Purpose: Hardhat Ignition deployment configuration
Exports: AuctionModule with deployed Auction contract instance
```

#### Tests (`test/`)

**`Auction.js`** 
```
Test Suites:
  1. Deployment (1 test)
     └── Should deploy successfully
  
  2. Creating Auctions (5 tests)
     ├── Should create with valid parameters
     ├── Should fail with empty title
     ├── Should fail with zero starting price
     ├── Should fail with zero duration
     └── Should increment auction counter
  
  3. Bidding (9 tests)
     ├── Should accept first bid at starting price
     ├── Should accept higher bid
     ├── Should fail with bid below starting price
     ├── Should fail with equal/lower bid
     ├── Should prevent seller bidding
     ├── Should store pending returns
     ├── Should allow bid increases
     ├── Should fail when auction ended
     └── Should fail for non-existent auction
  
  4. Ending Auctions (6 tests)
     ├── Should end and transfer funds
     ├── Should emit AuctionEnded event
     ├── Should fail if not expired
     ├── Should fail if not seller
     ├── Should fail if already ended
     └── Should handle no-bid scenario
  
  5. Withdrawals (5 tests)
     ├── Should allow outbid withdrawal
     ├── Should emit FundsWithdrawn event
     ├── Should fail if no funds
     ├── Should fail to withdraw twice
     └── Should allow multiple withdrawals
  
  6. View Functions (4 tests)
     ├── Should return active auctions
     ├── Should exclude ended auctions
     ├── Should return correct time remaining
     └── Should return zero for expired
```

#### Frontend Components (`frontend/src/`)

**`App.jsx`** 
```
Purpose: Main application container
State Management:
  ├── account: Connected wallet address
  ├── balance: User ETH balance
  ├── contractAddress: Deployed contract address
  ├── activeTab: Current view (auctions/ended/create)
  ├── auctions: List of all auctions
  ├── loading: Loading state
  └── message: Status messages

Key Functions:
  ├── connectWallet(): Connect MetaMask
  ├── handleSetContract(): Set contract address
  ├── loadAuctions(): Fetch all auctions
  └── refreshBalance(): Update wallet balance

Components Rendered:
  ├── Header with wallet info
  ├── Status messages
  ├── Tab navigation
  ├── AuctionCard (multiple instances)
  └── CreateAuction form
```

**`AuctionCard.jsx`** 
```
Purpose: Individual auction display and interaction
Props:
  ├── auction: Auction data object
  ├── currentAccount: User's wallet address
  └── onUpdate: Callback for data refresh

State:
  ├── bidAmount: Current bid input
  ├── showBidForm: Bid form visibility
  ├── loading: Transaction state
  ├── timeRemaining: Live countdown
  └── pendingReturn: Withdrawable amount

Features:
  ├── Real-time countdown timer
  ├── Bid placement form
  ├── Auction ending (seller only)
  ├── Fund withdrawal (outbid users)
  ├── Badge display (Seller/Winner/Outbid)
  └── Responsive actions based on user role
```

**`CreateAuction.jsx`** 
```
Purpose: Auction creation form
State:
  ├── formData: Form field values
  │   ├── title
  │   ├── description
  │   ├── startingPrice
  │   └── duration
  ├── loading: Submission state
  └── message: Form feedback

Validation:
  ├── All fields required
  ├── Starting price > 0
  └── Duration > 0

Duration Options:
  ├── 5 minutes (testing)
  ├── 15, 30 minutes
  ├── 1, 3, 6, 12 hours
  └── 1, 3, 7 days
```

**`web3.js`** 
```
Purpose: Web3 service layer for blockchain interaction
Class: Web3Service

Properties:
  ├── provider: Ethereum provider (MetaMask)
  ├── signer: Transaction signer
  ├── contract: Contract instance
  └── contractAddress: Deployed address

Methods:
  ├── connectWallet(): Initialize connection
  ├── setContractAddress(): Configure contract
  ├── createAuction(): Create new auction
  ├── placeBid(): Place bid on auction
  ├── endAuction(): End auction
  ├── withdraw(): Withdraw funds
  ├── getAuction(): Fetch auction details
  ├── getActiveAuctions(): List active IDs
  ├── getTotalAuctions(): Get count
  ├── getPendingReturn(): Check withdrawals
  ├── getBalance(): Get ETH balance
  ├── formatAddress(): Shorten address
  ├── formatTime(): Format countdown
  ├── listenToEvents(): Subscribe to events
  └── removeAllListeners(): Cleanup

ABI Definition:
  Includes all contract function signatures for interaction
```

#### Configuration Files

**`hardhat.config.cjs`** 
```
Solidity Version: 0.8.28
Networks:
  ├── iitbhilaiBlockchain:
  │   ├── URL: http://10.10.0.60:8550
  │   └── Chain ID: 491002
  └── Ethereum (Sepolia):
      └── URL: Infura endpoint
```

---

## Installation & Setup

### Step 1: Clone or Navigate to Project

**Have you already cloned/downloaded the project?**
- **YES**: Navigate to the project directory
  ```bash
  cd /Users/sasank/Desktop/cs554-eauction3
  ```
- **NO**: Clone or create the project first

### Step 1.5: Create Environment File

Create a `.env` file in the root directory to store sensitive configuration:

```bash
touch .env
```

Add your private key for deployment (replace with your actual private key):

```
PRIVATE_KEY=your_private_key_here
```

**Security Note**: Never commit the `.env` file to version control. It's already in `.gitignore`.

### Step 2: Install Backend Dependencies

```bash
# Install Hardhat and blockchain dependencies
npm install
```


### Step 3: Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install React and frontend dependencies
npm install

# Go back to root
cd ..
```

### Step 4: Verify Installation

**Did all installations complete successfully?**
- **YES**: Proceed to the next section
- **NO**: Check error messages and ensure all prerequisites are met

---

## Usage Guide

### Phase 1: Testing Smart Contracts

**Do you want to run tests first?**
- **YES**: Recommended to ensure everything works
  ```bash
  npx hardhat test
  ```
  **Expected result**: All 30 tests should pass ✓
  
- **NO**: Skip to deployment

### Phase 2: Start Local Blockchain

**Open Terminal 1:**
```bash
npx hardhat node
```

**Expected output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...
```

**Keep this terminal running!** 

### Phase 3: Deploy Smart Contract

**Open Terminal 2:**
```bash
npx hardhat ignition deploy ./ignition/modules/Auction.js --network localhost
```

**Did deployment succeed?**
- **YES**: Copy the contract address (e.g., `0x5FbDB2315678afecb367f032d93F642f64180aa3`)
- **NO**: Ensure Terminal 1 (Hardhat node) is running

**Save this address - you'll need it!**

### Phase 4: Configure MetaMask

**Is MetaMask connected to localhost network?**
- **YES**: Skip to Phase 5
- **NO**: Follow these steps:

1. **Add Localhost Network to MetaMask:**
   - Open MetaMask
   - Click network dropdown → "Add Network" → "Add Network Manually"
   - Fill in:
     ```
     Network Name: Localhost 8545
     RPC URL: http://127.0.0.1:8545
     Chain ID: 31337
     Currency Symbol: ETH
     ```
   - Click "Save"

2. **Import Test Account:**
   - Click account icon → "Import Account"
   - Copy private key from Terminal 1 (one of the test accounts)
   - Paste and import
   - **Note**: Only use for testing! Never use these keys on mainnet!

### Phase 5: Start Frontend

**Open Terminal 3:**
```bash
cd frontend
npm run dev
```

**Expected output:**
```
  VITE v6.0.1  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**Did the browser open automatically?**
- **YES**: Continue to Phase 6
- **NO**: Open browser manually and go to `http://localhost:3000`

### Phase 6: Use the Application

1. **Connect Wallet:**
   - Click "Connect Wallet"
   - Approve MetaMask connection
   - **Success indicator**: Your address appears in header

2. **Set Contract Address:**
   - Click "Set Contract Address"
   - Paste the address from Phase 3
   - **Success indicator**: "Contract address set successfully!"

3. **Create Your First Auction:**
   - Click "Create Auction" tab
   - Fill in:
     - **Title**: "Vintage Watch"
     - **Description**: "Beautiful 1950s timepiece"
     - **Starting Price**: 0.1 (ETH)
     - **Duration**: 5 minutes (for testing)
   - Click "Create Auction"
   - Approve transaction in MetaMask
   - **Success**: Auction appears in Active Auctions

4. **Place a Bid:**
   - Switch MetaMask to a different test account
   - Refresh page
   - Click "Place Bid" on an auction
   - Enter bid amount (must be ≥ starting price or > current bid)
   - Confirm transaction
   - **Success**: You're now the highest bidder!

5. **End an Auction:**
   - Wait for auction timer to expire
   - Switch to seller account
   - Click "End Auction"
   - **Success**: Funds transferred to seller

6. **Withdraw Funds (if outbid):**
   - Switch to outbid bidder account
   - Click "Withdraw Funds"
   - **Success**: Funds returned to your wallet

---

## Smart Contract Details

### Main Functions

#### `createAuction()`
```solidity
function createAuction(
    string memory _title,
    string memory _description,
    uint256 _startingPrice,
    uint256 _duration
) external returns (uint256)
```
- Creates a new auction
- Returns auction ID
- Emits `AuctionCreated` event

#### `placeBid()`
```solidity
function placeBid(uint256 _auctionId) external payable
```
- Places a bid on an auction
- Must send ETH with transaction
- Automatically handles outbid refunds
- Emits `BidPlaced` event

#### `endAuction()`
```solidity
function endAuction(uint256 _auctionId) external
```
- Ends an auction (seller only)
- Transfers funds to seller
- Only after auction expires
- Emits `AuctionEnded` event

#### `withdraw()`
```solidity
function withdraw(uint256 _auctionId) external
```
- Withdraws funds for outbid bidders
- Secure pull-over-push pattern
- Emits `FundsWithdrawn` event

### View Functions

- `getAuction(uint256 _auctionId)`: Get auction details
- `getActiveAuctions()`: Get all active auction IDs
- `getTotalAuctions()`: Get total number of auctions
- `getPendingReturn(uint256 _auctionId, address _bidder)`: Get pending withdrawals

### Events

```solidity
event AuctionCreated(uint256 indexed auctionId, string title, address indexed seller, uint256 startingPrice, uint256 endTime);
event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 amount);
event FundsWithdrawn(address indexed user, uint256 amount);
```

---

## Testing

### Run All Tests

```bash
npx hardhat test
```

### Run Specific Test File

```bash
npx hardhat test test/Auction.js
```

### Run Tests with Gas Reporting

```bash
REPORT_GAS=true npx hardhat test
```

### Test Coverage

```bash
npx hardhat coverage
```


## Deployment

### Deploy to Localhost

```bash
npx hardhat ignition deploy ./ignition/modules/Auction.js --network localhost
```

### Deploy to IIT Bhilai Blockchain

**Is the IIT Bhilai blockchain network accessible?**
- **YES**:
  ```bash
  npx hardhat ignition deploy ./ignition/modules/Auction.js --network iitbhilaiBlockchain
  ```
- **NO**: Use localhost or Ethereum testnet

### Deploy to Ethereum Sepolia Testnet

**Do you have Sepolia ETH?**
- **YES**:
  ```bash
  npx hardhat ignition deploy ./ignition/modules/Auction.js --network sepholia
  ```
- **NO**: Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

** Important**: Update private key in `hardhat.config.cjs` with your actual key (never commit this!)

---

## Troubleshooting

### Common Issues

#### 1. MetaMask Connection Failed

**Problem**: "MetaMask is not installed!"

**Solution**:
- Install MetaMask browser extension
- Refresh the page after installation
- Ensure MetaMask is unlocked

#### 2. Transaction Failed

**Problem**: Transaction reverted

**Possible causes and solutions**:
- **Insufficient balance**: Add more test ETH to account
- **Bid too low**: Increase bid amount
- **Auction ended**: Cannot bid on expired auctions
- **Not auction seller**: Only seller can end auction

#### 3. Contract Not Found

**Problem**: "Contract not initialized"

**Solution**:
- Ensure Hardhat node is running (Terminal 1)
- Verify contract is deployed
- Check contract address is set correctly in frontend

#### 4Frontend Not Loading

**Problem**: Blank page or errors

**Solution**:
- Run `npm install` in frontend directory
- Check console for errors (F12)
- Ensure port 3000 is not in use
- Try clearing browser cache

#### 5. Tests Failing

**Problem**: Some tests don't pass

**Solution**:
- Run `npm install` to ensure dependencies are installed
- Clear cache: `npx hardhat clean`
- Recompile: `npx hardhat compile`

#### 6. Time-Related Test Issues

**Problem**: "Time remaining" tests fail

**Solution**:
- Tests manipulate blockchain time using Hardhat helpers
- Ensure using Hardhat network (not external network)

---

## Security Considerations

### Current Implementation
Reentrancy protection via pull-over-push pattern  
Access control  
Input validation  
Safe math (Solidity 0.8+)  

### Recommendations for Production
- Implement `ReentrancyGuard` from OpenZeppelin
- Add pause/unpause functionality
- Implement upgrade patterns 
- Complete security audit
- Add rate limiting
- Implement IPFS for auction metadata
- Add dispute resolution mechanism

---
