import { useState } from 'react';
import web3Service from '../utils/web3';

function CreateAuction({ onAuctionCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingPrice: '',
    duration: '60'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!formData.title || !formData.description || !formData.startingPrice || !formData.duration) {
      setMessage({ text: 'Please fill in all fields', type: 'error' });
      return;
    }

    if (parseFloat(formData.startingPrice) <= 0) {
      setMessage({ text: 'Starting price must be greater than 0', type: 'error' });
      return;
    }

    if (parseInt(formData.duration) <= 0) {
      setMessage({ text: 'Duration must be greater than 0', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const auctionId = await web3Service.createAuction(
        formData.title,
        formData.description,
        formData.startingPrice,
        parseInt(formData.duration)
      );
      
      setMessage({ text: `Auction created successfully! ID: ${auctionId}`, type: 'success' });
      setFormData({
        title: '',
        description: '',
        startingPrice: '',
        duration: '60'
      });
      
      if (onAuctionCreated) {
        onAuctionCreated();
      }
    } catch (error) {
      console.error('Error creating auction:', error);
      setMessage({ 
        text: 'Failed to create auction: ' + (error.reason || error.message), 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-auction-form">
      <h2>Create New Auction</h2>
      
      {message.text && (
        <div className={`status-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Vintage Watch"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your item in detail..."
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="startingPrice">Starting Price (ETH) *</label>
          <input
            type="number"
            step="0.001"
            id="startingPrice"
            name="startingPrice"
            value={formData.startingPrice}
            onChange={handleChange}
            placeholder="0.1"
            disabled={loading}
            required
          />
          <small>Minimum bid amount for this auction</small>
        </div>

        <div className="form-group">
          <label htmlFor="duration">Duration (minutes) *</label>
          <select
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            disabled={loading}
            required
          >
            <option value="5">5 minutes (testing)</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="180">3 hours</option>
            <option value="360">6 hours</option>
            <option value="720">12 hours</option>
            <option value="1440">1 day</option>
            <option value="4320">3 days</option>
            <option value="10080">7 days</option>
          </select>
          <small>How long the auction will run</small>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating Auction...' : 'Create Auction'}
        </button>
      </form>
    </div>
  );
}

export default CreateAuction;
