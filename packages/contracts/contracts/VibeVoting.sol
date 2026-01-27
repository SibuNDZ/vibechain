// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VibeVoting is Ownable {
    struct VotingRound {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        bool finalized;
        string[] videoIds;
    }

    struct VoteRecord {
        string videoId;
        uint256 timestamp;
    }

    uint256 public currentRoundId;
    uint256 public votesPerUser = 3;

    mapping(uint256 => VotingRound) public rounds;
    mapping(uint256 => mapping(string => uint256)) public videoVotes;
    mapping(uint256 => mapping(address => VoteRecord[])) public userVotes;
    mapping(uint256 => mapping(address => mapping(string => bool))) public hasVotedFor;
    mapping(uint256 => string[]) public roundWinners;

    event RoundCreated(uint256 indexed roundId, uint256 startTime, uint256 endTime);
    event VoteCast(uint256 indexed roundId, address indexed voter, string videoId);
    event RoundFinalized(uint256 indexed roundId, string[] winners);

    constructor() Ownable(msg.sender) {}

    function createRound(uint256 durationDays, string[] calldata videoIds) external onlyOwner {
        require(durationDays > 0, "Invalid duration");
        require(videoIds.length > 0, "No videos");

        if (currentRoundId > 0) {
            require(rounds[currentRoundId].finalized, "Previous round not finalized");
        }

        currentRoundId++;

        rounds[currentRoundId] = VotingRound({
            id: currentRoundId,
            startTime: block.timestamp,
            endTime: block.timestamp + (durationDays * 1 days),
            finalized: false,
            videoIds: videoIds
        });

        emit RoundCreated(currentRoundId, block.timestamp, rounds[currentRoundId].endTime);
    }

    function vote(string calldata videoId) external {
        VotingRound storage round = rounds[currentRoundId];

        require(round.id != 0, "No active round");
        require(block.timestamp >= round.startTime, "Round not started");
        require(block.timestamp < round.endTime, "Round ended");
        require(!round.finalized, "Round finalized");
        require(!hasVotedFor[currentRoundId][msg.sender][videoId], "Already voted for this video");
        require(userVotes[currentRoundId][msg.sender].length < votesPerUser, "Vote limit reached");
        require(_isValidVideo(currentRoundId, videoId), "Invalid video");

        hasVotedFor[currentRoundId][msg.sender][videoId] = true;
        userVotes[currentRoundId][msg.sender].push(VoteRecord({
            videoId: videoId,
            timestamp: block.timestamp
        }));
        videoVotes[currentRoundId][videoId]++;

        emit VoteCast(currentRoundId, msg.sender, videoId);
    }

    function finalizeRound(uint256 topCount) external onlyOwner {
        VotingRound storage round = rounds[currentRoundId];

        require(round.id != 0, "No active round");
        require(block.timestamp >= round.endTime, "Round not ended");
        require(!round.finalized, "Already finalized");

        // Simple selection of top videos (in production, use more sophisticated sorting)
        string[] memory winners = new string[](topCount);
        uint256[] memory topVotes = new uint256[](topCount);

        for (uint256 i = 0; i < round.videoIds.length; i++) {
            string memory videoId = round.videoIds[i];
            uint256 votes = videoVotes[currentRoundId][videoId];

            for (uint256 j = 0; j < topCount; j++) {
                if (votes > topVotes[j]) {
                    // Shift elements down
                    for (uint256 k = topCount - 1; k > j; k--) {
                        winners[k] = winners[k - 1];
                        topVotes[k] = topVotes[k - 1];
                    }
                    winners[j] = videoId;
                    topVotes[j] = votes;
                    break;
                }
            }
        }

        round.finalized = true;

        for (uint256 i = 0; i < topCount; i++) {
            if (bytes(winners[i]).length > 0) {
                roundWinners[currentRoundId].push(winners[i]);
            }
        }

        emit RoundFinalized(currentRoundId, roundWinners[currentRoundId]);
    }

    function _isValidVideo(uint256 roundId, string calldata videoId) internal view returns (bool) {
        string[] storage videos = rounds[roundId].videoIds;
        for (uint256 i = 0; i < videos.length; i++) {
            if (keccak256(bytes(videos[i])) == keccak256(bytes(videoId))) {
                return true;
            }
        }
        return false;
    }

    function getRound(uint256 roundId) external view returns (VotingRound memory) {
        return rounds[roundId];
    }

    function getVideoVotes(uint256 roundId, string calldata videoId) external view returns (uint256) {
        return videoVotes[roundId][videoId];
    }

    function getUserVotes(uint256 roundId, address user) external view returns (VoteRecord[] memory) {
        return userVotes[roundId][user];
    }

    function getRoundWinners(uint256 roundId) external view returns (string[] memory) {
        return roundWinners[roundId];
    }

    function setVotesPerUser(uint256 newLimit) external onlyOwner {
        require(newLimit > 0 && newLimit <= 10, "Invalid limit");
        votesPerUser = newLimit;
    }
}
