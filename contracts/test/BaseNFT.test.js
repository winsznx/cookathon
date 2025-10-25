const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('BaseNFT', function () {
  let baseNFT;
  let owner;
  let addr1;
  let addr2;

  const NAME = 'Base Telegram NFT';
  const SYMBOL = 'BTNFT';
  const MINT_PRICE = ethers.parseEther('0.01');
  const MAX_SUPPLY = 100;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const BaseNFT = await ethers.getContractFactory('BaseNFT');
    baseNFT = await BaseNFT.deploy(NAME, SYMBOL, MINT_PRICE, MAX_SUPPLY);
    await baseNFT.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await baseNFT.owner()).to.equal(owner.address);
    });

    it('Should set the correct name and symbol', async function () {
      expect(await baseNFT.name()).to.equal(NAME);
      expect(await baseNFT.symbol()).to.equal(SYMBOL);
    });

    it('Should set the correct mint price', async function () {
      expect(await baseNFT.mintPrice()).to.equal(MINT_PRICE);
    });

    it('Should set the correct max supply', async function () {
      expect(await baseNFT.maxSupply()).to.equal(MAX_SUPPLY);
    });
  });

  describe('Minting', function () {
    const TOKEN_URI = 'ipfs://QmTest123';

    it('Should mint NFT with correct payment', async function () {
      await expect(
        baseNFT.connect(addr1).mint(addr1.address, TOKEN_URI, {
          value: MINT_PRICE
        })
      )
        .to.emit(baseNFT, 'NFTMinted')
        .withArgs(addr1.address, 1, TOKEN_URI);

      expect(await baseNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await baseNFT.tokenURI(1)).to.equal(TOKEN_URI);
      expect(await baseNFT.balanceOf(addr1.address)).to.equal(1);
    });

    it('Should fail to mint without sufficient payment', async function () {
      await expect(
        baseNFT.connect(addr1).mint(addr1.address, TOKEN_URI, {
          value: ethers.parseEther('0.005')
        })
      ).to.be.revertedWith('Insufficient payment');
    });

    it('Should fail to mint to zero address', async function () {
      await expect(
        baseNFT.mint(ethers.ZeroAddress, TOKEN_URI, {
          value: MINT_PRICE
        })
      ).to.be.revertedWith('Cannot mint to zero address');
    });

    it('Should increment token ID correctly', async function () {
      await baseNFT.connect(addr1).mint(addr1.address, TOKEN_URI, {
        value: MINT_PRICE
      });
      expect(await baseNFT.getCurrentTokenId()).to.equal(1);

      await baseNFT.connect(addr1).mint(addr1.address, TOKEN_URI + '2', {
        value: MINT_PRICE
      });
      expect(await baseNFT.getCurrentTokenId()).to.equal(2);
    });

    it('Should respect max supply', async function () {
      // Create contract with max supply of 2
      const BaseNFT = await ethers.getContractFactory('BaseNFT');
      const limitedNFT = await BaseNFT.deploy(NAME, SYMBOL, MINT_PRICE, 2);
      await limitedNFT.waitForDeployment();

      // Mint 2 NFTs
      await limitedNFT.connect(addr1).mint(addr1.address, TOKEN_URI, {
        value: MINT_PRICE
      });
      await limitedNFT.connect(addr1).mint(addr1.address, TOKEN_URI + '2', {
        value: MINT_PRICE
      });

      // Third mint should fail
      await expect(
        limitedNFT.connect(addr1).mint(addr1.address, TOKEN_URI + '3', {
          value: MINT_PRICE
        })
      ).to.be.revertedWith('Max supply reached');
    });
  });

  describe('Batch Minting', function () {
    it('Should batch mint multiple NFTs', async function () {
      const tokenURIs = [
        'ipfs://QmTest1',
        'ipfs://QmTest2',
        'ipfs://QmTest3'
      ];

      await baseNFT.connect(addr1).batchMint(addr1.address, tokenURIs, {
        value: MINT_PRICE * BigInt(tokenURIs.length)
      });

      expect(await baseNFT.balanceOf(addr1.address)).to.equal(3);
      expect(await baseNFT.getCurrentTokenId()).to.equal(3);
    });

    it('Should fail batch mint with insufficient payment', async function () {
      const tokenURIs = ['ipfs://QmTest1', 'ipfs://QmTest2'];

      await expect(
        baseNFT.connect(addr1).batchMint(addr1.address, tokenURIs, {
          value: MINT_PRICE
        })
      ).to.be.revertedWith('Insufficient payment');
    });
  });

  describe('Owner Functions', function () {
    it('Should allow owner to update mint price', async function () {
      const newPrice = ethers.parseEther('0.02');
      await expect(baseNFT.setMintPrice(newPrice))
        .to.emit(baseNFT, 'MintPriceUpdated')
        .withArgs(MINT_PRICE, newPrice);

      expect(await baseNFT.mintPrice()).to.equal(newPrice);
    });

    it('Should prevent non-owner from updating mint price', async function () {
      const newPrice = ethers.parseEther('0.02');
      await expect(
        baseNFT.connect(addr1).setMintPrice(newPrice)
      ).to.be.revertedWithCustomError(baseNFT, 'OwnableUnauthorizedAccount');
    });

    it('Should allow owner to update max supply', async function () {
      const newMaxSupply = 200;
      await expect(baseNFT.setMaxSupply(newMaxSupply))
        .to.emit(baseNFT, 'MaxSupplyUpdated')
        .withArgs(MAX_SUPPLY, newMaxSupply);

      expect(await baseNFT.maxSupply()).to.equal(newMaxSupply);
    });

    it('Should allow owner to withdraw funds', async function () {
      // Mint to generate funds
      await baseNFT.connect(addr1).mint(addr1.address, 'ipfs://QmTest', {
        value: MINT_PRICE
      });

      const contractBalance = await ethers.provider.getBalance(
        await baseNFT.getAddress()
      );
      expect(contractBalance).to.equal(MINT_PRICE);

      // Withdraw
      await expect(baseNFT.withdraw()).to.changeEtherBalances(
        [owner, baseNFT],
        [MINT_PRICE, -MINT_PRICE]
      );
    });

    it('Should prevent non-owner from withdrawing', async function () {
      await expect(
        baseNFT.connect(addr1).withdraw()
      ).to.be.revertedWithCustomError(baseNFT, 'OwnableUnauthorizedAccount');
    });
  });

  describe('Enumerable Functions', function () {
    it('Should track total supply', async function () {
      expect(await baseNFT.totalSupply()).to.equal(0);

      await baseNFT.connect(addr1).mint(addr1.address, 'ipfs://QmTest1', {
        value: MINT_PRICE
      });
      expect(await baseNFT.totalSupply()).to.equal(1);

      await baseNFT.connect(addr1).mint(addr1.address, 'ipfs://QmTest2', {
        value: MINT_PRICE
      });
      expect(await baseNFT.totalSupply()).to.equal(2);
    });

    it('Should enumerate tokens by owner', async function () {
      await baseNFT.connect(addr1).mint(addr1.address, 'ipfs://QmTest1', {
        value: MINT_PRICE
      });
      await baseNFT.connect(addr1).mint(addr1.address, 'ipfs://QmTest2', {
        value: MINT_PRICE
      });

      const tokenId1 = await baseNFT.tokenOfOwnerByIndex(addr1.address, 0);
      const tokenId2 = await baseNFT.tokenOfOwnerByIndex(addr1.address, 1);

      expect(tokenId1).to.equal(1);
      expect(tokenId2).to.equal(2);
    });
  });
});
