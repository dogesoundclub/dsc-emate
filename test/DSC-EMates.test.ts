import { TestEthereumMix, EMates, EMatesMinter } from "../typechain";
import { domainSeparator, getERC20PermitSignature, getERC721PermitSignature, getERC721PermitAllSignature } from "./utils/standard";

import { ethers } from "hardhat";
import { expect } from "chai";

import { BigNumber } from "ethers";

const { constants, utils } = ethers;
const { MaxUint256, AddressZero } = constants;

const mintPrice = utils.parseEther("0.1");
const fee = 750;

const setupTest = async () => {
    const signers = await ethers.getSigners();
    const [deployer, alice, bob, carol, dan, erin, frank] = signers;

    const EthereumMix = await ethers.getContractFactory("TestEthereumMix");
    const mix = (await EthereumMix.deploy(deployer.address)) as TestEthereumMix;

    const EMates = await ethers.getContractFactory("EMates");
    const eMates = (await EMates.deploy(deployer.address, fee)) as EMates;

    const EMatesMinter = await ethers.getContractFactory("EMatesMinter");
    const minter = (await EMatesMinter.deploy(eMates.address, mix.address, mintPrice)) as EMatesMinter;

    return {
        deployer,
        alice,
        bob,
        carol,
        dan,
        erin,
        frank,
        mix,
        eMates,
        minter,
    };
};

describe("EMates", () => {
    beforeEach(async () => {
        await ethers.provider.send("hardhat_reset", []);
    });

    it("should be that initial values are set properly and basic functions work properly", async () => {
        const { deployer, alice, eMates } = await setupTest();

        expect(await eMates.isMinter(deployer.address)).to.be.true;
        expect(await eMates.isMinter(alice.address)).to.be.false;

        await expect(eMates.connect(alice).setMinter(alice.address, true)).to.be.revertedWith("Ownable: caller is not the owner");
        expect(await eMates.setMinter(alice.address, true))
            .to.emit(eMates, "SetMinter")
            .withArgs(alice.address, true);
        expect(await eMates.isMinter(alice.address)).to.be.true;

        await expect(eMates.setMinter(alice.address, true)).to.be.revertedWith("EMATES: Permission not changed");
        expect(await eMates.setMinter(alice.address, false))
            .to.emit(eMates, "SetMinter")
            .withArgs(alice.address, false);
        expect(await eMates.isMinter(alice.address)).to.be.false;

        expect(await eMates.DOMAIN_SEPARATOR()).to.be.equal(domainSeparator("DSC E-MATES | 4 DA NEXT LEVEL", eMates.address, "1"));

        expect(await eMates.contractURI()).to.be.equal("https://api.dogesound.club/emates");
        await expect(eMates.connect(alice).setContractURI("https://foo.bar/foobar.json")).to.be.revertedWith("Ownable: caller is not the owner");
        expect(await eMates.setContractURI("https://foo.bar/foobar.json"))
            .to.emit(eMates, "SetContractURI")
            .withArgs("https://foo.bar/foobar.json");
        expect(await eMates.contractURI()).to.be.equal("https://foo.bar/foobar.json");

        await expect(eMates.tokenURI(0)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
        await expect(eMates.connect(alice).mint(alice.address)).to.be.revertedWith("EMATES: Forbidden");
        await eMates.mint(alice.address);
        expect(await eMates.tokenURI(0)).to.be.equal("https://api.dogesound.club/emates/0");

        await expect(eMates.connect(alice).setBaseURI("https://foooo.barrr/")).to.be.revertedWith("Ownable: caller is not the owner");
        expect(await eMates.setBaseURI("https://foooo.barrr/"))
            .to.emit(eMates, "SetBaseURI")
            .withArgs("https://foooo.barrr/");
        expect(await eMates.tokenURI(0)).to.be.equal("https://foooo.barrr/0");

        expect((await eMates.royaltyInfo(10, 2000)).receiver).to.be.equal(deployer.address);
        expect((await eMates.royaltyInfo(10, 2000)).royaltyAmount).to.be.equal(150);
        expect((await eMates.royaltyInfo(12345, 12345)).royaltyAmount).to.be.equal(BigNumber.from(12345).mul(fee).div(10000));

        await expect(eMates.connect(alice).setRoyaltyInfo(alice.address, 100)).to.be.revertedWith("Ownable: caller is not the owner");
        await expect(eMates.setRoyaltyInfo(alice.address, 10000)).to.be.revertedWith("EMATES: Invalid Fee");

        expect(await eMates.setRoyaltyInfo(alice.address, 1000))
            .to.emit(eMates, "SetRoyaltyInfo")
            .withArgs(alice.address, 1000);
        expect((await eMates.royaltyInfo(12345, 12345)).receiver).to.be.equal(alice.address);
        expect((await eMates.royaltyInfo(12345, 12345)).royaltyAmount).to.be.equal(BigNumber.from(12345).mul(1000).div(10000));
    });

    it("should be that permit/permitAll fuctions work properly", async () => {
        const { alice, bob, carol, dan, eMates } = await setupTest();

        await eMates.mint(alice.address);
        await eMates.mint(alice.address);
        await eMates.mint(alice.address);

        const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
        let deadline = currentTime + 100;

        const { v: v0, r: r0, s: s0 } = await getERC721PermitSignature(alice, eMates, { spender: bob.address, id: 1 }, 0, deadline);

        expect(await eMates.getApproved(1)).to.be.equal(AddressZero);
        await eMates.permit(bob.address, 1, deadline, v0, r0, s0);
        expect(await eMates.getApproved(1)).to.be.equal(bob.address);

        const { v: v1, r: r1, s: s1 } = await getERC721PermitSignature(alice, eMates, { spender: bob.address, id: 2 }, 1, deadline);

        const {
            v: fv0,
            r: fr0,
            s: fs0,
        } = await getERC721PermitSignature(
            alice,
            eMates,
            { spender: bob.address, id: 2 },
            5,
            deadline //invalid nonce
        );

        const {
            v: fv1,
            r: fr1,
            s: fs1,
        } = await getERC721PermitSignature(
            alice,
            eMates,
            { spender: bob.address, id: 2 },
            1,
            deadline - 120 //deadline over
        );

        const {
            v: fv2,
            r: fr2,
            s: fs2,
        } = await getERC721PermitSignature(
            dan,
            eMates,
            { spender: bob.address, id: 2 },
            1,
            deadline //fake signer
        );

        await expect(eMates.permit(bob.address, 2, deadline, fv0, fr0, fs0)).to.be.revertedWith("EMATES: Unauthorized"); //invalid nonce
        await expect(eMates.permit(bob.address, 2, deadline - 120, fv1, fr1, fs1)).to.be.revertedWith("EMATES: Expired deadline"); //deadline over
        await expect(eMates.permit(bob.address, 1, deadline, v1, r1, s1)).to.be.revertedWith("EMATES: Unauthorized"); //wrong id
        await expect(eMates.permit(bob.address, 5, deadline, v1, r1, s1)).to.be.revertedWith("ERC721: owner query for nonexistent token"); //wrong id
        await expect(eMates.permit(alice.address, 2, deadline, v1, r1, s1)).to.be.revertedWith("EMATES: Invalid spender"); //wrong spender
        await expect(eMates.permit(carol.address, 2, deadline, v1, r1, s1)).to.be.revertedWith("EMATES: Unauthorized"); //wrong spender
        await expect(eMates.permit(bob.address, 2, deadline, fv2, fr2, fs2)).to.be.revertedWith("EMATES: Unauthorized"); //fake signer

        const { v: v2, r: r2, s: s2 } = await getERC721PermitAllSignature(alice, eMates, { owner: alice.address, spender: carol.address }, 0, deadline);

        expect(await eMates.isApprovedForAll(alice.address, carol.address)).to.be.false;

        await expect(eMates.permitAll(alice.address, alice.address, deadline, v2, r2, s2)).to.be.revertedWith("EMATES: Unauthorized");
        await eMates.permitAll(alice.address, carol.address, deadline, v2, r2, s2);

        expect(await eMates.isApprovedForAll(alice.address, carol.address)).to.be.true;
    });

    it("should be that mint/mintBatch fuctions work properly", async () => {
        const { alice, bob, carol, eMates } = await setupTest();

        await expect(eMates.connect(alice).mint(alice.address)).to.be.revertedWith("EMATES: Forbidden");
        expect(await eMates.totalSupply()).to.be.equal(0);

        await eMates.mint(alice.address);

        expect(await eMates.totalSupply()).to.be.equal(1);
        expect(await eMates.ownerOf(0)).to.be.equal(alice.address);

        await eMates.setMinter(bob.address, true);

        await expect(eMates.connect(alice).mintBatch(10)).to.be.revertedWith("EMATES: Forbidden");
        await eMates.connect(bob).mintBatch(10);

        expect(await eMates.totalSupply()).to.be.equal(10);
        expect(await eMates.ownerOf(0)).to.be.equal(alice.address);

        for (let i = 1; i < 10; i++) {
            expect(await eMates.ownerOf(i)).to.be.equal(bob.address);
        }

        await eMates.connect(bob).mint(alice.address);

        expect(await eMates.totalSupply()).to.be.equal(11);
        expect(await eMates.ownerOf(10)).to.be.equal(alice.address);

        await eMates.connect(bob).mintBatch(11);
        expect(await eMates.totalSupply()).to.be.equal(11);

        await eMates.connect(bob).mintBatch(30);
        expect(await eMates.totalSupply()).to.be.equal(30);
        await eMates.connect(bob).mintBatch(30);
        expect(await eMates.totalSupply()).to.be.equal(30);

        await eMates.connect(bob).mintBatch(1000);
        expect(await eMates.totalSupply()).to.be.equal(1000);
    });
});

describe("EMatesMinter", () => {
    beforeEach(async () => {
        await ethers.provider.send("hardhat_reset", []);
    });

    it("overall test", async () => {
        const { deployer, alice, bob, carol, dan, erin, frank, mix, eMates, minter } = await setupTest();

        {
            await mix.mint(alice.address, utils.parseEther("100"));
            await mix.mint(bob.address, utils.parseEther("100"));
            await mix.mint(carol.address, utils.parseEther("100"));
            await mix.mint(dan.address, utils.parseEther("100"));
            await mix.mint(erin.address, utils.parseEther("100"));
            await mix.mint(frank.address, utils.parseEther("100"));

            await mix.connect(alice).approve(minter.address, MaxUint256);
            await mix.connect(bob).approve(minter.address, MaxUint256);
            await mix.connect(carol).approve(minter.address, MaxUint256);
            await mix.connect(dan).approve(minter.address, MaxUint256);
        }

        expect(await minter.mintPrice()).to.be.equal(mintPrice);
        expect(await minter.limit()).to.be.equal(0);

        await expect(minter.connect(alice).mint()).to.be.revertedWith("EMatesMinter: Limit exceeded");

        await expect(minter.connect(alice).setLimit(1)).to.be.revertedWith("Ownable: caller is not the owner");
        expect(await minter.setLimit(1))
            .to.emit(minter, "SetLimit")
            .withArgs(1);
        expect(await minter.limit()).to.be.equal(1);

        await expect(minter.connect(alice).mint()).to.be.revertedWith("EMATES: Forbidden");
        await eMates.setMinter(minter.address, true);

        await expect(() => minter.connect(alice).mint()).to.changeTokenBalances(mix, [alice, minter], [mintPrice.mul(-1), mintPrice]);
        expect(await eMates.ownerOf(0)).to.be.equal(alice.address);
        expect(await eMates.totalSupply()).to.be.equal(1);
        let minterMix = mintPrice;

        await expect(minter.connect(alice).mint()).to.be.revertedWith("EMatesMinter: Limit exceeded");
        await expect(minter.connect(bob).mint()).to.be.revertedWith("EMatesMinter: Limit exceeded");

        await minter.setLimit(10);
        await expect(() => minter.connect(bob).mint()).to.changeTokenBalances(mix, [bob, minter], [mintPrice.mul(-1), mintPrice]);
        expect(await eMates.ownerOf(1)).to.be.equal(bob.address);
        expect(await eMates.totalSupply()).to.be.equal(2);
        minterMix = minterMix.add(mintPrice);

        await expect(minter.connect(frank).mint()).to.be.reverted;

        const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
        let deadline = currentTime + 100;

        const { v, r, s } = await getERC20PermitSignature(frank, mix, { owner: frank.address, spender: minter.address, value: mintPrice }, 0, deadline);
        await expect(() => minter.connect(frank).mintWithPermit(deadline, v, r, s)).to.changeTokenBalances(mix, [frank, minter], [mintPrice.mul(-1), mintPrice]);

        expect(await eMates.ownerOf(2)).to.be.equal(frank.address);
        expect(await eMates.totalSupply()).to.be.equal(3);
        minterMix = minterMix.add(mintPrice);

        await eMates.mintBatch(10);
        expect(await eMates.totalSupply()).to.be.equal(10);
        await expect(minter.connect(alice).mint()).to.be.revertedWith("EMatesMinter: Limit exceeded");

        let newMintPrice = utils.parseEther("0.5");
        expect(await minter.setMintPrice(newMintPrice))
            .to.emit(minter, "SetMintPrice")
            .withArgs(newMintPrice);
        expect(await minter.mintPrice()).to.be.equal(newMintPrice);

        await minter.setLimit(100);
        await minter.setLimit(100);
        expect(await minter.limit()).to.be.equal(100);

        await expect(() => minter.connect(alice).mint()).to.changeTokenBalances(mix, [alice, minter], [newMintPrice.mul(-1), newMintPrice]);
        expect(await eMates.totalSupply()).to.be.equal(11);
        minterMix = minterMix.add(newMintPrice);

        expect(await mix.balanceOf(minter.address)).to.be.equal(minterMix);

        await expect(minter.connect(alice).withdrawEmix()).to.be.revertedWith("Ownable: caller is not the owner");
        await expect(() => minter.withdrawEmix()).to.changeTokenBalances(mix, [deployer, minter], [minterMix, minterMix.mul(-1)]);
        expect(await mix.balanceOf(minter.address)).to.be.equal(0);

        await expect(() => minter.connect(carol).mint()).to.changeTokenBalances(mix, [carol, minter], [newMintPrice.mul(-1), newMintPrice]);
        expect(await eMates.totalSupply()).to.be.equal(12);
        minterMix = newMintPrice;

        await minter.setLimit(0);
        await expect(minter.connect(alice).mint()).to.be.revertedWith("EMatesMinter: Limit exceeded");

        await minter.setLimit(20);

        for (let i = 0; i < 8; i++) {
            await minter.connect(dan).mint();
        }
        expect(await eMates.totalSupply()).to.be.equal(20);
        minterMix = minterMix.add(newMintPrice.mul(8));
        await expect(minter.connect(alice).mint()).to.be.revertedWith("EMatesMinter: Limit exceeded");

        await minter.setLimit(25);
        await eMates.mintBatch(30);
        expect(await eMates.totalSupply()).to.be.equal(30);
        await expect(minter.connect(alice).mint()).to.be.revertedWith("EMatesMinter: Limit exceeded");

        await minter.setLimit(50);
        await expect(() => minter.connect(dan).mint()).to.changeTokenBalances(mix, [dan, minter], [newMintPrice.mul(-1), newMintPrice]);
        minterMix = minterMix.add(newMintPrice);
        expect(await eMates.totalSupply()).to.be.equal(31);

        newMintPrice = utils.parseEther("0.2");
        expect(await minter.setMintPrice(newMintPrice))
            .to.emit(minter, "SetMintPrice")
            .withArgs(newMintPrice);
        expect(await minter.mintPrice()).to.be.equal(newMintPrice);

        for (let i = 32; i <= 50; i++) {
            await minter.connect(bob).mint();
        }
        expect(await eMates.totalSupply()).to.be.equal(50);
        minterMix = minterMix.add(newMintPrice.mul(19));
        await expect(() => minter.withdrawEmix()).to.changeTokenBalances(mix, [deployer, minter], [minterMix, minterMix.mul(-1)]);
        expect(await mix.balanceOf(minter.address)).to.be.equal(0);

        await expect(minter.connect(bob).mint()).to.be.revertedWith("EMatesMinter: Limit exceeded");
    });
});
