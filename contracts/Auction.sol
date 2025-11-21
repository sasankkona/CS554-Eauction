// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Auction {
    struct AuctionItem {
        uint256 id;
        string title;
        string description;
        uint256 startingPrice;
        uint256 currentBid;
        address payable seller;
        address payable highestBidder;
        uint256 endTime;
        bool ended;
        bool exists;
    }

    uint256 private auctionCounter;
    mapping(uint256 => AuctionItem) public auctions;
    mapping(uint256 => mapping(address => uint256)) public pendingReturns;
    
    event AuctionCreated(
        uint256 indexed auctionId,
        string title,
        address indexed seller,
        uint256 startingPrice,
        uint256 endTime
    );
    
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );
    
    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 amount
    );
    
    event FundsWithdrawn(
        address indexed user,
        uint256 amount
    );

    modifier auctionExists(uint256 _auctionId) {
        require(auctions[_auctionId].exists, "Auction does not exist");
        _;
    }

    modifier auctionActive(uint256 _auctionId) {
        require(block.timestamp < auctions[_auctionId].endTime, "Auction has ended");
        require(!auctions[_auctionId].ended, "Auction is closed");
        _;
    }

    function createAuction(
        string memory _title,
        string memory _description,
        uint256 _startingPrice,
        uint256 _duration
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_startingPrice > 0, "Starting price must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        uint256 auctionId = auctionCounter++;
        uint256 endTime = block.timestamp + _duration;

        auctions[auctionId] = AuctionItem({
            id: auctionId,
            title: _title,
            description: _description,
            startingPrice: _startingPrice,
            currentBid: 0,
            seller: payable(msg.sender),
            highestBidder: payable(address(0)),
            endTime: endTime,
            ended: false,
            exists: true
        });

        emit AuctionCreated(auctionId, _title, msg.sender, _startingPrice, endTime);
        return auctionId;
    }

    function placeBid(uint256 _auctionId) 
        external 
        payable 
        auctionExists(_auctionId) 
        auctionActive(_auctionId) 
    {
        AuctionItem storage auction = auctions[_auctionId];
        
        require(msg.sender != auction.seller, "Seller cannot bid on own auction");
        
        uint256 totalBid = pendingReturns[_auctionId][msg.sender] + msg.value;
        
        if (auction.currentBid == 0) {
            require(totalBid >= auction.startingPrice, "Bid must be at least starting price");
        } else {
            // If sender is already highest bidder, allow them to add to their bid
            if (msg.sender == auction.highestBidder) {
                require(msg.value > 0, "Must send value to increase bid");
                totalBid = auction.currentBid + msg.value;
            } else {
                require(totalBid > auction.currentBid, "Bid must be higher than current bid");
            }
        }

        if (auction.highestBidder != address(0) && auction.highestBidder != msg.sender) {
            pendingReturns[_auctionId][auction.highestBidder] += auction.currentBid;
        }

        auction.currentBid = totalBid;
        auction.highestBidder = payable(msg.sender);
        pendingReturns[_auctionId][msg.sender] = 0;

        emit BidPlaced(_auctionId, msg.sender, totalBid);
    }

    function endAuction(uint256 _auctionId) 
        external 
        auctionExists(_auctionId) 
    {
        AuctionItem storage auction = auctions[_auctionId];
        
        require(block.timestamp >= auction.endTime, "Auction has not ended yet");
        require(!auction.ended, "Auction already ended");
        require(msg.sender == auction.seller, "Only seller can end auction");

        auction.ended = true;

        if (auction.highestBidder != address(0)) {
            auction.seller.transfer(auction.currentBid);
            emit AuctionEnded(_auctionId, auction.highestBidder, auction.currentBid);
        } else {
            emit AuctionEnded(_auctionId, address(0), 0);
        }
    }

    function withdraw(uint256 _auctionId) external auctionExists(_auctionId) {
        uint256 amount = pendingReturns[_auctionId][msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingReturns[_auctionId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit FundsWithdrawn(msg.sender, amount);
    }

    function getAuction(uint256 _auctionId) 
        external 
        view 
        auctionExists(_auctionId) 
        returns (
            uint256 id,
            string memory title,
            string memory description,
            uint256 startingPrice,
            uint256 currentBid,
            address seller,
            address highestBidder,
            uint256 endTime,
            bool ended,
            uint256 timeRemaining
        ) 
    {
        AuctionItem storage auction = auctions[_auctionId];
        uint256 remaining = 0;
        
        if (block.timestamp < auction.endTime) {
            remaining = auction.endTime - block.timestamp;
        }

        return (
            auction.id,
            auction.title,
            auction.description,
            auction.startingPrice,
            auction.currentBid,
            auction.seller,
            auction.highestBidder,
            auction.endTime,
            auction.ended,
            remaining
        );
    }

    function getActiveAuctions() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < auctionCounter; i++) {
            if (auctions[i].exists && !auctions[i].ended && block.timestamp < auctions[i].endTime) {
                activeCount++;
            }
        }

        uint256[] memory activeAuctions = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < auctionCounter; i++) {
            if (auctions[i].exists && !auctions[i].ended && block.timestamp < auctions[i].endTime) {
                activeAuctions[index] = i;
                index++;
            }
        }

        return activeAuctions;
    }

    function getTotalAuctions() external view returns (uint256) {
        return auctionCounter;
    }

    function getPendingReturn(uint256 _auctionId, address _bidder) 
        external 
        view 
        returns (uint256) 
    {
        return pendingReturns[_auctionId][_bidder];
    }
}
