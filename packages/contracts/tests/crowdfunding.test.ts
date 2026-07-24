import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VibeCrowdfunding } from "../target/types/vibe_crowdfunding";
import { expect } from "chai";
import { LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";

describe("vibe-crowdfunding", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VibeCrowdfunding as Program<VibeCrowdfunding>;
  const authority = provider.wallet;

  let platformStatePda: anchor.web3.PublicKey;

  before(async () => {
    [platformStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("platform")],
      program.programId
    );

    await program.methods
      .initialize(250) // 2.5% fee
      .accounts({
        platformState: platformStatePda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });

  it("creates a campaign", async () => {
    const campaignId = 1;
    const [campaignPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("campaign"), new anchor.BN(campaignId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), new anchor.BN(campaignId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .createCampaign("video123", new anchor.BN(1 * LAMPORTS_PER_SOL), new anchor.BN(30))
      .accounts({
        platformState: platformStatePda,
        campaign: campaignPda,
        campaignVault: vaultPda,
        creator: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.videoId).to.equal("video123");
    expect(campaign.goalAmount.toNumber()).to.equal(1 * LAMPORTS_PER_SOL);
    expect(campaign.raisedAmount.toNumber()).to.equal(0);
    expect(campaign.claimed).to.equal(false);
  });

  it("accepts contributions", async () => {
    const campaignId = 1;
    const contributor = anchor.web3.Keypair.generate();

    // Airdrop SOL to contributor
    const sig = await provider.connection.requestAirdrop(
      contributor.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    const [campaignPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("campaign"), new anchor.BN(campaignId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), new anchor.BN(campaignId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [contributionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("contribution"),
        new anchor.BN(campaignId).toArrayLike(Buffer, "le", 8),
        contributor.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .contribute(new anchor.BN(0.5 * LAMPORTS_PER_SOL))
      .accounts({
        campaign: campaignPda,
        campaignVault: vaultPda,
        contribution: contributionPda,
        contributor: contributor.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.raisedAmount.toNumber()).to.equal(0.5 * LAMPORTS_PER_SOL);
  });

  it("rejects zero contributions", async () => {
    const campaignId = 1;
    const [campaignPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("campaign"), new anchor.BN(campaignId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), new anchor.BN(campaignId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [contributionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("contribution"),
        new anchor.BN(campaignId).toArrayLike(Buffer, "le", 8),
        authority.publicKey.toBuffer(),
      ],
      program.programId
    );

    try {
      await program.methods
        .contribute(new anchor.BN(0))
        .accounts({
          campaign: campaignPda,
          campaignVault: vaultPda,
          contribution: contributionPda,
          contributor: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err.toString()).to.include("InvalidContribution");
    }
  });
});
