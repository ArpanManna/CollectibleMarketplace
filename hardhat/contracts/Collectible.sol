// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

    /// @title A Collectible contract using ERC1155
    /// @author Arpan Manna
    /// @notice You can use this contract to create collectibles and buy native token (OCEAN token)
    /// @dev All function calls are currently implemented without side effects

import "../node_modules/@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";



contract CollectibleToken is ERC1155{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds; // keep track of collectible created
    uint public constant OCEAN = 0;   // assign token Id to 0
    // 1 OCEAN token  = 0.0001 ether
    uint tokenPrice = 1 ether;
    address collectibleMarketplace;

    constructor(address _collectibleMarketplace, string memory _baseUri) ERC1155(_baseUri){
        collectibleMarketplace = _collectibleMarketplace;
        // mint 10**18 OCEAN token to the contract
        _mint(address(this), OCEAN, 10**18, "");
    }

    mapping(uint => string) private _uris;  // mapping of tokenID to token URI

    event CollectibleCreated(address _owner, uint _collectibleId, uint _supply);
    event TokenPurchased(address _buyer, uint _amount);


    // create collectible
    function createCollectible(uint _supply, string memory _uri) public returns(uint){
        _tokenIds.increment();
        uint newCollectibleId = _tokenIds.current();
        // mint collectible
        _mint(msg.sender, newCollectibleId, _supply, "");
        // approve the marketplace contract to spend collectible on behalf of owner
        _setApprovalForAll(msg.sender, collectibleMarketplace, true);
        // set token URI
        _uris[newCollectibleId] = _uri;
        // emit CollectibleCreated event
        emit CollectibleCreated(msg.sender, newCollectibleId, _supply);
        return newCollectibleId;
    }

    // buy native token 
    function buyOceanToken(uint _amount) public payable{
        //uint purchaseAmount = Conversion.getEquivalentEther(_amount);
        require(msg.value >= (tokenPrice*_amount) / 10000, "Not enough ether to make purchase");
        // approve the caller to spend token on behalf of contract
        _setApprovalForAll(address(this), msg.sender, true);
        // transfer token from contract to caller 
        safeTransferFrom(address(this), msg.sender, OCEAN, _amount, "0x");
        // approve the marketplace contract to spend token on behalf of owner
        _setApprovalForAll(msg.sender, collectibleMarketplace, true);
        // emit TokenPurchased event
        emit TokenPurchased(msg.sender, _amount);
    }

    // return uri of token
    function uri(uint256 _tokenid) override public view returns (string memory) {
        return _uris[_tokenid];
    }

    // get ether balance of the contract
    function getBalance() public view returns(uint){
        return address(this).balance;
    }

    fallback() external payable{}
    receive() external payable{}

    
}