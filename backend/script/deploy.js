const {ethers} = require("hardhat")

async function main(){
    const [deployer] = await ethers.getSigners();
    console.log(deployer.address);

    const scape = await ethers.getContractFactory("Scape")
    const  token = await scape.deploy(
        deployer.address,
        deployer.address,
        [deployer.address],
        [deployer.address]
    )
    await token.waitForDeployment();
    console.log("Token deployed to:", await token.getAddress());

}

// contract address :   0x5FbDB2315678afecb367f032d93F642f64180aa3

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });