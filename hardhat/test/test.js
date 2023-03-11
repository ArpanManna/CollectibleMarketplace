const { expect } = require('chai');
const { ethers } = require('hardhat');

// 1 OCEAN token  = 0.0001 ether

describe("Collectible Marketplace", function(){
    let marketplaceContract
    let collectibleContract
    let _baseURI = ""
    beforeEach(async function() {
        // get the signers and accounts
        [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();
        // deploy the marketplace contract
        let CollectiblesMarketplace = await ethers.getContractFactory("CollectiblesMarketplace")
        marketplaceContract = await CollectiblesMarketplace.deploy();
        await marketplaceContract.deployed()
        // deploy collectible contract
        let CollectibleToken = await ethers.getContractFactory("CollectibleToken")
        collectibleContract = await CollectibleToken.deploy(marketplaceContract.address, _baseURI)
        await collectibleContract.deployed()
        
    })
    describe("deployment", function() {
        it("should assign total supply of OCEAN token to contract", async function() {
            let supply = ethers.utils.parseUnits("1",18)
            expect(await collectibleContract.balanceOf(collectibleContract.address,0)).to.equal(supply)
        })
    })
    describe("creation of collectibles", function() {
        it("should test balance and ownership of token", async function() {
            //  mint 10 token from addr1
            await collectibleContract.connect(addr1).createCollectible(10, "abc")
            // minted collectible token id should be 1 and balance should be 10
            expect(await collectibleContract.balanceOf(addr1.address, 1)).to.equal(10)
            // token1 uri should be set to "abc"
            expect(await collectibleContract.uri(1)).to.equal("abc")
        })
        it("should test marketplace approval", async function() {
            //  mint 20 token from addr2
            await collectibleContract.connect(addr2).createCollectible(20, "abc")
            // check is marketplace is approved to spend tokens
            expect(await collectibleContract.isApprovedForAll(addr2.address, marketplaceContract.address)).to.equal(true)
        })
        it("should test unique URI of different tokens", async function() {
            //  mint 5 token from addr1 
            await collectibleContract.connect(addr1).createCollectible(5, "https://ipfs.io/ipfs/bafybeihjjkwdrxxjnuwevlqtqmh3iegcadc32sio4wmo7bv2gbf34qs34a/1.json")
            //  mint 15 token from addr2 
            await collectibleContract.connect(addr2).createCollectible(15, "https://ipfs.io/ipfs/bafybeihjjkwdrxxjnuwevlqtqmh3iegcadc32sio4wmo7bv2gbf34qs34a/2.json")
            expect(await collectibleContract.uri(1)).to.equal("https://ipfs.io/ipfs/bafybeihjjkwdrxxjnuwevlqtqmh3iegcadc32sio4wmo7bv2gbf34qs34a/1.json")
            expect(await collectibleContract.uri(2)).to.equal("https://ipfs.io/ipfs/bafybeihjjkwdrxxjnuwevlqtqmh3iegcadc32sio4wmo7bv2gbf34qs34a/2.json")
        })
        it("should emit CollectibleCreated event", async function(){
            // addr1 create collectible with supply 20
            await expect(collectibleContract.connect(addr1).createCollectible(20, "abc")).to.emit(collectibleContract, 'CollectibleCreated').withArgs(addr1.address, 1, 20)
        })
    })

    describe("buy OCEAN token", function() {
        it("should transfer balance and token between buyer and seller", async function() {
            // addr1 buy 10 token with 10*0.0001 = 0.001 ether
            await collectibleContract.connect(addr1).buyOceanToken(10, {value : ethers.utils.parseEther("0.001")})
            // balance of OCEAN token of addr1 should be 10
            expect(await collectibleContract.balanceOf(addr1.address,0)).to.equal(10)
            // contract ether balance should increase to 0.001 ether
            expect(await collectibleContract.getBalance()).to.equal(ethers.utils.parseUnits("0.001",18))
            // OCEAN reserve of contract should decrease by 10 : 999999999999999990 
            expect(await collectibleContract.balanceOf(collectibleContract.address,0)).to.equal(ethers.utils.parseUnits("1",18).sub(10));
            // check if marketplace contract is approved to spend oh behalf of addr1
            expect(await collectibleContract.isApprovedForAll(addr1.address, marketplaceContract.address)).to.equal(true)
            
        })
        it("should fail if buyer does not have enough ether", async function() {
            // addr1 try to buy 10 token , price should be 10 ether
            // should fail if no ether is send
            await expect(collectibleContract.connect(addr1).buyOceanToken(10)).to.be.revertedWith("Not enough ether to make purchase")
            // should fail if less ether is send (say 0.0009 ether)
            await expect(collectibleContract.connect(addr1).buyOceanToken(10, {value : ethers.utils.parseEther("0.0009")})).to.be.revertedWith("Not enough ether to make purchase")
        })
        it("should emit TokenPurchsed event", async function() {
            // addr1 buy 10 token with 10*0.0001 = 0.001 ether
            //await collectibleContract.connect(addr1).buyOceanToken(10, {value : ethers.utils.parseEther("0.001")})
            await expect(collectibleContract.connect(addr1).buyOceanToken(10, {value : ethers.utils.parseEther("0.001")})).to.emit(collectibleContract, 'TokenPurchased').withArgs(addr1.address, 10)
        })
    })

    describe("list collectible in marketplace", function() {
        it("should list in marketplace", async function() {
            // addr1 create collectible with supply 20
            await collectibleContract.connect(addr1).createCollectible(20, "abc")
            // list 10 item in marketplace with each item with price = 1 ether
            // tokenId of collectible is 1
            await marketplaceContract.connect(addr1).listCollectible(collectibleContract.address, 1, 1, 10)
            const item = await marketplaceContract.getMarketItemInfo(1)
            expect(item[0]).to.equal(1) // tokenId should be 1
            expect(item[1]).to.equal(addr1.address) // seller should be addr1
            expect(item[2]).to.equal(1)  // price should be 1 ether
            expect(item[3]).to.equal(10) // supply should be 10
        })
       
        it("seller should be token owner", async function() {
            // addr1 create collectible with supply 20
            await collectibleContract.connect(addr1).createCollectible(20, "abc")
            // addr2 tries to list token1 , it should be reverted
            await expect(marketplaceContract.connect(addr2).listCollectible(collectibleContract.address, 1, 1, 10)).to.be.revertedWith("Caller is not owner of the token")
        })
        it("amount to list should be less than supply", async function() {
            // addr1 create collectible with supply 20
            await collectibleContract.connect(addr1).createCollectible(20, "abc")
            // addr1 list 22 token, it should be reverted
            await expect(marketplaceContract.connect(addr1).listCollectible(collectibleContract.address, 1, 1, 22)).to.be.revertedWith("amount to list should be less than supply")
        })
        it("collectble to list should be minted", async function() {
            // addr1 try to list 10 token1 , it should be reverted
            await expect(marketplaceContract.connect(addr1).listCollectible(collectibleContract.address, 1, 1, 10)).to.be.revertedWith("Caller is not owner of the token")
        })
        it("should emit CollectibleListed event", async function(){
            // addr1 create collectible with supply 20
            await collectibleContract.connect(addr1).createCollectible(20, "abc")
            await expect(marketplaceContract.connect(addr1).listCollectible(collectibleContract.address, 1, 1, 10)).to.emit(marketplaceContract, 'CollectibleListed').withArgs(addr1.address, 1, 1, 1, 10)
        })
    })

    describe("buy marketplace item", function() {
        it("should update collectible ownership to buyer", async function() {
            // addr1 create collectible with supply 20
            await collectibleContract.connect(addr1).createCollectible(20, "abc")
            // list 10 item in marketplace with each item with price = 0.0001 ether
            // tokenId of collectible is 1
            await marketplaceContract.connect(addr1).listCollectible(collectibleContract.address, 1, 1, 10)
            // addr2 buy 5 token1 with 0.0005 ether
            await marketplaceContract.connect(addr2).buyCollectible(collectibleContract.address, 1, 5, {value: ethers.utils.parseEther("0.0005")})
            // balance of addr1 should be 0.0005 ether
            // addr2 should have 5 token
            expect(await collectibleContract.balanceOf(addr2.address, 1)).to.equal(5)
            // marketplace supply of token1 should be decreased by 5
            let item = await marketplaceContract.getMarketItemInfo(1)
            expect(item[3]).to.equal(5)

        })
        it("should update balance of OCEAN token to seller if purchsed through ERC20", async function() {
            // addr1 create collectible with supply 20
            await collectibleContract.connect(addr1).createCollectible(20, "abc")
            // list 10 item in marketplace with each item with price = 1 OCEAN token
            // tokenId of collectible is 1
            await marketplaceContract.connect(addr1).listCollectible(collectibleContract.address, 1, 1, 10)
            // addr2 buy 30 OCEAN token
            await collectibleContract.connect(addr2).buyOceanToken(30, {value : ethers.utils.parseEther("30")})
            // balance of addr2 before purchase should be 30 OCEAN token
            expect(await collectibleContract.balanceOf(addr2.address, 0)).to.equal(30)
            // addr2 buy 5 token1 with 5 OCEAN token
            await marketplaceContract.connect(addr2).buyCollectible(collectibleContract.address, 1, 5)
            // balance of addr2 after purchase should be 25 OCEAN Token
            expect(await collectibleContract.balanceOf(addr2.address, 0)).to.equal(25)
            // balance of addr1 should be 5 OCEAN Token
            expect(await collectibleContract.balanceOf(addr1.address, 0)).to.equal(5)
        })
        it("should update balance if purchased through ether", async function() {
            // addr1 create collectible with supply 20
            await collectibleContract.connect(addr1).createCollectible(20, "abc")
            // list 10 item in marketplace with each item with price = 0.0001 ether
            // tokenId of collectible is 1
            await marketplaceContract.connect(addr1).listCollectible(collectibleContract.address, 1, 1, 10)
            // balance of addr1 and addr2 before purchase
            let bal1 = await ethers.provider.getBalance(addr1.address)
            let bal2 = await ethers.provider.getBalance(addr2.address)
            // addr2 buy 5 token1 with 0.0005 ether
            await marketplaceContract.connect(addr2).buyCollectible(collectibleContract.address, 1, 5, {value: ethers.utils.parseEther("0.0005")})
            // balance of addr1 should increase by 0.0005 ether
            expect(await ethers.provider.getBalance(addr1.address)).to.equal(bal1.add(ethers.utils.parseUnits("0.0005")))
            
        })
        it("should fail if sender does not have enough balance to purchase", async function() {
            // addr1 create collectible with supply 20
            await collectibleContract.connect(addr1).createCollectible(20, "abc")
            // list 10 item in marketplace with each item with price = 1 OCEAN token
            // tokenId of collectible is 1
            await marketplaceContract.connect(addr1).listCollectible(collectibleContract.address, 1, 1, 10)
            // addr2 buy 9 OCEAN token
            await collectibleContract.connect(addr2).buyOceanToken(9, {value : ethers.utils.parseEther("0.0009")})
            // addr2 try to buy 10 collectible item with 9 token, it should be reverted
            await expect(marketplaceContract.connect(addr2).buyCollectible(collectibleContract.address, 1, 10)).to.be.revertedWith("Not enough balance to purchase!")
        })
        it("should fail if collectible if not listed", async function() {
            // addr1 create collectible with supply 20
            await collectibleContract.connect(addr1).createCollectible(20, "abc")
            // addr2 try to buy 5 token2 , it should be reverted
            await expect(marketplaceContract.connect(addr2).buyCollectible(collectibleContract.address, 1, 5)).to.be.revertedWith("Item not listed for sale!")
        })
        it("should fail if collectible is already sold", async function() {
            // addr1 create collectible with supply 20
            await collectibleContract.connect(addr1).createCollectible(20, "abc")
            // list 10 item in marketplace with each item with price = 1 OCEAN token
            // tokenId of collectible is 1
            await marketplaceContract.connect(addr1).listCollectible(collectibleContract.address, 1, 1, 10)
            // addr2 buy 30 OCEAN token
            await collectibleContract.connect(addr2).buyOceanToken(30, {value : ethers.utils.parseEther("0.003")})
            // addr2 buy 10 token1 with 10 OCEAN token
            await marketplaceContract.connect(addr2).buyCollectible(collectibleContract.address, 1, 10)
            // now item supply should be zero
            const item = await marketplaceContract.getMarketItemInfo(1)
            expect(item[3]).to.equal(0)
            // now addr2 try to buy 1 more token, it should be reverted
            await expect(marketplaceContract.connect(addr2).buyCollectible(collectibleContract.address, 1, 1)).to.be.revertedWith("All Item is sold!")
        })
        it("should emit CollectiblePurchased event", async function() {
            // addr1 create collectible with supply 20
            await collectibleContract.connect(addr1).createCollectible(20, "abc")
            // list 10 item in marketplace with each item with price = 1 OCEAN token
            // tokenId of collectible is 1
            await marketplaceContract.connect(addr1).listCollectible(collectibleContract.address, 1, 1, 10)
            // addr2 buy 30 OCEAN token
            await collectibleContract.connect(addr2).buyOceanToken(30, {value : ethers.utils.parseEther("0.003")})
            // addr2 buy 10 token1 with 10 OCEAN token
            await expect(marketplaceContract.connect(addr2).buyCollectible(collectibleContract.address, 1, 10)).to.emit(marketplaceContract, 'CollectiblePurchased').withArgs(addr2.address, 1, 1, 10, 10, "OCEAN Token")
        })
    })
})

