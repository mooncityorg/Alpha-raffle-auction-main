import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export interface GlobalPool {
    superAdmin: PublicKey,
}

export interface RafflePool {
    creator: PublicKey,
    nftMint: PublicKey,
    tokenMintFirst: PublicKey,
    tokenMintSecond: PublicKey,
    count: anchor.BN,
    winnerCount: anchor.BN,
    noRepeat: anchor.BN,
    maxEntrants: anchor.BN,
    endTimestamp: anchor.BN,
    ticketPriceFirst: anchor.BN,
    ticketPriceSecond: anchor.BN,
    ticketPriceSol: anchor.BN,
    withdrawed: anchor.BN,
    claimedWinner: anchor.BN[],
    winnerIndexes: anchor.BN[],
    winners: PublicKey[],
    entrants: PublicKey[],
}

export interface OpenAuction {
    tokenMint: PublicKey;
    owner: PublicKey,
    mint: PublicKey,
    tokenAmount: anchor.BN,

    startTime: anchor.BN,
    endTime: anchor.BN,
    cancelled: Boolean,

    title: String,

    bidderCap: anchor.BN,
    bidders: PublicKey[],
    bids: anchor.BN[],
    bidToken: anchor.BN[],

    highestBidder: PublicKey,
    highestBid: anchor.BN,
    highestToken: anchor.BN,

    bidFloor: anchor.BN,
    tokenFloor: anchor.BN,
    minBidIncrement: anchor.BN,
    minBidTokenIncrement: anchor.BN,

    bump: anchor.BN,
}

export interface SealedAuction {
    firstPrice: Boolean,

    owner: PublicKey,
    mint: PublicKey,
    tokenAmount: anchor.BN,

    startTime: anchor.BN,
    endTime: anchor.BN,
    revealPeriod: anchor.BN,
    cancelled: Boolean,

    title: String,

    bidderCap: anchor.BN,
    bidders: PublicKey[],
    sealedBids: Uint8Array[],

    fakeBids: anchor.BN[],

    highestBidder: PublicKey,
    highestBid: anchor.BN,
    secondHighestBid: anchor.BN,

    bidFloor: anchor.BN,
    winningBidWithdrawn: Boolean,

    bump: anchor.BN
}