// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// 1 OCEAN = 0.0001 ether
// this rate can be set as per requirement. For fractional conversion third party library can be used


library Conversion{
    function getEquivalentEther(uint _tokenAmount) public pure returns(uint){
        return _tokenAmount / 10000;
    }
    function getEquivalentToken(uint _ether) public pure returns(uint){
        return 10000 * _ether;
    }
}