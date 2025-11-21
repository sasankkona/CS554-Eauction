const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction", function () {
  async function deployAuctionFixture() {
    const [owner, seller, bidder1, bidder2, bidder3] = await ethers.getSigners();

    const Auction = await ethers.getContractFactory("Auction");
    const auction = await Auction.deploy();

    return { auction, owner, seller, bidder1, bidder2, bidder3 };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);
      expect(await auction.getTotalAuctions()).to.equal(0);
    });
  });

  describe("Creating Auctions", function () {
    it("Should create an auction with valid parameters", async function () {
      const { auction, seller } = await loadFixture(deployAuctionFixture);
      
      const title = "Vintage Watch";
      const description = "A beautiful vintage watch from 1950s";
      const startingPrice = ethers.parseEther("1.0");
      const duration = 3600; // 1 hour

      await expect(
        auction.connect(seller).createAuction(title, description, startingPrice, duration)
      ).to.emit(auction, "AuctionCreated")
        .withArgs(0, title, seller.address, startingPrice, await time.latest() + duration + 1);

      const auctionData = await auction.getAuction(0);
      expect(auctionData.title).to.equal(title);
      expect(auctionData.description).to.equal(description);
      expect(auctionData.startingPrice).to.equal(startingPrice);
      expect(auctionData.seller).to.equal(seller.address);
    });

    it("Should fail with empty title", async function () {
      const { auction, seller } = await loadFixture(deployAuctionFixture);
      
      await expect(
        auction.connect(seller).createAuction("", "Description", ethers.parseEther("1.0"), 3600)
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should fail with zero starting price", async function () {
      const { auction, seller } = await loadFixture(deployAuctionFixture);
      
      await expect(
        auction.connect(seller).createAuction("Title", "Description", 0, 3600)
      ).to.be.revertedWith("Starting price must be greater than 0");
    });

    it("Should fail with zero duration", async function () {
      const { auction, seller } = await loadFixture(deployAuctionFixture);
      
      await expect(
        auction.connect(seller).createAuction("Title", "Description", ethers.parseEther("1.0"), 0)
      ).to.be.revertedWith("Duration must be greater than 0");
    });

    it("Should increment auction counter", async function () {
      const { auction, seller } = await loadFixture(deployAuctionFixture);
      
      await auction.connect(seller).createAuction("Item 1", "Desc 1", ethers.parseEther("1.0"), 3600);
      await auction.connect(seller).createAuction("Item 2", "Desc 2", ethers.parseEther("2.0"), 3600);
      
      expect(await auction.getTotalAuctions()).to.equal(2);
    });
  });

  describe("Bidding", function () {
    async function createAuctionFixture() {
      const { auction, owner, seller, bidder1, bidder2, bidder3 } = await loadFixture(deployAuctionFixture);
      
      const startingPrice = ethers.parseEther("1.0");
      const duration = 3600;
      
      await auction.connect(seller).createAuction(
        "Test Item",
        "Test Description",
        startingPrice,
        duration
      );

      return { auction, owner, seller, bidder1, bidder2, bidder3, startingPrice };
    }

    it("Should accept first bid at starting price", async function () {
      const { auction, bidder1, startingPrice } = await loadFixture(createAuctionFixture);
      
      await expect(
        auction.connect(bidder1).placeBid(0, { value: startingPrice })
      ).to.emit(auction, "BidPlaced")
        .withArgs(0, bidder1.address, startingPrice);

      const auctionData = await auction.getAuction(0);
      expect(auctionData.currentBid).to.equal(startingPrice);
      expect(auctionData.highestBidder).to.equal(bidder1.address);
    });

    it("Should accept higher bid", async function () {
      const { auction, bidder1, bidder2, startingPrice } = await loadFixture(createAuctionFixture);
      
      await auction.connect(bidder1).placeBid(0, { value: startingPrice });
      
      const higherBid = ethers.parseEther("1.5");
      await expect(
        auction.connect(bidder2).placeBid(0, { value: higherBid })
      ).to.emit(auction, "BidPlaced")
        .withArgs(0, bidder2.address, higherBid);

      const auctionData = await auction.getAuction(0);
      expect(auctionData.currentBid).to.equal(higherBid);
      expect(auctionData.highestBidder).to.equal(bidder2.address);
    });

    it("Should fail with bid below starting price", async function () {
      const { auction, bidder1, startingPrice } = await loadFixture(createAuctionFixture);
      
      await expect(
        auction.connect(bidder1).placeBid(0, { value: startingPrice - 1n })
      ).to.be.revertedWith("Bid must be at least starting price");
    });

    it("Should fail with bid not higher than current bid", async function () {
      const { auction, bidder1, bidder2, startingPrice } = await loadFixture(createAuctionFixture);
      
      await auction.connect(bidder1).placeBid(0, { value: startingPrice });
      
      await expect(
        auction.connect(bidder2).placeBid(0, { value: startingPrice })
      ).to.be.revertedWith("Bid must be higher than current bid");
    });

    it("Should prevent seller from bidding on own auction", async function () {
      const { auction, seller, startingPrice } = await loadFixture(createAuctionFixture);
      
      await expect(
        auction.connect(seller).placeBid(0, { value: startingPrice })
      ).to.be.revertedWith("Seller cannot bid on own auction");
    });

    it("Should store pending returns for outbid bidders", async function () {
      const { auction, bidder1, bidder2, startingPrice } = await loadFixture(createAuctionFixture);
      
      await auction.connect(bidder1).placeBid(0, { value: startingPrice });
      await auction.connect(bidder2).placeBid(0, { value: ethers.parseEther("1.5") });

      const pendingReturn = await auction.getPendingReturn(0, bidder1.address);
      expect(pendingReturn).to.equal(startingPrice);
    });

    it("Should allow bidder to increase their bid", async function () {
      const { auction, bidder1, startingPrice } = await loadFixture(createAuctionFixture);
      
      await auction.connect(bidder1).placeBid(0, { value: startingPrice });
      await auction.connect(bidder1).placeBid(0, { value: ethers.parseEther("0.5") });

      const auctionData = await auction.getAuction(0);
      expect(auctionData.currentBid).to.equal(ethers.parseEther("1.5"));
      expect(auctionData.highestBidder).to.equal(bidder1.address);
    });

    it("Should fail when auction has ended", async function () {
      const { auction, bidder1, startingPrice } = await loadFixture(createAuctionFixture);
      
      await time.increase(3601); // Move past auction end time
      
      await expect(
        auction.connect(bidder1).placeBid(0, { value: startingPrice })
      ).to.be.revertedWith("Auction has ended");
    });

    it("Should fail for non-existent auction", async function () {
      const { auction, bidder1 } = await loadFixture(createAuctionFixture);
      
      await expect(
        auction.connect(bidder1).placeBid(999, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Auction does not exist");
    });
  });

  describe("Ending Auctions", function () {
    async function createAuctionWithBidsFixture() {
      const { auction, owner, seller, bidder1, bidder2, bidder3 } = await loadFixture(deployAuctionFixture);
      
      const startingPrice = ethers.parseEther("1.0");
      const duration = 3600;
      
      await auction.connect(seller).createAuction(
        "Test Item",
        "Test Description",
        startingPrice,
        duration
      );

      await auction.connect(bidder1).placeBid(0, { value: ethers.parseEther("1.0") });
      await auction.connect(bidder2).placeBid(0, { value: ethers.parseEther("2.0") });

      return { auction, owner, seller, bidder1, bidder2, bidder3 };
    }

    it("Should end auction and transfer funds to seller", async function () {
      const { auction, seller, bidder2 } = await loadFixture(createAuctionWithBidsFixture);
      
      await time.increase(3601);
      
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      
      const tx = await auction.connect(seller).endAuction(0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      
      expect(sellerBalanceAfter).to.equal(
        sellerBalanceBefore + ethers.parseEther("2.0") - gasUsed
      );

      const auctionData = await auction.getAuction(0);
      expect(auctionData.ended).to.be.true;
    });

    it("Should emit AuctionEnded event", async function () {
      const { auction, seller, bidder2 } = await loadFixture(createAuctionWithBidsFixture);
      
      await time.increase(3601);
      
      await expect(
        auction.connect(seller).endAuction(0)
      ).to.emit(auction, "AuctionEnded")
        .withArgs(0, bidder2.address, ethers.parseEther("2.0"));
    });

    it("Should fail if auction not ended yet", async function () {
      const { auction, seller } = await loadFixture(createAuctionWithBidsFixture);
      
      await expect(
        auction.connect(seller).endAuction(0)
      ).to.be.revertedWith("Auction has not ended yet");
    });

    it("Should fail if not called by seller", async function () {
      const { auction, bidder1 } = await loadFixture(createAuctionWithBidsFixture);
      
      await time.increase(3601);
      
      await expect(
        auction.connect(bidder1).endAuction(0)
      ).to.be.revertedWith("Only seller can end auction");
    });

    it("Should fail if already ended", async function () {
      const { auction, seller } = await loadFixture(createAuctionWithBidsFixture);
      
      await time.increase(3601);
      await auction.connect(seller).endAuction(0);
      
      await expect(
        auction.connect(seller).endAuction(0)
      ).to.be.revertedWith("Auction already ended");
    });

    it("Should handle auction with no bids", async function () {
      const { auction, seller } = await loadFixture(deployAuctionFixture);
      
      await auction.connect(seller).createAuction(
        "No Bids Item",
        "Description",
        ethers.parseEther("1.0"),
        3600
      );

      await time.increase(3601);
      
      await expect(
        auction.connect(seller).endAuction(0)
      ).to.emit(auction, "AuctionEnded")
        .withArgs(0, ethers.ZeroAddress, 0);
    });
  });

  describe("Withdrawals", function () {
    async function createAuctionWithMultipleBidsFixture() {
      const { auction, owner, seller, bidder1, bidder2, bidder3 } = await loadFixture(deployAuctionFixture);
      
      await auction.connect(seller).createAuction(
        "Test Item",
        "Test Description",
        ethers.parseEther("1.0"),
        3600
      );

      await auction.connect(bidder1).placeBid(0, { value: ethers.parseEther("1.0") });
      await auction.connect(bidder2).placeBid(0, { value: ethers.parseEther("2.0") });
      await auction.connect(bidder3).placeBid(0, { value: ethers.parseEther("3.0") });

      return { auction, owner, seller, bidder1, bidder2, bidder3 };
    }

    it("Should allow outbid bidder to withdraw funds", async function () {
      const { auction, bidder1 } = await loadFixture(createAuctionWithMultipleBidsFixture);
      
      const balanceBefore = await ethers.provider.getBalance(bidder1.address);
      
      const tx = await auction.connect(bidder1).withdraw(0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(bidder1.address);
      
      expect(balanceAfter).to.equal(
        balanceBefore + ethers.parseEther("1.0") - gasUsed
      );
    });

    it("Should emit FundsWithdrawn event", async function () {
      const { auction, bidder1 } = await loadFixture(createAuctionWithMultipleBidsFixture);
      
      await expect(
        auction.connect(bidder1).withdraw(0)
      ).to.emit(auction, "FundsWithdrawn")
        .withArgs(bidder1.address, ethers.parseEther("1.0"));
    });

    it("Should fail if no funds to withdraw", async function () {
      const { auction, owner } = await loadFixture(createAuctionWithMultipleBidsFixture);
      
      await expect(
        auction.connect(owner).withdraw(0)
      ).to.be.revertedWith("No funds to withdraw");
    });

    it("Should fail to withdraw twice", async function () {
      const { auction, bidder1 } = await loadFixture(createAuctionWithMultipleBidsFixture);
      
      await auction.connect(bidder1).withdraw(0);
      
      await expect(
        auction.connect(bidder1).withdraw(0)
      ).to.be.revertedWith("No funds to withdraw");
    });

    it("Should allow multiple bidders to withdraw", async function () {
      const { auction, bidder1, bidder2 } = await loadFixture(createAuctionWithMultipleBidsFixture);
      
      await auction.connect(bidder1).withdraw(0);
      await auction.connect(bidder2).withdraw(0);
      
      expect(await auction.getPendingReturn(0, bidder1.address)).to.equal(0);
      expect(await auction.getPendingReturn(0, bidder2.address)).to.equal(0);
    });
  });

  describe("View Functions", function () {
    it("Should return active auctions", async function () {
      const { auction, seller } = await loadFixture(deployAuctionFixture);
      
      await auction.connect(seller).createAuction("Item 1", "Desc 1", ethers.parseEther("1.0"), 3600);
      await auction.connect(seller).createAuction("Item 2", "Desc 2", ethers.parseEther("2.0"), 3600);
      await auction.connect(seller).createAuction("Item 3", "Desc 3", ethers.parseEther("3.0"), 3600);
      
      const activeAuctions = await auction.getActiveAuctions();
      expect(activeAuctions.length).to.equal(3);
    });

    it("Should not include ended auctions in active list", async function () {
      const { auction, seller } = await loadFixture(deployAuctionFixture);
      
      await auction.connect(seller).createAuction("Item 1", "Desc 1", ethers.parseEther("1.0"), 3600);
      await auction.connect(seller).createAuction("Item 2", "Desc 2", ethers.parseEther("2.0"), 100);
      
      await time.increase(101);
      
      const activeAuctions = await auction.getActiveAuctions();
      expect(activeAuctions.length).to.equal(1);
      expect(activeAuctions[0]).to.equal(0);
    });

    it("Should return correct time remaining", async function () {
      const { auction, seller } = await loadFixture(deployAuctionFixture);
      
      await auction.connect(seller).createAuction("Item 1", "Desc 1", ethers.parseEther("1.0"), 3600);
      
      const auctionData = await auction.getAuction(0);
      expect(auctionData.timeRemaining).to.be.closeTo(3600n, 5n);
    });

    it("Should return zero time remaining for expired auction", async function () {
      const { auction, seller } = await loadFixture(deployAuctionFixture);
      
      await auction.connect(seller).createAuction("Item 1", "Desc 1", ethers.parseEther("1.0"), 3600);
      
      await time.increase(3601);
      
      const auctionData = await auction.getAuction(0);
      expect(auctionData.timeRemaining).to.equal(0);
    });
  });
});
