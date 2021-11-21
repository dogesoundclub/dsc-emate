import hardhat from "hardhat";
import { expandTo18Decimals } from "./number";

async function main() {
    console.log("deploy start")

    const EMatesMinter = await hardhat.ethers.getContractFactory("EMatesMinter")
    const ematesMinter = await EMatesMinter.deploy(
        "0xD0242443f18586C389a1013539e93f3a7b27018C",
        "0x5DB69B9f173f9D9FA91b7cDCc4Dc9939C0499CFe",
        expandTo18Decimals(30),
    )
    console.log(`EMatesMinter address: ${ematesMinter.address}`)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
