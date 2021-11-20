import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumberish, Contract } from "ethers";
import { ethers } from "hardhat";
import { RSV } from "./rpc";

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

export async function getERC20PermitSignature(
    signer: SignerWithAddress,
    token: Contract,
    approve: {
        owner: string;
        spender: string;
        value: BigNumberish;
    },
    nonce: BigNumberish,
    deadline: BigNumberish
): Promise<RSV> {
    const domain = {
        name: await token.name(),
        version: "1",
        chainId: 31337,
        verifyingContract: token.address,
    };

    const types = {
        Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };

    const value = {
        owner: approve.owner,
        spender: approve.spender,
        value: approve.value,
        nonce: nonce,
        deadline: deadline,
    };

    const signature = await signer._signTypedData(domain, types, value);

    return {
        r: signature.slice(0, 66),
        s: "0x" + signature.slice(66, 130),
        v: parseInt(signature.slice(130, 132), 16),
    };
}

export async function getERC721PermitSignature(
    signer: SignerWithAddress,
    token: Contract,
    approve: {
        spender: string;
        id: BigNumberish;
    },
    nonce: BigNumberish,
    deadline: BigNumberish
): Promise<RSV> {
    const domain = {
        name: await token.name(),
        version: "1",
        chainId: 31337,
        verifyingContract: token.address,
    };

    const types = {
        Permit: [
            { name: "spender", type: "address" },
            { name: "tokenId", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };

    const value = {
        spender: approve.spender,
        tokenId: approve.id,
        nonce: nonce,
        deadline: deadline,
    };

    const signature = await signer._signTypedData(domain, types, value);

    return {
        r: signature.slice(0, 66),
        s: "0x" + signature.slice(66, 130),
        v: parseInt(signature.slice(130, 132), 16),
    };
}

export async function getERC721PermitAllSignature(
    signer: SignerWithAddress,
    token: Contract,
    approve: {
        owner: string;
        spender: string;
    },
    nonce: BigNumberish,
    deadline: BigNumberish
): Promise<RSV> {
    const domain = {
        name: await token.name(),
        version: "1",
        chainId: 31337,
        verifyingContract: token.address,
    };

    const types = {
        Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };

    const value = {
        owner: approve.owner,
        spender: approve.spender,
        nonce: nonce,
        deadline: deadline,
    };

    const signature = await signer._signTypedData(domain, types, value);

    return {
        r: signature.slice(0, 66),
        s: "0x" + signature.slice(66, 130),
        v: parseInt(signature.slice(130, 132), 16),
    };
}
