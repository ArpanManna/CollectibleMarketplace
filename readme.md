# 🖼️ Collectible Marketplace
This is a fullstack DApp Collectible Marketplace built  with NodeJS, Hardhat, Solidity, ReactJS, NextJS and ethers.js.

# Market basic actions

* Marketplace supports both ERC20 tokens and ERC721 tokens 
* Follows Opensea standards
* Marketplace has native token for transaction
* You can **mint**  new collectibles with multiple copies, uploading image and metadata on [IPFS](https://ipfs.io/) using [Infura](https://infura.io/).  
* **sell** a part of total supply or whole supply by setting a price 
* When **buying** an collectible, the price will be transferred to the seller and collectible ownership to buyer.
* You can purchase using ERC20 or native currency (ether)
* It allow users to give ratings to sellers and purchased collectibles
* The contract is deployed to the **Sepolia Testnet** using [Alchemy](https://www.alchemy.com/) as a node provider and all transaction happen through Metamask. 

# Environment Steup 
## Clone the repository
```sh
https://github.com/ArpanManna/CollectibleMarketplace
```
## Change directory to hardhat 
```sh
npm install
```
## Change directory to marketplace
```sh
npm install
```
## To start the development server run 
```sh
npm run dev
```
 marketplace is running on localhost:3000