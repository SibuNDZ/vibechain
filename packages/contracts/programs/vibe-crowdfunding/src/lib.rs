use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod vibe_crowdfunding {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, platform_fee_bps: u16) -> Result<()> {
        let state = &mut ctx.accounts.platform_state;
        state.authority = ctx.accounts.authority.key();
        state.platform_fee_bps = platform_fee_bps;
        state.campaign_count = 0;
        Ok(())
    }

    pub fn create_campaign(
        ctx: Context<CreateCampaign>,
        video_id: String,
        goal_amount: u64,
        duration_days: u64,
    ) -> Result<()> {
        require!(goal_amount > 0, ErrorCode::InvalidGoalAmount);
        require!(
            duration_days > 0 && duration_days <= 90,
            ErrorCode::InvalidDuration
        );
        require!(video_id.len() <= 64, ErrorCode::VideoIdTooLong);

        let state = &mut ctx.accounts.platform_state;
        state.campaign_count += 1;

        let campaign = &mut ctx.accounts.campaign;
        let clock = Clock::get()?;

        campaign.id = state.campaign_count;
        campaign.creator = ctx.accounts.creator.key();
        campaign.video_id = video_id;
        campaign.goal_amount = goal_amount;
        campaign.raised_amount = 0;
        campaign.start_time = clock.unix_timestamp;
        campaign.end_time = clock.unix_timestamp + (duration_days as i64 * 86400);
        campaign.claimed = false;
        campaign.status = CampaignStatus::Active;
        campaign.contributor_count = 0;
        campaign.bump = ctx.bumps.campaign;

        emit!(CampaignCreated {
            campaign_id: campaign.id,
            creator: campaign.creator,
            video_id: campaign.video_id.clone(),
            goal_amount,
            end_time: campaign.end_time,
        });

        Ok(())
    }

    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidContribution);

        let campaign = &mut ctx.accounts.campaign;
        let clock = Clock::get()?;

        require!(
            campaign.status == CampaignStatus::Active,
            ErrorCode::CampaignNotActive
        );
        require!(clock.unix_timestamp < campaign.end_time, ErrorCode::CampaignEnded);

        // Transfer SOL from contributor to campaign vault PDA
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.contributor.to_account_info(),
                    to: ctx.accounts.campaign_vault.to_account_info(),
                },
            ),
            amount,
        )?;

        // Track contribution
        let contribution = &mut ctx.accounts.contribution;
        if contribution.amount == 0 {
            campaign.contributor_count += 1;
        }
        contribution.contributor = ctx.accounts.contributor.key();
        contribution.campaign_id = campaign.id;
        contribution.amount += amount;
        contribution.bump = ctx.bumps.contribution;

        campaign.raised_amount += amount;

        emit!(ContributionMade {
            campaign_id: campaign.id,
            contributor: ctx.accounts.contributor.key(),
            amount,
        });

        // Check if goal reached
        if campaign.raised_amount >= campaign.goal_amount {
            campaign.status = CampaignStatus::Successful;
        }

        Ok(())
    }

    pub fn claim_funds(ctx: Context<ClaimFunds>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;

        require!(
            campaign.creator == ctx.accounts.creator.key(),
            ErrorCode::NotCampaignCreator
        );
        require!(!campaign.claimed, ErrorCode::AlreadyClaimed);

        let clock = Clock::get()?;
        require!(
            campaign.status == CampaignStatus::Successful
                || (clock.unix_timestamp >= campaign.end_time
                    && campaign.raised_amount >= campaign.goal_amount),
            ErrorCode::CampaignNotSuccessful
        );

        campaign.claimed = true;
        if campaign.status == CampaignStatus::Active {
            campaign.status = CampaignStatus::Successful;
        }

        let platform_fee_bps = ctx.accounts.platform_state.platform_fee_bps as u64;
        let platform_fee = (campaign.raised_amount * platform_fee_bps) / 10000;
        let creator_amount = campaign.raised_amount - platform_fee;

        // Transfer platform fee
        let vault_bump = ctx.bumps.campaign_vault;
        let campaign_id_bytes = campaign.id.to_le_bytes();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"vault",
            campaign_id_bytes.as_ref(),
            &[vault_bump],
        ]];

        if platform_fee > 0 {
            system_program::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.campaign_vault.to_account_info(),
                        to: ctx.accounts.platform_authority.to_account_info(),
                    },
                    signer_seeds,
                ),
                platform_fee,
            )?;
        }

        // Transfer creator amount
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.campaign_vault.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
                signer_seeds,
            ),
            creator_amount,
        )?;

        emit!(FundsClaimed {
            campaign_id: campaign.id,
            creator: ctx.accounts.creator.key(),
            amount: creator_amount,
        });

        Ok(())
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let clock = Clock::get()?;

        require!(
            (clock.unix_timestamp >= campaign.end_time
                && campaign.raised_amount < campaign.goal_amount)
                || campaign.status == CampaignStatus::Cancelled,
            ErrorCode::RefundNotAvailable
        );

        let contribution = &mut ctx.accounts.contribution;
        let refund_amount = contribution.amount;
        require!(refund_amount > 0, ErrorCode::NoContribution);

        contribution.amount = 0;

        if campaign.status == CampaignStatus::Active {
            campaign.status = CampaignStatus::Failed;
        }

        let vault_bump = ctx.bumps.campaign_vault;
        let campaign_id_bytes = campaign.id.to_le_bytes();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"vault",
            campaign_id_bytes.as_ref(),
            &[vault_bump],
        ]];

        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.campaign_vault.to_account_info(),
                    to: ctx.accounts.contributor.to_account_info(),
                },
                signer_seeds,
            ),
            refund_amount,
        )?;

        emit!(RefundIssued {
            campaign_id: campaign.id,
            contributor: ctx.accounts.contributor.key(),
            amount: refund_amount,
        });

        Ok(())
    }

    pub fn cancel_campaign(ctx: Context<CancelCampaign>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;

        require!(
            campaign.creator == ctx.accounts.authority.key()
                || ctx.accounts.platform_state.authority == ctx.accounts.authority.key(),
            ErrorCode::NotAuthorized
        );
        require!(
            campaign.status == CampaignStatus::Active,
            ErrorCode::CampaignNotActive
        );
        require!(!campaign.claimed, ErrorCode::AlreadyClaimed);

        campaign.status = CampaignStatus::Cancelled;

        emit!(CampaignCancelled {
            campaign_id: campaign.id,
        });

        Ok(())
    }

    pub fn set_platform_fee(ctx: Context<SetPlatformFee>, new_fee_bps: u16) -> Result<()> {
        require!(new_fee_bps <= 1000, ErrorCode::FeeTooHigh); // Max 10%
        let state = &mut ctx.accounts.platform_state;
        state.platform_fee_bps = new_fee_bps;
        Ok(())
    }
}

// ── Accounts ──────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PlatformState::INIT_SPACE,
        seeds = [b"platform"],
        bump,
    )]
    pub platform_state: Account<'info, PlatformState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateCampaign<'info> {
    #[account(
        mut,
        seeds = [b"platform"],
        bump,
    )]
    pub platform_state: Account<'info, PlatformState>,
    #[account(
        init,
        payer = creator,
        space = 8 + Campaign::INIT_SPACE,
        seeds = [b"campaign", (platform_state.campaign_count + 1).to_le_bytes().as_ref()],
        bump,
    )]
    pub campaign: Account<'info, Campaign>,
    /// CHECK: Campaign vault PDA that holds SOL contributions
    #[account(
        mut,
        seeds = [b"vault", (platform_state.campaign_count + 1).to_le_bytes().as_ref()],
        bump,
    )]
    pub campaign_vault: SystemAccount<'info>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(
        mut,
        seeds = [b"campaign", campaign.id.to_le_bytes().as_ref()],
        bump = campaign.bump,
    )]
    pub campaign: Account<'info, Campaign>,
    /// CHECK: Campaign vault PDA
    #[account(
        mut,
        seeds = [b"vault", campaign.id.to_le_bytes().as_ref()],
        bump,
    )]
    pub campaign_vault: SystemAccount<'info>,
    #[account(
        init_if_needed,
        payer = contributor,
        space = 8 + Contribution::INIT_SPACE,
        seeds = [b"contribution", campaign.id.to_le_bytes().as_ref(), contributor.key().as_ref()],
        bump,
    )]
    pub contribution: Account<'info, Contribution>,
    #[account(mut)]
    pub contributor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimFunds<'info> {
    #[account(
        mut,
        seeds = [b"platform"],
        bump,
    )]
    pub platform_state: Account<'info, PlatformState>,
    #[account(
        mut,
        seeds = [b"campaign", campaign.id.to_le_bytes().as_ref()],
        bump = campaign.bump,
    )]
    pub campaign: Account<'info, Campaign>,
    /// CHECK: Campaign vault PDA
    #[account(
        mut,
        seeds = [b"vault", campaign.id.to_le_bytes().as_ref()],
        bump,
    )]
    pub campaign_vault: SystemAccount<'info>,
    #[account(mut)]
    pub creator: Signer<'info>,
    /// CHECK: Platform authority receives fee
    #[account(mut, address = platform_state.authority)]
    pub platform_authority: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(
        mut,
        seeds = [b"campaign", campaign.id.to_le_bytes().as_ref()],
        bump = campaign.bump,
    )]
    pub campaign: Account<'info, Campaign>,
    /// CHECK: Campaign vault PDA
    #[account(
        mut,
        seeds = [b"vault", campaign.id.to_le_bytes().as_ref()],
        bump,
    )]
    pub campaign_vault: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [b"contribution", campaign.id.to_le_bytes().as_ref(), contributor.key().as_ref()],
        bump = contribution.bump,
    )]
    pub contribution: Account<'info, Contribution>,
    #[account(mut)]
    pub contributor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelCampaign<'info> {
    #[account(
        seeds = [b"platform"],
        bump,
    )]
    pub platform_state: Account<'info, PlatformState>,
    #[account(
        mut,
        seeds = [b"campaign", campaign.id.to_le_bytes().as_ref()],
        bump = campaign.bump,
    )]
    pub campaign: Account<'info, Campaign>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetPlatformFee<'info> {
    #[account(
        mut,
        seeds = [b"platform"],
        bump,
        has_one = authority,
    )]
    pub platform_state: Account<'info, PlatformState>,
    pub authority: Signer<'info>,
}

// ── State ─────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct PlatformState {
    pub authority: Pubkey,
    pub platform_fee_bps: u16,
    pub campaign_count: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Campaign {
    pub id: u64,
    pub creator: Pubkey,
    #[max_len(64)]
    pub video_id: String,
    pub goal_amount: u64,
    pub raised_amount: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub claimed: bool,
    pub status: CampaignStatus,
    pub contributor_count: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Contribution {
    pub contributor: Pubkey,
    pub campaign_id: u64,
    pub amount: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum CampaignStatus {
    Active,
    Successful,
    Failed,
    Cancelled,
}

// ── Events ────────────────────────────────────────────────────────

#[event]
pub struct CampaignCreated {
    pub campaign_id: u64,
    pub creator: Pubkey,
    pub video_id: String,
    pub goal_amount: u64,
    pub end_time: i64,
}

#[event]
pub struct ContributionMade {
    pub campaign_id: u64,
    pub contributor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct FundsClaimed {
    pub campaign_id: u64,
    pub creator: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RefundIssued {
    pub campaign_id: u64,
    pub contributor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct CampaignCancelled {
    pub campaign_id: u64,
}

// ── Errors ────────────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("Goal amount must be greater than 0")]
    InvalidGoalAmount,
    #[msg("Duration must be between 1 and 90 days")]
    InvalidDuration,
    #[msg("Video ID too long (max 64 chars)")]
    VideoIdTooLong,
    #[msg("Campaign is not active")]
    CampaignNotActive,
    #[msg("Campaign has ended")]
    CampaignEnded,
    #[msg("Contribution must be greater than 0")]
    InvalidContribution,
    #[msg("Not the campaign creator")]
    NotCampaignCreator,
    #[msg("Funds already claimed")]
    AlreadyClaimed,
    #[msg("Campaign not successful")]
    CampaignNotSuccessful,
    #[msg("Refund not available")]
    RefundNotAvailable,
    #[msg("No contribution found")]
    NoContribution,
    #[msg("Not authorized")]
    NotAuthorized,
    #[msg("Platform fee too high (max 10%)")]
    FeeTooHigh,
}
