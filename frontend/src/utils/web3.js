// frontend/src/utils/web3.js
import { ethers } from 'ethers';

// ABI - keep names in returns/events consistent with Auction.sol
const AUCTION_ABI = [
  "function createAuction(string _title, string _description, uint256 _startingPrice, uint256 _duration) external returns (uint256)",
  "function placeBid(uint256 _auctionId) external payable",
  "function endAuction(uint256 _auctionId) external",
  "function withdraw(uint256 _auctionId) external",
  "function getAuction(uint256 _auctionId) external view returns (uint256 id, string title, string description, uint256 startingPrice, uint256 currentBid, address seller, address highestBidder, uint256 endTime, bool ended, uint256 timeRemaining)",
  "function getActiveAuctions() external view returns (uint256[] memory)",
  "function getTotalAuctions() external view returns (uint256)",
  "function getPendingReturn(uint256 _auctionId, address _bidder) external view returns (uint256)",
  "event AuctionCreated(uint256 indexed auctionId, string title, address indexed seller, uint256 startingPrice, uint256 endTime)",
  "event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount)",
  "event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 amount)",
  "event FundsWithdrawn(address indexed user, uint256 amount)"
];

export class Web3Service {
  constructor() {
    this.provider = null;    // ethers provider
    this.signer = null;      // ethers signer
    this.contract = null;    // ethers Contract connected to signer OR provider
    this.contractAddress = null;
    this.eventCallbacks = [];
  }

  async connectWallet() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed!');
    }

    try {
      // -----------------------------------------------------
      // 🔹 1. Ensure MetaMask is on Sepolia (11155111)
      // -----------------------------------------------------
      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      // Sepolia Chain ID = 0xaa36a7
      if (chainId !== "0xaa36a7") {
        try {
          // Try switching to Sepolia
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }]
          });
        } catch (switchError) {
          // If Sepolia is not added
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0xaa36a7",
                chainName: "Sepolia Test Network",
                rpcUrls: ["https://sepolia.infura.io/v3/YOUR_INFURA_KEY"],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: ["https://sepolia.etherscan.io"]
              }]
            });
          } else {
            throw switchError;
          }
        }
      }

      // -----------------------------------------------------
      // 🔹 2. Request wallet access
      // -----------------------------------------------------
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // -----------------------------------------------------
      // 🔹 3. Create provider + signer
      // -----------------------------------------------------
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Re-create contract instance with signer
      if (this.contractAddress) {
        this.contract = new ethers.Contract(this.contractAddress, AUCTION_ABI, this.signer);
      } else {
        this.contract = null; // Not critical yet
      }

      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);

      return {
        address,
        balance: ethers.formatEther(balance)
      };

    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }


  setContractAddress(address) {
    this.contractAddress = address;
    if (!this.provider) {
      // create a JsonRpcProvider fallback to window.ethereum if provider isn't created yet
      if (typeof window.ethereum !== 'undefined') {
        this.provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        throw new Error('No provider available - connect wallet or provide provider first');
      }
    }

    // prefer signer (for write txs) if available, else provider for read-only
    const signerOrProvider = this.signer ?? this.provider;
    this.contract = new ethers.Contract(address, AUCTION_ABI, signerOrProvider);
  }

  // Helper: parseReceipt for named events robustly
  _parseEventFromReceipt(receipt, eventName) {
    if (!receipt || !receipt.logs) return null;
    try {
      for (const log of receipt.logs) {
        try {
          const parsed = this.contract.interface.parseLog(log);
          if (parsed && parsed.name === eventName) {
            return parsed;
          }
        } catch (e) {
          // not parsable by this iface - skip
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  async createAuction(title, description, startingPriceEth, durationMinutes) {
    if (!this.contract) throw new Error('Contract not initialized');

    const startingPrice = ethers.parseEther(startingPriceEth.toString());
    const duration = BigInt(durationMinutes) * 60n; // seconds - use bigint for clarity

    const tx = await this.contract.createAuction(title, description, startingPrice, duration);
    const receipt = await tx.wait();

    // Try to parse AuctionCreated event
    const parsed = this._parseEventFromReceipt(receipt, 'AuctionCreated');
    if (parsed) {
      // parsed.args might have auctionId either by name or index.
      const auctionId = parsed.args.auctionId ?? parsed.args[0];
      return auctionId.toString();
    }

    // Fallback: if event wasn't found, query total auctions and return last index
    try {
      const total = await this.getTotalAuctions();
      return (total - 1).toString();
    } catch (e) {
      return null;
    }
  }

  async placeBid(auctionId, bidAmountEth) {
    if (!this.contract) throw new Error('Contract not initialized');

    const bidAmount = ethers.parseEther(bidAmountEth.toString());
    const tx = await this.contract.placeBid(BigInt(auctionId), { value: bidAmount });
    await tx.wait();
  }

  async endAuction(auctionId) {
    if (!this.contract) throw new Error('Contract not initialized');

    const tx = await this.contract.endAuction(BigInt(auctionId));
    await tx.wait();
  }

  async withdraw(auctionId) {
    if (!this.contract) throw new Error('Contract not initialized');

    const tx = await this.contract.withdraw(BigInt(auctionId));
    await tx.wait();
  }

  async getAuction(auctionId) {
    if (!this.contract) throw new Error('Contract not initialized');

    const auction = await this.contract.getAuction(BigInt(auctionId));
    // auction may be an array-like object with named keys thanks to ABI; handle both
    const asObj = {
      id: auction.id ?? auction[0],
      title: auction.title ?? auction[1],
      description: auction.description ?? auction[2],
      startingPrice: auction.startingPrice ?? auction[3],
      currentBid: auction.currentBid ?? auction[4],
      seller: auction.seller ?? auction[5],
      highestBidder: auction.highestBidder ?? auction[6],
      endTime: auction.endTime ?? auction[7],
      ended: auction.ended ?? auction[8],
      timeRemaining: auction.timeRemaining ?? auction[9]
    };

    return {
      id: asObj.id.toString(),
      title: asObj.title,
      description: asObj.description,
      startingPrice: ethers.formatEther(asObj.startingPrice),
      currentBid: ethers.formatEther(asObj.currentBid),
      seller: asObj.seller,
      highestBidder: asObj.highestBidder,
      endTime: Number(asObj.endTime),
      ended: Boolean(asObj.ended),
      timeRemaining: Number(asObj.timeRemaining)
    };
  }

  async getActiveAuctions() {
    if (!this.contract) throw new Error('Contract not initialized');

    const auctionIds = await this.contract.getActiveAuctions();
    return auctionIds.map(id => id.toString());
  }

  async getTotalAuctions() {
    if (!this.contract) throw new Error('Contract not initialized');

    const total = await this.contract.getTotalAuctions();
    return Number(total);
  }

  async getPendingReturn(auctionId, address) {
    if (!this.contract) throw new Error('Contract not initialized');

    const amount = await this.contract.getPendingReturn(BigInt(auctionId), address);
    return ethers.formatEther(amount);
  }

  async getBalance(address) {
    if (!this.provider) throw new Error('Provider not initialized');

    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  formatTime(seconds) {
    if (!seconds || seconds <= 0) return 'Expired';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  listenToEvents(callback) {
    if (!this.contract) return;
    // store callbacks for potential removal
    const onAuctionCreated = (...args) => callback('AuctionCreated', args);
    const onBidPlaced = (...args) => callback('BidPlaced', args);
    const onAuctionEnded = (...args) => callback('AuctionEnded', args);
    const onFundsWithdrawn = (...args) => callback('FundsWithdrawn', args);

    this.eventCallbacks = [
      { name: 'AuctionCreated', fn: onAuctionCreated },
      { name: 'BidPlaced', fn: onBidPlaced },
      { name: 'AuctionEnded', fn: onAuctionEnded },
      { name: 'FundsWithdrawn', fn: onFundsWithdrawn }
    ];

    this.contract.on('AuctionCreated', onAuctionCreated);
    this.contract.on('BidPlaced', onBidPlaced);
    this.contract.on('AuctionEnded', onAuctionEnded);
    this.contract.on('FundsWithdrawn', onFundsWithdrawn);
  }

  removeAllListeners() {
    if (!this.contract) return;
    for (const cb of this.eventCallbacks) {
      try { this.contract.off(cb.name, cb.fn); } catch (e) { }
    }
    this.eventCallbacks = [];
  }
}

export default new Web3Service();
