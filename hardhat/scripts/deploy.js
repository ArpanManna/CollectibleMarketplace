const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });


async function main() {

  // deploy marketplace contract 
  const marketplaceContract = await ethers.getContractFactory("CollectiblesMarketplace");
  const deployedMarketplaceContract = await marketplaceContract.deploy();
  await deployedMarketplaceContract.deployed();

  const marketplaceAddress = deployedMarketplaceContract.address;
  console.log('marketplace contract address : ', marketplaceAddress);

  // deploy collectibleToken contract
  const collectibleContract = await ethers.getContractFactory("CollectibleToken");
  const deployedCollectibleContract = await collectibleContract.deploy(marketplaceAddress, "baseURI");
  await deployedCollectibleContract.deployed();
  console.log('collectibleToken contract address : ', deployedCollectibleContract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
