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
    noRepeat: anchor.BN,
    maxEntrants: anchor.BN,
    endTimestamp: anchor.BN,
    ticketPriceFirst: anchor.BN,
    ticketPriceSecond: anchor.BN,
    ticketPriceSol: anchor.BN,
    claimed: anchor.BN,
    winner: PublicKey,
    entrants: PublicKey[],
}