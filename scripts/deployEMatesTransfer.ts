import hardhat from "hardhat";
import { expandTo18Decimals } from "./number";

async function main() {
    console.log("deploy start")

    const EMatesTransfer = await hardhat.ethers.getContractFactory("EMatesTransfer")
    const transfer = await EMatesTransfer.deploy(
        "0xD0242443f18586C389a1013539e93f3a7b27018C",
    )
    console.log(`EMatesTransfer address: ${transfer.address}`)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
