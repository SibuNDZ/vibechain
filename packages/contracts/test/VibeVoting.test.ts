import { expect } from "chai";
import { ethers } from "hardhat";
import { VibeVoting } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VibeVoting", function () {
  let voting: VibeVoting;
  let owner: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;
  let voter3: SignerWithAddress;

  const videoIds = ["video1", "video2", "video3", "video4", "video5"];
  const ONE_DAY = 24 * 60 * 60;

  beforeEach(async function () {
    [owner, voter1, voter2, voter3] = await ethers.getSigners();

    const VibeVoting = await ethers.getContractFactory("VibeVoting");
    voting = await VibeVoting.deploy();
  });

  describe("Round Creation", function () {
    it("should create a voting round", async function () {
      await voting.createRound(7, videoIds);

      const round = await voting.getRound(1);
      expect(round.id).to.equal(1);
      expect(round.finalized).to.be.false;
      expect(round.videoIds).to.deep.equal(videoIds);
    });

    it("should emit RoundCreated event", async function () {
      await expect(voting.createRound(7, videoIds))
        .to.emit(voting, "RoundCreated")
        .withArgs(1, await time.latest() + 1, await time.latest() + 1 + 7 * ONE_DAY);
    });

    it("should set correct end time based on duration", async function () {
      const durationDays = 14;
      await voting.createRound(durationDays, videoIds);

      const round = await voting.getRound(1);
      const expectedEndTime = round.startTime + BigInt(durationDays * ONE_DAY);
      expect(round.endTime).to.equal(expectedEndTime);
    });

    it("should reject zero duration", async function () {
      await expect(voting.createRound(0, videoIds)).to.be.revertedWith(
        "Invalid duration"
      );
    });

    it("should reject empty video list", async function () {
      await expect(voting.createRound(7, [])).to.be.revertedWith("No videos");
    });

    it("should reject if previous round not finalized", async function () {
      await voting.createRound(7, videoIds);

      await expect(voting.createRound(7, videoIds)).to.be.revertedWith(
        "Previous round not finalized"
      );
    });

    it("should only allow owner to create rounds", async function () {
      await expect(
        voting.connect(voter1).createRound(7, videoIds)
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });

    it("should increment round id correctly", async function () {
      await voting.createRound(1, videoIds);
      await time.increase(2 * ONE_DAY);
      await voting.finalizeRound(2);

      await voting.createRound(1, ["video6", "video7"]);

      expect(await voting.currentRoundId()).to.equal(2);
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await voting.createRound(7, videoIds);
    });

    it("should allow voting for a video", async function () {
      await voting.connect(voter1).vote("video1");

      const votes = await voting.getVideoVotes(1, "video1");
      expect(votes).to.equal(1);
    });

    it("should emit VoteCast event", async function () {
      await expect(voting.connect(voter1).vote("video1"))
        .to.emit(voting, "VoteCast")
        .withArgs(1, voter1.address, "video1");
    });

    it("should track user votes", async function () {
      await voting.connect(voter1).vote("video1");
      await voting.connect(voter1).vote("video2");

      const userVotes = await voting.getUserVotes(1, voter1.address);
      expect(userVotes.length).to.equal(2);
      expect(userVotes[0].videoId).to.equal("video1");
      expect(userVotes[1].videoId).to.equal("video2");
    });

    it("should prevent double voting for same video", async function () {
      await voting.connect(voter1).vote("video1");

      await expect(voting.connect(voter1).vote("video1")).to.be.revertedWith(
        "Already voted for this video"
      );
    });

    it("should enforce vote limit per user (default 3)", async function () {
      await voting.connect(voter1).vote("video1");
      await voting.connect(voter1).vote("video2");
      await voting.connect(voter1).vote("video3");

      await expect(voting.connect(voter1).vote("video4")).to.be.revertedWith(
        "Vote limit reached"
      );
    });

    it("should allow different users to vote for same video", async function () {
      await voting.connect(voter1).vote("video1");
      await voting.connect(voter2).vote("video1");
      await voting.connect(voter3).vote("video1");

      const votes = await voting.getVideoVotes(1, "video1");
      expect(votes).to.equal(3);
    });

    it("should reject voting for invalid video", async function () {
      await expect(
        voting.connect(voter1).vote("nonexistent")
      ).to.be.revertedWith("Invalid video");
    });

    it("should reject voting when no active round", async function () {
      // Deploy new contract with no round
      const VibeVoting = await ethers.getContractFactory("VibeVoting");
      const newVoting = await VibeVoting.deploy();

      await expect(newVoting.connect(voter1).vote("video1")).to.be.revertedWith(
        "No active round"
      );
    });

    it("should reject voting after round ended", async function () {
      await time.increase(8 * ONE_DAY); // Move past end time

      await expect(voting.connect(voter1).vote("video1")).to.be.revertedWith(
        "Round ended"
      );
    });

    it("should reject voting after round finalized", async function () {
      await time.increase(8 * ONE_DAY);
      await voting.finalizeRound(2);

      await expect(voting.connect(voter1).vote("video1")).to.be.revertedWith(
        "Round finalized"
      );
    });
  });

  describe("Round Finalization", function () {
    beforeEach(async function () {
      await voting.createRound(1, videoIds);
      // Cast some votes
      await voting.connect(voter1).vote("video1");
      await voting.connect(voter1).vote("video2");
      await voting.connect(voter2).vote("video1");
      await voting.connect(voter2).vote("video3");
      await voting.connect(voter3).vote("video1");
      // video1: 3 votes, video2: 1 vote, video3: 1 vote
    });

    it("should prevent early finalization", async function () {
      await expect(voting.finalizeRound(3)).to.be.revertedWith(
        "Round not ended"
      );
    });

    it("should finalize and determine winners correctly", async function () {
      await time.increase(2 * ONE_DAY);
      await voting.finalizeRound(3);

      const winners = await voting.getRoundWinners(1);
      expect(winners[0]).to.equal("video1"); // 3 votes - 1st place
    });

    it("should mark round as finalized", async function () {
      await time.increase(2 * ONE_DAY);
      await voting.finalizeRound(2);

      const round = await voting.getRound(1);
      expect(round.finalized).to.be.true;
    });

    it("should emit RoundFinalized event", async function () {
      await time.increase(2 * ONE_DAY);

      await expect(voting.finalizeRound(2)).to.emit(voting, "RoundFinalized");
    });

    it("should prevent double finalization", async function () {
      await time.increase(2 * ONE_DAY);
      await voting.finalizeRound(2);

      await expect(voting.finalizeRound(2)).to.be.revertedWith(
        "Already finalized"
      );
    });

    it("should only allow owner to finalize", async function () {
      await time.increase(2 * ONE_DAY);

      await expect(
        voting.connect(voter1).finalizeRound(2)
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });

    it("should handle finalization with more topCount than videos with votes", async function () {
      await time.increase(2 * ONE_DAY);
      // Only 3 videos have votes but we ask for top 5
      await voting.finalizeRound(5);

      const winners = await voting.getRoundWinners(1);
      // Should only include videos that actually have votes
      expect(winners.length).to.be.lessThanOrEqual(5);
    });
  });

  describe("Admin Functions", function () {
    it("should allow owner to set votes per user", async function () {
      await voting.setVotesPerUser(5);
      expect(await voting.votesPerUser()).to.equal(5);
    });

    it("should reject non-owner setting votes per user", async function () {
      await expect(
        voting.connect(voter1).setVotesPerUser(5)
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });

    it("should reject zero vote limit", async function () {
      await expect(voting.setVotesPerUser(0)).to.be.revertedWith(
        "Invalid limit"
      );
    });

    it("should reject vote limit greater than 10", async function () {
      await expect(voting.setVotesPerUser(11)).to.be.revertedWith(
        "Invalid limit"
      );
    });

    it("should allow vote limit of 10", async function () {
      await voting.setVotesPerUser(10);
      expect(await voting.votesPerUser()).to.equal(10);
    });

    it("should allow vote limit of 1", async function () {
      await voting.setVotesPerUser(1);
      expect(await voting.votesPerUser()).to.equal(1);
    });

    it("should apply new vote limit to current round", async function () {
      await voting.createRound(7, videoIds);
      await voting.setVotesPerUser(1);

      await voting.connect(voter1).vote("video1");

      await expect(voting.connect(voter1).vote("video2")).to.be.revertedWith(
        "Vote limit reached"
      );
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await voting.createRound(7, videoIds);
      await voting.connect(voter1).vote("video1");
      await voting.connect(voter2).vote("video1");
    });

    it("should return round details", async function () {
      const round = await voting.getRound(1);

      expect(round.id).to.equal(1);
      expect(round.videoIds.length).to.equal(5);
      expect(round.finalized).to.be.false;
    });

    it("should return video votes", async function () {
      const votes = await voting.getVideoVotes(1, "video1");
      expect(votes).to.equal(2);
    });

    it("should return zero votes for unvoted video", async function () {
      const votes = await voting.getVideoVotes(1, "video5");
      expect(votes).to.equal(0);
    });

    it("should return user votes", async function () {
      const votes = await voting.getUserVotes(1, voter1.address);
      expect(votes.length).to.equal(1);
      expect(votes[0].videoId).to.equal("video1");
    });

    it("should return empty array for user with no votes", async function () {
      const votes = await voting.getUserVotes(1, voter3.address);
      expect(votes.length).to.equal(0);
    });

    it("should return round winners after finalization", async function () {
      await time.increase(8 * ONE_DAY);
      await voting.finalizeRound(3);

      const winners = await voting.getRoundWinners(1);
      expect(winners.length).to.be.greaterThan(0);
    });

    it("should return empty winners before finalization", async function () {
      const winners = await voting.getRoundWinners(1);
      expect(winners.length).to.equal(0);
    });
  });

  describe("Multiple Rounds", function () {
    it("should allow creating new round after previous is finalized", async function () {
      // Round 1
      await voting.createRound(1, ["video1", "video2"]);
      await voting.connect(voter1).vote("video1");
      await time.increase(2 * ONE_DAY);
      await voting.finalizeRound(1);

      // Round 2
      await voting.createRound(1, ["video3", "video4"]);
      expect(await voting.currentRoundId()).to.equal(2);

      // Can vote in new round
      await voting.connect(voter1).vote("video3");
      const votes = await voting.getVideoVotes(2, "video3");
      expect(votes).to.equal(1);
    });

    it("should keep round data separate", async function () {
      // Round 1
      await voting.createRound(1, ["video1", "video2"]);
      await voting.connect(voter1).vote("video1");
      await time.increase(2 * ONE_DAY);
      await voting.finalizeRound(1);

      // Round 2
      await voting.createRound(1, ["video1", "video3"]); // video1 in both rounds
      await voting.connect(voter1).vote("video1");

      // Check votes are separate per round
      const round1Votes = await voting.getVideoVotes(1, "video1");
      const round2Votes = await voting.getVideoVotes(2, "video1");

      expect(round1Votes).to.equal(1);
      expect(round2Votes).to.equal(1);
    });
  });
});
