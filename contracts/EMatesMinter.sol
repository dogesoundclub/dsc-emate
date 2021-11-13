// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./EMates.sol";

contract EMatesMinter is Ownable {

    EMates public emates;
    uint256 public limit;

    constructor(EMates _emates) {
        emates = _emates;
    }

    function setLimit(uint256 _limit) external onlyOwner {
        limit = _limit;
    }

    function mint() external returns (uint256 id) {
        id = emates.mint(msg.sender);
        require(id < limit);
    }
}
