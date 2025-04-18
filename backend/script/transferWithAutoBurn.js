const {ethers} = require("hardhat")

async function main() {
  // 1. Ambil signer (account) dari Hardhat
  const [deployer] = await ethers.getSigners();

  console.log("Using deployer address:", deployer.address);

  // 2. Attach ke contract yang sudah di-deploy
  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // <--- Ganti ini!
  const DeFi = await ethers.getContractFactory("DeFi");
  const defi = DeFi.attach(contractAddress);

  // 3. Panggil function transferWithAutoBurn
  const tx = await defi.transferWithAutoBurn("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", ethers.parseEther("10"));
  await tx.wait(); // Tunggu transaksi confirm

  console.log("transferWithAutoBurn berhasil!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
