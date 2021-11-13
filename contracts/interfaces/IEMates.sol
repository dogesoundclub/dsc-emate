// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

interface IEMates is IERC721, IERC721Metadata {

    event ChangeMinter(address minter);

    function DOMAIN_SEPARATOR() external view returns (bytes32);
    function PERMIT_TYPEHASH() external view returns (bytes32);
    function PERMIT_ALL_TYPEHASH() external view returns (bytes32);
    function nonces(uint256 id) external view returns (uint256);
    function noncesForAll(address owner) external view returns (uint256);

    function totalSupply() external view returns (uint256);
    function minter() external view returns (address);

    function permit(
        address spender,
        uint256 id,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function permitAll(
        address owner,
        address spender,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}
