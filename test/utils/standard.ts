import { Wallet, BigNumberish, Contract } from "ethers";
import { ethers } from "hardhat";
import { RSV } from "./rpc";

const convertToHash = (text: string) => {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(text));
};

const ERC20_PERMIT_TYPEHASH = convertToHash("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
const ERC721_PERMIT_TYPEHASH = convertToHash("Permit(address spender,uint256 tokenId,uint256 nonce,uint256 deadline)");
const ERC721_PERMIT_ALL_TYPEHASH = convertToHash("Permit(address owner,address spender,uint256 nonce,uint256 deadline)");

export const sign = (digest: any, signer: Wallet): RSV => {
    return { ...signer._signingKey().signDigest(digest) };
};

export const domainSeparator = (name: string, tokenAddress: string, version: string) => {
    return ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "bytes32", "bytes32", "uint256", "address"],
            [
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")),
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name)),
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes(version)),
                31337,
                tokenAddress,
            ]
        )
    );
};

const approvalDigest = async (token: Contract, types: string[], values: any[]) => {
    return ethers.utils.keccak256(
        ethers.utils.solidityPack(
            ["bytes1", "bytes1", "bytes32", "bytes32"],
            ["0x19", "0x01", domainSeparator(await token.name(), token.address, "1"), ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(types, values))]
        )
    );
};

export async function getERC20ApprovalDigest(
    token: Contract,
    approve: {
        owner: string,
        spender: string,
        value: BigNumberish,
    },
    nonce: BigNumberish,
    deadline: BigNumberish,
): Promise<string> {
    return await approvalDigest(token,
        ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
        [ERC20_PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline],
    );
}

export async function getERC721ApprovalDigest(
    token: Contract,
    approve: {
        spender: string;
        id: BigNumberish;
    },
    nonce: BigNumberish,
    deadline: BigNumberish
): Promise<string> {
    return await approvalDigest(token, ["bytes32", "address", "uint256", "uint256", "uint256"], [ERC721_PERMIT_TYPEHASH, approve.spender, approve.id, nonce, deadline]);
}

export async function getERC721ApprovalAllDigest(
    token: Contract,
    approve: {
        owner: string;
        spender: string;
    },
    nonce: BigNumberish,
    deadline: BigNumberish
): Promise<string> {
    return await approvalDigest(token, ["bytes32", "address", "address", "uint256", "uint256"], [ERC721_PERMIT_ALL_TYPEHASH, approve.owner, approve.spender, nonce, deadline]);
}
