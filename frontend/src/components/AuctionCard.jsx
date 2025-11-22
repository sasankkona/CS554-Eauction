import { useState, useEffect } from 'react';
import web3Service from '../utils/web3';

function AuctionCard({ auction, currentAccount, onUpdate }) {
  const [bidAmount, setBidAmount] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(auction.timeRemaining);
  const [pendingReturn, setPendingReturn] = useState('0');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadPendingReturn();
  }, [auction.id, currentAccount]);

  const loadPendingReturn = async () => {
    try {
      const amount = await web3Service.getPendingReturn(auction.id, currentAccount);
      setPendingReturn(amount);
    } catch (error) {
      console.error('Error loading pending return:', error);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!bidAmount || isNaN(bidAmount) || parseFloat(bidAmount) <= 0) {
      alert('Please enter a valid bid amount');
      return;
    }

    const minBid = auction.currentBid === '0.0' 
      ? parseFloat(auction.startingPrice)
      : parseFloat(auction.currentBid) + 0.00001;

    if (parseFloat(bidAmount) < minBid) {
      alert(`Bid must be greater ${minBid} ETH`);
      return;
    }

    setLoading(true);
    try {
      await web3Service.placeBid(auction.id, bidAmount);
      alert('Bid placed successfully!');
      setBidAmount('');
      setShowBidForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Failed to place bid: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEndAuction = async () => {
    if (!confirm('Are you sure you want to end this auction?')) return;

    setLoading(true);
    try {
      await web3Service.endAuction(auction.id);
      alert('Auction ended successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error ending auction:', error);
      alert('Failed to end auction: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      await web3Service.withdraw(auction.id);
      alert('Funds withdrawn successfully!');
      loadPendingReturn();
      onUpdate();
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      alert('Failed to withdraw: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const isSeller = auction.seller.toLowerCase() === currentAccount.toLowerCase();
  const isHighestBidder = auction.highestBidder.toLowerCase() === currentAccount.toLowerCase();
  const canEndAuction = isSeller && timeRemaining === 0 && !auction.ended;
  const canBid = !isSeller && timeRemaining > 0 && !auction.ended;
  const hasPendingReturn = parseFloat(pendingReturn) > 0;

  return (
    <div className="auction-card">
      <h3>
        {auction.title}
        {isSeller && <span className="badge badge-seller">Your Auction</span>}
        {isHighestBidder && !auction.ended && <span className="badge badge-winner">Winning</span>}
        {!isSeller && !isHighestBidder && hasPendingReturn && <span className="badge badge-outbid">Outbid</span>}
      </h3>
      
      <p>{auction.description}</p>
      
      <div className="auction-info">
        <div className="auction-info-row">
          <span className="auction-info-label">Starting Price:</span>
          <span className="auction-info-value">{auction.startingPrice} ETH</span>
        </div>
        <div className="auction-info-row">
          <span className="auction-info-label">Seller:</span>
          <span className="auction-info-value address">{web3Service.formatAddress(auction.seller)}</span>
        </div>
        {auction.currentBid !== '0.0' && (
          <div className="auction-info-row">
            <span className="auction-info-label">Highest Bidder:</span>
            <span className="auction-info-value address">{web3Service.formatAddress(auction.highestBidder)}</span>
          </div>
        )}
        {hasPendingReturn && (
          <div className="auction-info-row">
            <span className="auction-info-label">Your Pending Return:</span>
            <span className="auction-info-value">{pendingReturn} ETH</span>
          </div>
        )}
      </div>

      <div className="auction-price">
        {auction.currentBid === '0.0' ? 'No bids yet' : `${auction.currentBid} ETH`}
      </div>

      <div className={`auction-timer ${timeRemaining === 0 ? 'expired' : ''}`}>
        {auction.ended ? 'Auction Ended' : web3Service.formatTime(timeRemaining)}
      </div>

      {showBidForm && canBid && (
        <form onSubmit={handlePlaceBid} className="bid-form">
          <input
            type="number"
            step="0.001"
            placeholder="Bid amount (ETH)"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-success" disabled={loading}>
            {loading ? 'Placing...' : 'Confirm'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setShowBidForm(false)} disabled={loading}>
            Cancel
          </button>
        </form>
      )}

      <div className="auction-actions">
        {canBid && !showBidForm && (
          <button className="btn-primary" onClick={() => setShowBidForm(true)} disabled={loading}>
            Place Bid
          </button>
        )}
        
        {canEndAuction && (
          <button className="btn-danger" onClick={handleEndAuction} disabled={loading}>
            {loading ? 'Ending...' : 'End Auction'}
          </button>
        )}
        
        {hasPendingReturn && (
          <button className="btn-success" onClick={handleWithdraw} disabled={loading}>
            {loading ? 'Withdrawing...' : 'Withdraw Funds'}
          </button>
        )}
      </div>
    </div>
  );
}

export default AuctionCard;
