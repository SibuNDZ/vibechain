// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VibeCrowdfunding is Ownable, ReentrancyGuard {
    struct Campaign {
        uint256 id;
        address creator;
        string videoId;
        uint256 goalAmount;
        uint256 raisedAmount;
        uint256 startTime;
        uint256 endTime;
        bool claimed;
        CampaignStatus status;
    }

    enum CampaignStatus {
        Active,
        Successful,
        Failed,
        Cancelled
    }

    uint256 public campaignCount;
    uint256 public platformFeePercent = 250; // 2.5% (basis points)

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => address[]) public campaignContributors;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string videoId,
        uint256 goalAmount,
        uint256 endTime
    );

    event ContributionMade(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );

    event FundsClaimed(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );

    event RefundIssued(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );

    event CampaignCancelled(uint256 indexed campaignId);

    constructor() Ownable(msg.sender) {}

    function createCampaign(
        string calldata videoId,
        uint256 goalAmount,
        uint256 durationDays
    ) external returns (uint256) {
        require(goalAmount > 0, "Goal must be greater than 0");
        require(durationDays > 0 && durationDays <= 90, "Duration must be 1-90 days");

        campaignCount++;
        uint256 campaignId = campaignCount;

        campaigns[campaignId] = Campaign({
            id: campaignId,
            creator: msg.sender,
            videoId: videoId,
            goalAmount: goalAmount,
            raisedAmount: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + (durationDays * 1 days),
            claimed: false,
            status: CampaignStatus.Active
        });

        emit CampaignCreated(
            campaignId,
            msg.sender,
            videoId,
            goalAmount,
            campaigns[campaignId].endTime
        );

        return campaignId;
    }

    function contribute(uint256 campaignId) external payable nonReentrant {
        Campaign storage campaign = campaigns[campaignId];

        require(campaign.id != 0, "Campaign does not exist");
        require(campaign.status == CampaignStatus.Active, "Campaign not active");
        require(block.timestamp < campaign.endTime, "Campaign ended");
        require(msg.value > 0, "Contribution must be greater than 0");

        if (contributions[campaignId][msg.sender] == 0) {
            campaignContributors[campaignId].push(msg.sender);
        }

        contributions[campaignId][msg.sender] += msg.value;
        campaign.raisedAmount += msg.value;

        emit ContributionMade(campaignId, msg.sender, msg.value);

        // Check if goal reached
        if (campaign.raisedAmount >= campaign.goalAmount) {
            campaign.status = CampaignStatus.Successful;
        }
    }

    function claimFunds(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[campaignId];

        require(campaign.creator == msg.sender, "Not campaign creator");
        require(!campaign.claimed, "Already claimed");
        require(
            campaign.status == CampaignStatus.Successful ||
            (block.timestamp >= campaign.endTime && campaign.raisedAmount >= campaign.goalAmount),
            "Campaign not successful"
        );

        campaign.claimed = true;
        if (campaign.status == CampaignStatus.Active) {
            campaign.status = CampaignStatus.Successful;
        }

        uint256 platformFee = (campaign.raisedAmount * platformFeePercent) / 10000;
        uint256 creatorAmount = campaign.raisedAmount - platformFee;

        (bool feeSuccess, ) = owner().call{value: platformFee}("");
        require(feeSuccess, "Fee transfer failed");

        (bool success, ) = msg.sender.call{value: creatorAmount}("");
        require(success, "Transfer failed");

        emit FundsClaimed(campaignId, msg.sender, creatorAmount);
    }

    function refund(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[campaignId];

        require(
            (block.timestamp >= campaign.endTime && campaign.raisedAmount < campaign.goalAmount) ||
            campaign.status == CampaignStatus.Cancelled,
            "Refund not available"
        );

        uint256 contributedAmount = contributions[campaignId][msg.sender];
        require(contributedAmount > 0, "No contribution found");

        contributions[campaignId][msg.sender] = 0;

        if (campaign.status == CampaignStatus.Active) {
            campaign.status = CampaignStatus.Failed;
        }

        (bool success, ) = msg.sender.call{value: contributedAmount}("");
        require(success, "Refund failed");

        emit RefundIssued(campaignId, msg.sender, contributedAmount);
    }

    function cancelCampaign(uint256 campaignId) external {
        Campaign storage campaign = campaigns[campaignId];

        require(campaign.creator == msg.sender || msg.sender == owner(), "Not authorized");
        require(campaign.status == CampaignStatus.Active, "Campaign not active");
        require(!campaign.claimed, "Funds already claimed");

        campaign.status = CampaignStatus.Cancelled;

        emit CampaignCancelled(campaignId);
    }

    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        return campaigns[campaignId];
    }

    function getContribution(uint256 campaignId, address contributor) external view returns (uint256) {
        return contributions[campaignId][contributor];
    }

    function getContributorCount(uint256 campaignId) external view returns (uint256) {
        return campaignContributors[campaignId].length;
    }

    function setPlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 1000, "Fee too high"); // Max 10%
        platformFeePercent = newFeePercent;
    }
}
