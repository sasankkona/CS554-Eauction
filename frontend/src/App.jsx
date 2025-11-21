import { useState, useEffect } from 'react';
import './App.css';
import web3Service from './utils/web3';
import AuctionCard from './components/AuctionCard';
import CreateAuction from './components/CreateAuction';

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [contractAddress, setContractAddress] = useState('');
  const [activeTab, setActiveTab] = useState('auctions');
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    // Check if wallet was previously connected
    checkConnection();
  }, []);

  useEffect(() => {
    if (account && contractAddress) {
      loadAuctions();
      
      // Set up event listeners
      web3Service.listenToEvents((eventName, args) => {
        console.log('Event received:', eventName, args);
        loadAuctions();
      });

      return () => {
        web3Service.removeAllListeners();
      };
    }
  }, [account, contractAddress]);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    try {
      const wallet = await web3Service.connectWallet();
      setAccount(wallet.address);
      setBalance(wallet.balance);
      setMessage({ text: 'Wallet connected successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setMessage({ text: error.message, type: 'error' });
    }
  };

  const handleSetContract = () => {
    const address = prompt('Enter the deployed Auction contract address:');
    if (address) {
      web3Service.setContractAddress(address);
      setContractAddress(address);
      setMessage({ text: 'Contract address set successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      loadAuctions();
    }
  };

  const loadAuctions = async () => {
    setLoading(true);
    try {
      const total = await web3Service.getTotalAuctions();
      const auctionList = [];
      
      for (let i = 0; i < total; i++) {
        try {
          const auction = await web3Service.getAuction(i);
          auctionList.push(auction);
        } catch (error) {
          console.error(`Error loading auction ${i}:`, error);
        }
      }
      
      setAuctions(auctionList);
    } catch (error) {
      console.error('Error loading auctions:', error);
      setMessage({ text: 'Failed to load auctions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    if (account) {
      try {
        const newBalance = await web3Service.getBalance(account);
        setBalance(newBalance);
      } catch (error) {
        console.error('Error refreshing balance:', error);
      }
    }
  };

  const activeAuctions = auctions.filter(a => !a.ended && a.timeRemaining > 0);
  const endedAuctions = auctions.filter(a => a.ended || a.timeRemaining === 0);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">🏛️ E-Auction Platform</div>
          {account ? (
            <div className="wallet-info">
              <div className="wallet-address">{web3Service.formatAddress(account)}</div>
              <div className="wallet-balance">{parseFloat(balance).toFixed(4)} ETH</div>
            </div>
          ) : (
            <button className="btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <div className="container">
        {message.text && (
          <div className={`status-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {!account ? (
          <div className="connect-wallet">
            <h2>Welcome to E-Auction Platform</h2>
            <p>A decentralized auction platform powered by blockchain technology</p>
            <button className="btn-primary" onClick={connectWallet}>
              Connect Your Wallet to Get Started
            </button>
          </div>
        ) : !contractAddress ? (
          <div className="connect-wallet">
            <h2>Set Contract Address</h2>
            <p>Enter the deployed Auction contract address to start using the platform</p>
            <button className="btn-primary" onClick={handleSetContract}>
              Set Contract Address
            </button>
            <p style={{ marginTop: '1rem', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
              Deploy the contract first using: <code>npx hardhat ignition deploy ./ignition/modules/Auction.js --network localhost</code>
            </p>
          </div>
        ) : (
          <>
            <div className="tabs">
              <button 
                className={`tab-button ${activeTab === 'auctions' ? 'active' : ''}`}
                onClick={() => setActiveTab('auctions')}
              >
                Active Auctions ({activeAuctions.length})
              </button>
              <button 
                className={`tab-button ${activeTab === 'ended' ? 'active' : ''}`}
                onClick={() => setActiveTab('ended')}
              >
                Ended Auctions ({endedAuctions.length})
              </button>
              <button 
                className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                Create Auction
              </button>
            </div>

            {activeTab === 'create' && (
              <CreateAuction 
                onAuctionCreated={() => {
                  setActiveTab('auctions');
                  loadAuctions();
                  refreshBalance();
                }} 
              />
            )}

            {activeTab === 'auctions' && (
              <>
                {loading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    Loading auctions...
                  </div>
                ) : activeAuctions.length === 0 ? (
                  <div className="empty-state">
                    <h3>No active auctions</h3>
                    <p>Be the first to create an auction!</p>
                    <button 
                      className="btn-primary" 
                      style={{ marginTop: '1rem' }}
                      onClick={() => setActiveTab('create')}
                    >
                      Create Auction
                    </button>
                  </div>
                ) : (
                  <div className="auctions-grid">
                    {activeAuctions.map(auction => (
                      <AuctionCard
                        key={auction.id}
                        auction={auction}
                        currentAccount={account}
                        onUpdate={() => {
                          loadAuctions();
                          refreshBalance();
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'ended' && (
              <>
                {loading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    Loading auctions...
                  </div>
                ) : endedAuctions.length === 0 ? (
                  <div className="empty-state">
                    <h3>No ended auctions</h3>
                    <p>Check back later!</p>
                  </div>
                ) : (
                  <div className="auctions-grid">
                    {endedAuctions.map(auction => (
                      <AuctionCard
                        key={auction.id}
                        auction={auction}
                        currentAccount={account}
                        onUpdate={() => {
                          loadAuctions();
                          refreshBalance();
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
