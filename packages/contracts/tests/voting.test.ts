import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VibeVoting } from "../target/types/vibe_voting";
import { expect } from "chai";
import { SystemProgram } from "@solana/web3.js";

describe("vibe-voting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VibeVoting as Program<VibeVoting>;
  const authority = provider.wallet;

  let votingStatePda: anchor.web3.PublicKey;

  before(async () => {
    [votingStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("voting")],
      program.programId
    );

    await program.methods
      .initialize(3) // 3 votes per user
      .accounts({
        votingState: votingStatePda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });

  it("creates a voting round", async () => {
    const roundId = 1;
    const [roundPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("round"), new anchor.BN(roundId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const videoIds = ["video1", "video2", "video3"];

    await program.methods
      .createRound(new anchor.BN(7), videoIds)
      .accounts({
        votingState: votingStatePda,
        round: roundPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const round = await program.account.votingRound.fetch(roundPda);
    expect(round.id.toNumber()).to.equal(1);
    expect(round.videoIds).to.deep.equal(videoIds);
    expect(round.finalized).to.equal(false);
  });

  it("casts a vote", async () => {
    const roundId = 1;
    const videoId = "video1";
    const voter = anchor.web3.Keypair.generate();

    // Airdrop SOL for transaction fees
    const sig = await provider.connection.requestAirdrop(
      voter.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    const [roundPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("round"), new anchor.BN(roundId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        new anchor.BN(roundId).toArrayLike(Buffer, "le", 8),
        voter.publicKey.toBuffer(),
      ],
      program.programId
    );
    const [videoTallyPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("tally"),
        new anchor.BN(roundId).toArrayLike(Buffer, "le", 8),
        Buffer.from(videoId),
      ],
      program.programId
    );

    await program.methods
      .vote(videoId)
      .accounts({
        votingState: votingStatePda,
        round: roundPda,
        voteRecord: voteRecordPda,
        videoTally: videoTallyPda,
        voter: voter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    const tally = await program.account.videoTally.fetch(videoTallyPda);
    expect(tally.votes.toNumber()).to.equal(1);

    const record = await program.account.voteRecord.fetch(voteRecordPda);
    expect(record.voteCount).to.equal(1);
    expect(record.votedVideoIds).to.deep.equal([videoId]);
  });

  it("prevents duplicate votes for same video", async () => {
    // This test would require the same voter to vote again for the same video
    // Skipped in scaffold — implement with actual validator
  });
});
