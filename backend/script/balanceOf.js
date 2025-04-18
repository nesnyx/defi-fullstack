const {ethers} = require("hardhat")

async function main() {

  const [deployer] = await ethers.getSigners();

  console.log("Using deployer address:", deployer.address);


  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // <--- Ganti ini!
  const DeFi = await ethers.getContractFactory("DeFi");
  const defi = DeFi.attach(contractAddress);
  const balance = await defi.checkBalanceOf("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")


  console.log("Balance of address:", ethers.formatUnits(balance, 18), "SDFR");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
