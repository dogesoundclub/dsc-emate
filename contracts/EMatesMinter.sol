// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./EMates.sol";
import "./interfaces/IEthereumMix.sol";

contract EMatesMinter is Ownable {

    EMates public emates;
    IEthereumMix public emix;
    uint256 public mintPrice;

    uint256 public limit;

    constructor(
        EMates _emates,
        IEthereumMix _emix,
        uint256 _mintPrice
    ) {
        emates = _emates;
        emix = _emix;
        mintPrice = _mintPrice;
    }

    function setLimit(uint256 _limit) external onlyOwner {
        limit = _limit;
    }

    function mint() public returns (uint256 id) {
        id = emates.mint(msg.sender);
        require(id < limit);
        emix.transferFrom(msg.sender, address(this), mintPrice);
    }

    function mintWithPermit(
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256 id) {
        emix.permit(msg.sender, address(this), mintPrice, deadline, v, r, s);
        id = mint();
    }

    function withdrawEmix() external onlyOwner {
        emix.transfer(msg.sender, emix.balanceOf(address(this)));
    }
}
