import { expect } from "chai";
import { ethers } from "hardhat";
import { VibeCrowdfunding } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("VibeCrowdfunding", function () {
  let crowdfunding: VibeCrowdfunding;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let contributor1: SignerWithAddress;
  let contributor2: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator, contributor1, contributor2] = await ethers.getSigners();

    const VibeCrowdfunding = await ethers.getContractFactory("VibeCrowdfunding");
    crowdfunding = await VibeCrowdfunding.deploy();
  });

  describe("Campaign Creation", function () {
    it("should create a campaign", async function () {
      const goalAmount = ethers.parseEther("10");
      const durationDays = 30;

      await crowdfunding.connect(creator).createCampaign("video123", goalAmount, durationDays);

      const campaign = await crowdfunding.getCampaign(1);
      expect(campaign.creator).to.equal(creator.address);
      expect(campaign.goalAmount).to.equal(goalAmount);
      expect(campaign.videoId).to.equal("video123");
    });

    it("should reject invalid duration", async function () {
      await expect(
        crowdfunding.connect(creator).createCampaign("video123", ethers.parseEther("10"), 0)
      ).to.be.revertedWith("Duration must be 1-90 days");
    });
  });

  describe("Contributions", function () {
    beforeEach(async function () {
      await crowdfunding.connect(creator).createCampaign("video123", ethers.parseEther("10"), 30);
    });

    it("should accept contributions", async function () {
      const contribution = ethers.parseEther("1");
      await crowdfunding.connect(contributor1).contribute(1, { value: contribution });

      const campaign = await crowdfunding.getCampaign(1);
      expect(campaign.raisedAmount).to.equal(contribution);
    });

    it("should track contributor amounts", async function () {
      const contribution = ethers.parseEther("2");
      await crowdfunding.connect(contributor1).contribute(1, { value: contribution });

      const amount = await crowdfunding.getContribution(1, contributor1.address);
      expect(amount).to.equal(contribution);
    });
  });
});
