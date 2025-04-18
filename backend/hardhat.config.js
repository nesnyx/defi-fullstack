require("@nomicfoundation/hardhat-toolbox");
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks:{
    hardhat:{},
    sepolia :{
      url:"https://sepolia.infura.io/v3/e1b4e4d144b040249c3a1058a5c9ee19",
      accounts:["4b6bbb676215dc4310647b0ea28499dc8a7cf7aa79e6e39a8610b326a2e9783d"]
    }
  },
  solidity: "0.8.28",
};
