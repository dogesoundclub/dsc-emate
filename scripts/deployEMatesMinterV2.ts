import hardhat from "hardhat";
import { expandTo18Decimals } from "./number";

async function main() {
    console.log("deploy start")

    const EMatesMinterV2 = await hardhat.ethers.getContractFactory("EMatesMinterV2")
    const ematesMinterV2 = await EMatesMinterV2.deploy(
        "0xD0242443f18586C389a1013539e93f3a7b27018C",
        "0x5DB69B9f173f9D9FA91b7cDCc4Dc9939C0499CFe",
        expandTo18Decimals(30),
    )
    console.log(`EMatesMinterV2 address: ${ematesMinterV2.address}`)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
