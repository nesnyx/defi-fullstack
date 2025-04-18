const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Scape Contract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployDeFiTokenFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const DeFiToken = await ethers.getContractFactory("Scape");
    const defiToken = await DeFiToken.deploy(
      owner.address,           // initialOwner
      addr2.address,          // taxWallet
      [owner.address, addr1.address], // minters
      [owner.address],        // burners
      [owner.address, addr3.address] // pausers
    );

    await defiToken.deployed();

    // Mint initial tokens to owner
    await defiToken.connect(owner).mint(owner.address, ethers.utils.parseEther("1000000"));

    return { DeFiToken, defiToken, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should set the right owner as DEFAULT_ADMIN_ROLE", async function () {
      const { defiToken, owner } = await loadFixture(deployDeFiTokenFixture);
      expect(await defiToken.hasRole(await defiToken.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should assign MINTER_ROLE to specified addresses", async function () {
      const { defiToken, owner, addr1 } = await loadFixture(deployDeFiTokenFixture);
      expect(await defiToken.hasRole(await defiToken.MINTER_ROLE(), owner.address)).to.be.true;
      expect(await defiToken.hasRole(await defiToken.MINTER_ROLE(), addr1.address)).to.be.true;
    });

    it("Should set correct tax wallet address", async function () {
      const { defiToken, addr2 } = await loadFixture(deployDeFiTokenFixture);
      expect(await defiToken.taxWallet()).to.equal(addr2.address);
    });

    it("Should exclude owner and tax wallet from fees", async function () {
      const { defiToken, owner, addr2 } = await loadFixture(deployDeFiTokenFixture);
      expect(await defiToken.isExcludedFromFees(owner.address)).to.be.true;
      expect(await defiToken.isExcludedFromFees(addr2.address)).to.be.true;
    });
  });

  describe("Transactions", function () {
    const transferAmount = ethers.utils.parseEther("1000");
    const BURN_FEE_PERCENT = 10;
    const TAX_FEE_PERCENT = 2;

    it("Should transfer tokens between accounts without fees if excluded", async function () {
      const { defiToken, owner, addr2 } = await loadFixture(deployDeFiTokenFixture);
      
      await expect(defiToken.connect(owner).transfer(addr2.address, transferAmount))
        .to.emit(defiToken, "Transfer")
        .withArgs(owner.address, addr2.address, transferAmount);

      expect(await defiToken.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should apply burn and tax fees correctly on transfers", async function () {
      const { defiToken, owner, addr1, addr2 } = await loadFixture(deployDeFiTokenFixture);
      
      const initialSupply = await defiToken.totalSupply();
      const initialTaxWalletBalance = await defiToken.balanceOf(addr2.address);

      const tx = await defiToken.connect(owner).transfer(addr1.address, transferAmount);

      const expectedBurn = transferAmount.mul(BURN_FEE_PERCENT).div(100);
      const expectedTax = transferAmount.mul(TAX_FEE_PERCENT).div(100);
      const expectedTransfer = transferAmount.sub(expectedBurn).sub(expectedTax);

      // Check balances
      expect(await defiToken.balanceOf(addr1.address)).to.equal(expectedTransfer);
      expect(await defiToken.balanceOf(addr2.address)).to.equal(initialTaxWalletBalance.add(expectedTax));
      expect(await defiToken.totalSupply()).to.equal(initialSupply.sub(expectedBurn));

      // Check events
      await expect(tx)
        .to.emit(defiToken, "FeesDistributed")
        .withArgs(expectedBurn, expectedTax);
    });

    it("Should fail if sender doesn't have enough balance", async function () {
      const { defiToken, owner, addr1 } = await loadFixture(deployDeFiTokenFixture);
      const initialOwnerBalance = await defiToken.balanceOf(owner.address);

      await expect(
        defiToken.connect(owner).transfer(addr1.address, initialOwnerBalance.add(1))
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await defiToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should update balances after transfers with fees", async function () {
      const { defiToken, owner, addr1 } = await loadFixture(deployDeFiTokenFixture);
      const initialOwnerBalance = await defiToken.balanceOf(owner.address);

      const tx = await defiToken.connect(owner).transfer(addr1.address, transferAmount);

      const expectedBurn = transferAmount.mul(BURN_FEE_PERCENT).div(100);
      const expectedTax = transferAmount.mul(TAX_FEE_PERCENT).div(100);
      const totalDeducted = expectedBurn.add(expectedTax);

      expect(await defiToken.balanceOf(owner.address)).to.equal(initialOwnerBalance.sub(transferAmount));
      expect(await defiToken.balanceOf(addr1.address)).to.equal(transferAmount.sub(totalDeducted));
    });
  });

  describe("Minting", function () {
    const mintAmount = ethers.utils.parseEther("5000");

    it("Should allow minter to mint new tokens", async function () {
      const { defiToken, owner, addr1 } = await loadFixture(deployDeFiTokenFixture);
      const initialSupply = await defiToken.totalSupply();

      await expect(defiToken.connect(addr1).mint(addr1.address, mintAmount))
        .to.emit(defiToken, "TokensMinted")
        .withArgs(addr1.address, addr1.address, mintAmount);

      expect(await defiToken.totalSupply()).to.equal(initialSupply.add(mintAmount));
      expect(await defiToken.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should fail if non-minter tries to mint", async function () {
      const { defiToken, addr2 } = await loadFixture(deployDeFiTokenFixture);
      
      await expect(
        defiToken.connect(addr2).mint(addr2.address, mintAmount)
      ).to.be.revertedWith(/AccessControl:.*/);
    });

    it("Should enforce MAX_SUPPLY limit", async function () {
      const { defiToken, owner } = await loadFixture(deployDeFiTokenFixture);
      const maxSupply = await defiToken.MAX_SUPPLY();
      const currentSupply = await defiToken.totalSupply();
      const exceedAmount = maxSupply.sub(currentSupply).add(1);

      await expect(
        defiToken.connect(owner).mint(owner.address, exceedAmount)
      ).to.be.revertedWith("Max supply exceeded");
    });
  });

  describe("Burning", function () {
    const burnAmount = ethers.utils.parseEther("1000");

    it("Should allow burner to burn tokens", async function () {
      const { defiToken, owner } = await loadFixture(deployDeFiTokenFixture);
      const initialSupply = await defiToken.totalSupply();
      const initialOwnerBalance = await defiToken.balanceOf(owner.address);

      await expect(defiToken.connect(owner).burn(burnAmount))
        .to.emit(defiToken, "TokensBurned")
        .withArgs(owner.address, burnAmount);

      expect(await defiToken.totalSupply()).to.equal(initialSupply.sub(burnAmount));
      expect(await defiToken.balanceOf(owner.address)).to.equal(initialOwnerBalance.sub(burnAmount));
    });

    it("Should fail if non-burner tries to burn", async function () {
      const { defiToken, addr1 } = await loadFixture(deployDeFiTokenFixture);
      
      await expect(
        defiToken.connect(addr1).burn(burnAmount)
      ).to.be.revertedWith(/AccessControl:.*/);
    });

    it("Should fail if trying to burn more than balance", async function () {
      const { defiToken, addr1 } = await loadFixture(deployDeFiTokenFixture);
      
      await expect(
        defiToken.connect(addr1).transferWithAutoBurn(owner.address, burnAmount)
      ).to.be.revertedWith("Not enough tokens");
    });
  });

  describe("Pausable", function () {
    const transferAmount = ethers.utils.parseEther("100");

    it("Should allow pauser to pause and unpause", async function () {
      const { defiToken, owner, addr3 } = await loadFixture(deployDeFiTokenFixture);
      
      await defiToken.connect(addr3).pause();
      expect(await defiToken.paused()).to.be.true;

      await defiToken.connect(owner).unpause();
      expect(await defiToken.paused()).to.be.false;
    });

    it("Should prevent non-pausers from pausing", async function () {
      const { defiToken, addr1 } = await loadFixture(deployDeFiTokenFixture);
      
      await expect(
        defiToken.connect(addr1).pause()
      ).to.be.revertedWith(/AccessControl:.*/);
    });

    it("Should block transfers when paused", async function () {
      const { defiToken, owner, addr1 } = await loadFixture(deployDeFiTokenFixture);
      
      await defiToken.connect(owner).pause();
      
      await expect(
        defiToken.connect(owner).transfer(addr1.address, transferAmount)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow transfers when unpaused", async function () {
      const { defiToken, owner, addr1 } = await loadFixture(deployDeFiTokenFixture);
      
      await defiToken.connect(owner).pause();
      await defiToken.connect(owner).unpause();
      
      await expect(defiToken.connect(owner).transfer(addr1.address, transferAmount))
        .to.emit(defiToken, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });
  });

  describe("Fee Management", function () {
    it("Should correctly calculate fees for small amounts", async function () {
      const { defiToken, owner, addr1 } = await loadFixture(deployDeFiTokenFixture);
      const smallAmount = 15; // 15 wei
      
      await defiToken.connect(owner).transfer(addr1.address, smallAmount);
      
      // 10% of 15 = 1.5 → 1 (rounded down)
      // 2% of 15 = 0.3 → 0 (rounded down)
      expect(await defiToken.balanceOf(addr1.address)).to.equal(14); // 15 - 1 - 0
    });

    it("Should handle fee exclusion correctly", async function () {
      const { defiToken, owner, addr1, addr2 } = await loadFixture(deployDeFiTokenFixture);
      
      // Add addr1 to fee exclusion
      await defiToken.connect(owner).excludeFromFees(addr1.address, true);
      
      const transferAmount = ethers.utils.parseEther("100");
      await defiToken.connect(owner).transfer(addr1.address, transferAmount);
      
      // Should receive full amount (no fees)
      expect(await defiToken.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should only allow admin to modify fee exclusion", async function () {
      const { defiToken, addr1 } = await loadFixture(deployDeFiTokenFixture);
      
      await expect(
        defiToken.connect(addr1).excludeFromFees(addr1.address, true)
      ).to.be.revertedWith(/AccessControl:.*/);
    });
  });
});