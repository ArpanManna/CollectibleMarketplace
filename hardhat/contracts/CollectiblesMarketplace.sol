// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

    /// @title A Collectible Marketplace following ERC1155
    /// @author Arpan Manna
    /// @notice You can use this contract to list and buy collectibls on Marketplace
    /// @dev All function calls are currently implemented without side effects

import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract CollectiblesMarketplace {
    using Counters for Counters.Counter; 
    
    Counters.Counter private _collectibleIds; // keep track of each market collectible item created
    Counters.Counter private _collectibeslSold; // keep track of collectible sold (supply exhaustion)
    // 1 OCEAN token = 0.0001 ether
    uint tokenPrice = 1 ether;

    struct Collectible{
        uint itemid;    // market item id
        address collectibleContract; // address of collectibleContract
        uint tokenId; // collectible token id
        address payable seller;  // address of seller
        address payable owner;  // owner of the Collectible
        uint price;   // price of item
        uint supply;  // supply of the collectible 
        //bool sold;    // item sold or not
    }

    struct Rating{
        address reviewer;   // reviewer who give rating and write reviews
        string reviewUrl;   // it will be an url containing json of (_txHash, seller, _itemId, _tokenId, rating, reviews)
    }

    mapping(uint => Collectible) private idToMarketItem; // mapping of token id to Marketplace object

    Rating[] ratings; // maintain an array of the ratings

    event CollectibleListed(address _owner, uint _collectibleId, uint _marketItemId, uint _price, uint _supply);
    event CollectiblePurchased(address _buyer, uint _collectibleId, uint _marketItemId, uint _amount, uint _purchaeAmount, string _modeOfPurchase);

    // list collectible in marketplace
    function listCollectible(address _collectibleContract, uint _tokenId, uint _price, uint _amount) public{
        require(IERC1155(_collectibleContract).balanceOf(msg.sender, _tokenId)>0, "Caller is not owner of the token");
        require(_amount <= IERC1155(_collectibleContract).balanceOf(msg.sender, _tokenId), "amount to list should be less than supply");
        _collectibleIds.increment();
        uint newCollectibleId = _collectibleIds.current();
        idToMarketItem[newCollectibleId] = Collectible(newCollectibleId, _collectibleContract, _tokenId, payable(msg.sender), payable(address(0)), _price, _amount);
        // emit CollectibleListed event
        emit CollectibleListed(msg.sender, _tokenId, newCollectibleId, _price, _amount);
    }

    // buy from marketplace
    function buyCollectible(address _collectibleContract, uint _itemId, uint _amount) external payable{
        require(idToMarketItem[_itemId].itemid != 0, "Item not listed for sale!"); 
        require(msg.sender != address(0), "Buyer needs to be an address!");
        //require(!idToMarketItem[_itemId].sold, "Item already sold!");
        require(idToMarketItem[_itemId].supply > 0, "All Item is sold!");
        require(_amount > 0, "Amount to purchase should be atleast 1");
        require(idToMarketItem[_itemId].supply >= _amount, "Not enough items to buy");
        uint tokenId = idToMarketItem[_itemId].tokenId;
        address seller = idToMarketItem[_itemId].seller;
        require(msg.sender != seller, "Seller cannot be the purchaser");
        uint _pricePerToken = idToMarketItem[_itemId].price;
        uint purchaseAmount = _pricePerToken * _amount;
        // transfer price to the owner
        if(msg.value >0){
            //uint eqEther = Conversion.getEquivalentEther(purchaseAmount);
            purchaseAmount = (tokenPrice*purchaseAmount) / 10000;
            require(msg.value >= purchaseAmount, "Not enough ether to purchase");
            payable(seller).transfer(msg.value);
        }
        else{
            require(IERC1155(_collectibleContract).balanceOf(msg.sender,0) >= purchaseAmount, "Not enough balance to purchase!");
            IERC1155(_collectibleContract).safeTransferFrom(msg.sender, seller, 0, purchaseAmount, "0x");
        }
        // transfer ownership of NFT from marketplace to buyer
        IERC1155(_collectibleContract).safeTransferFrom(seller,msg.sender, tokenId, _amount, "0x");
        // decrease supply in marketplace item
        idToMarketItem[_itemId].supply -= _amount;
        // buyer (caller of the function) become the new owner of the NFT
        idToMarketItem[_itemId].owner = payable(msg.sender);
        // emit CollectiblePurchased event
        if(msg.value>0){
            emit CollectiblePurchased(msg.sender, idToMarketItem[_itemId].tokenId, _itemId, _amount, purchaseAmount, "ether");
        }
        else emit CollectiblePurchased(msg.sender, idToMarketItem[_itemId].tokenId, _itemId, _amount, purchaseAmount, "OCEAN Token");

        if(idToMarketItem[_itemId].supply == 0){
            _collectibeslSold.increment();
        }
    }

    // return listed Collectible Info 
    function getMarketItemInfo(uint _itemId) public view returns(uint, address, uint, uint){
        Collectible memory item = idToMarketItem[_itemId];
        return (item.tokenId, item.seller, item.price, item.supply);
    }

    // return all listed Collectibles
    function getListedCollectibles() public view returns(Collectible[] memory){
        uint itemCount = _collectibleIds.current();
        uint unsoldCollectibleCount = _collectibleIds.current() - _collectibeslSold.current();
        Collectible[] memory unsoldCollectibles = new Collectible[](unsoldCollectibleCount);
        uint curIndex = 0;
        for(uint i=1;i<=itemCount;i++){
            if(idToMarketItem[i].supply>0){
                Collectible storage curItem = idToMarketItem[i];
                unsoldCollectibles[curIndex] = curItem;
                curIndex += 1;
            }
        }
        return unsoldCollectibles;
    }

    // update Ratings
    function setUserRatingAndReview(string memory _reviewURL) public{
        Rating memory newRating = Rating(msg.sender, _reviewURL);
        ratings.push(newRating);
    }

    // get ratings posted by users
    function getRatings() public view returns(Rating[] memory){
        uint totalRatings = ratings.length;
        Rating[] memory _ratings= new Rating[](totalRatings);
        for(uint i=0;i<totalRatings;i++){
            _ratings[i] = ratings[i];
        }
        return _ratings;
    }

}