import { ethers } from "hardhat";

async function main() {
  console.log("Deploying VibeChain contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy VibeCrowdfunding
  const VibeCrowdfunding = await ethers.getContractFactory("VibeCrowdfunding");
  const crowdfunding = await VibeCrowdfunding.deploy();
  await crowdfunding.waitForDeployment();
  const crowdfundingAddress = await crowdfunding.getAddress();
  console.log("VibeCrowdfunding deployed to:", crowdfundingAddress);

  // Deploy VibeVoting
  const VibeVoting = await ethers.getContractFactory("VibeVoting");
  const voting = await VibeVoting.deploy();
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();
  console.log("VibeVoting deployed to:", votingAddress);

  console.log("\nDeployment complete!");
  console.log("-------------------");
  console.log("VibeCrowdfunding:", crowdfundingAddress);
  console.log("VibeVoting:", votingAddress);

  return {
    crowdfunding: crowdfundingAddress,
    voting: votingAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
