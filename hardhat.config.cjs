require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    iitbhilaiBlockchain: {
      url: "http://10.10.0.60:8550",
      chainId: 491002,
      accounts: [process.env.PRIVATE_KEY]
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/6e2e875f3ce04b45a0836e0e81f16e05",
      chainId: 11155111,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};