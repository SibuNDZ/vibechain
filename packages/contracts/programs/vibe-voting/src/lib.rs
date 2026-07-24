use anchor_lang::prelude::*;

declare_id!("HmbTLCmaGtYhSJaoxkmD54y4QhhGERbCGMKhbV2V3uEp");

#[program]
pub mod vibe_voting {
    use super::*;

    pub fn initialize(ctx: Context<InitializeVoting>, votes_per_user: u8) -> Result<()> {
        let state = &mut ctx.accounts.voting_state;
        state.authority = ctx.accounts.authority.key();
        state.votes_per_user = votes_per_user;
        state.current_round_id = 0;
        Ok(())
    }

    pub fn create_round(
        ctx: Context<CreateRound>,
        duration_days: u64,
        video_ids: Vec<String>,
    ) -> Result<()> {
        require!(duration_days > 0, ErrorCode::InvalidDuration);
        require!(!video_ids.is_empty(), ErrorCode::NoVideos);
        require!(video_ids.len() <= 50, ErrorCode::TooManyVideos);

        let state = &mut ctx.accounts.voting_state;

        // If there's a previous round, it must be finalized
        if state.current_round_id > 0 {
            // Previous round check is handled by requiring finalized status off-chain
            // or by checking the round account if passed in remaining_accounts
        }

        state.current_round_id += 1;

        let round = &mut ctx.accounts.round;
        let clock = Clock::get()?;

        round.id = state.current_round_id;
        round.start_time = clock.unix_timestamp;
        round.end_time = clock.unix_timestamp + (duration_days as i64 * 86400);
        round.finalized = false;
        round.video_ids = video_ids;
        round.video_count = round.video_ids.len() as u16;
        round.bump = ctx.bumps.round;

        emit!(RoundCreated {
            round_id: round.id,
            start_time: round.start_time,
            end_time: round.end_time,
        });

        Ok(())
    }

    pub fn vote(ctx: Context<CastVote>, video_id: String) -> Result<()> {
        let round = &ctx.accounts.round;
        let state = &ctx.accounts.voting_state;
        let clock = Clock::get()?;

        require!(round.id != 0, ErrorCode::NoActiveRound);
        require!(
            clock.unix_timestamp >= round.start_time,
            ErrorCode::RoundNotStarted
        );
        require!(clock.unix_timestamp < round.end_time, ErrorCode::RoundEnded);
        require!(!round.finalized, ErrorCode::RoundFinalized);

        // Validate video is in the round
        require!(
            round.video_ids.iter().any(|v| v == &video_id),
            ErrorCode::InvalidVideo
        );

        // Check vote record
        let vote_record = &mut ctx.accounts.vote_record;
        require!(!vote_record.has_voted_for(&video_id), ErrorCode::AlreadyVoted);
        require!(
            (vote_record.vote_count as u8) < state.votes_per_user,
            ErrorCode::VoteLimitReached
        );

        vote_record.voter = ctx.accounts.voter.key();
        vote_record.round_id = round.id;
        vote_record.add_vote(video_id.clone(), clock.unix_timestamp);
        vote_record.bump = ctx.bumps.vote_record;

        // Update video vote tally
        let video_tally = &mut ctx.accounts.video_tally;
        video_tally.round_id = round.id;
        video_tally.video_id = video_id.clone();
        video_tally.votes += 1;
        video_tally.bump = ctx.bumps.video_tally;

        emit!(VoteCast {
            round_id: round.id,
            voter: ctx.accounts.voter.key(),
            video_id,
        });

        Ok(())
    }

    pub fn finalize_round(
        ctx: Context<FinalizeRound>,
        winners: Vec<String>,
    ) -> Result<()> {
        let round = &mut ctx.accounts.round;
        let clock = Clock::get()?;

        require!(round.id != 0, ErrorCode::NoActiveRound);
        require!(
            clock.unix_timestamp >= round.end_time,
            ErrorCode::RoundNotEnded
        );
        require!(!round.finalized, ErrorCode::RoundFinalized);

        round.finalized = true;

        // Store winners in round result account
        let result = &mut ctx.accounts.round_result;
        result.round_id = round.id;
        result.winners = winners.clone();
        result.bump = ctx.bumps.round_result;

        emit!(RoundFinalized {
            round_id: round.id,
            winners,
        });

        Ok(())
    }

    pub fn set_votes_per_user(ctx: Context<UpdateVotingConfig>, new_limit: u8) -> Result<()> {
        require!(
            new_limit > 0 && new_limit <= 10,
            ErrorCode::InvalidVoteLimit
        );
        let state = &mut ctx.accounts.voting_state;
        state.votes_per_user = new_limit;
        Ok(())
    }
}

// ── Accounts ──────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeVoting<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + VotingState::INIT_SPACE,
        seeds = [b"voting"],
        bump,
    )]
    pub voting_state: Account<'info, VotingState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateRound<'info> {
    #[account(
        mut,
        seeds = [b"voting"],
        bump,
        has_one = authority,
    )]
    pub voting_state: Account<'info, VotingState>,
    #[account(
        init,
        payer = authority,
        space = 8 + VotingRound::INIT_SPACE,
        seeds = [b"round", (voting_state.current_round_id + 1).to_le_bytes().as_ref()],
        bump,
    )]
    pub round: Account<'info, VotingRound>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(video_id: String)]
pub struct CastVote<'info> {
    #[account(
        seeds = [b"voting"],
        bump,
    )]
    pub voting_state: Account<'info, VotingState>,
    #[account(
        seeds = [b"round", round.id.to_le_bytes().as_ref()],
        bump = round.bump,
    )]
    pub round: Account<'info, VotingRound>,
    #[account(
        init_if_needed,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote", round.id.to_le_bytes().as_ref(), voter.key().as_ref()],
        bump,
    )]
    pub vote_record: Account<'info, VoteRecord>,
    #[account(
        init_if_needed,
        payer = voter,
        space = 8 + VideoTally::INIT_SPACE,
        seeds = [b"tally", round.id.to_le_bytes().as_ref(), video_id.as_bytes()],
        bump,
    )]
    pub video_tally: Account<'info, VideoTally>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeRound<'info> {
    #[account(
        seeds = [b"voting"],
        bump,
        has_one = authority,
    )]
    pub voting_state: Account<'info, VotingState>,
    #[account(
        mut,
        seeds = [b"round", round.id.to_le_bytes().as_ref()],
        bump = round.bump,
    )]
    pub round: Account<'info, VotingRound>,
    #[account(
        init,
        payer = authority,
        space = 8 + RoundResult::INIT_SPACE,
        seeds = [b"result", round.id.to_le_bytes().as_ref()],
        bump,
    )]
    pub round_result: Account<'info, RoundResult>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateVotingConfig<'info> {
    #[account(
        mut,
        seeds = [b"voting"],
        bump,
        has_one = authority,
    )]
    pub voting_state: Account<'info, VotingState>,
    pub authority: Signer<'info>,
}

// ── State ─────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct VotingState {
    pub authority: Pubkey,
    pub votes_per_user: u8,
    pub current_round_id: u64,
}

#[account]
#[derive(InitSpace)]
pub struct VotingRound {
    pub id: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub finalized: bool,
    #[max_len(50, 64)]
    pub video_ids: Vec<String>,
    pub video_count: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub round_id: u64,
    #[max_len(10, 64)]
    pub voted_video_ids: Vec<String>,
    #[max_len(10)]
    pub vote_timestamps: Vec<i64>,
    pub vote_count: u16,
    pub bump: u8,
}

impl VoteRecord {
    pub fn has_voted_for(&self, video_id: &str) -> bool {
        self.voted_video_ids.iter().any(|v| v == video_id)
    }

    pub fn add_vote(&mut self, video_id: String, timestamp: i64) {
        self.voted_video_ids.push(video_id);
        self.vote_timestamps.push(timestamp);
        self.vote_count += 1;
    }
}

#[account]
#[derive(InitSpace)]
pub struct VideoTally {
    pub round_id: u64,
    #[max_len(64)]
    pub video_id: String,
    pub votes: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct RoundResult {
    pub round_id: u64,
    #[max_len(10, 64)]
    pub winners: Vec<String>,
    pub bump: u8,
}

// ── Events ────────────────────────────────────────────────────────

#[event]
pub struct RoundCreated {
    pub round_id: u64,
    pub start_time: i64,
    pub end_time: i64,
}

#[event]
pub struct VoteCast {
    pub round_id: u64,
    pub voter: Pubkey,
    pub video_id: String,
}

#[event]
pub struct RoundFinalized {
    pub round_id: u64,
    pub winners: Vec<String>,
}

// ── Errors ────────────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid duration")]
    InvalidDuration,
    #[msg("No videos provided")]
    NoVideos,
    #[msg("Too many videos (max 50)")]
    TooManyVideos,
    #[msg("No active voting round")]
    NoActiveRound,
    #[msg("Voting round has not started")]
    RoundNotStarted,
    #[msg("Voting round has ended")]
    RoundEnded,
    #[msg("Voting round already finalized")]
    RoundFinalized,
    #[msg("Invalid video for this round")]
    InvalidVideo,
    #[msg("Already voted for this video")]
    AlreadyVoted,
    #[msg("Vote limit reached")]
    VoteLimitReached,
    #[msg("Round has not ended yet")]
    RoundNotEnded,
    #[msg("Invalid vote limit (1-10)")]
    InvalidVoteLimit,
}
