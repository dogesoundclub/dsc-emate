import hardhat from "hardhat";

async function main() {
    console.log("deploy start")

    const EMates = await hardhat.ethers.getContractFactory("EMates")
    const emates = await EMates.deploy(
        "0x84f0C97ad61F12786c8497ac4Cd368994A7FB2e5",
        750,
    )
    console.log(`EMates address: ${emates.address}`)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
