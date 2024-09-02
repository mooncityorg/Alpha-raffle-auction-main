import { Program, web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import {
    Keypair,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID, AccountLayout, MintLayout, ASSOCIATED_TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";

import fs from 'fs';
import { OpenAuction, SealedAuction } from './types';
import { publicKey } from '@project-serum/anchor/dist/cjs/utils';
import { keccak_256 } from 'js-sha3';
import * as assert from "assert";

const PROGRAM_ID = "5c3akfL4G1wwMcKGBZFekiq6kyJ8Q8mppjEmh54M3QMY";
const NKL_TOKEN_MINT = new PublicKey("DUM5J59yrYGukU52i1hC6YGZQ8Bfg7ppVpsYwJDF41f6");
const DECIMALS = 1000000000;

anchor.setProvider(anchor.Provider.local(web3.clusterApiUrl('devnet')));
const solConnection = anchor.getProvider().connection;
const payer = anchor.getProvider().wallet;
console.log("Payer:  ", payer.publicKey.toBase58());

const idl = JSON.parse(
    fs.readFileSync(__dirname + "/auctionhouse.json", "utf8")
);

let program: Program = null;

// Address of the deployed program.
const programId = new anchor.web3.PublicKey(PROGRAM_ID);

// Generate the program client from IDL.
program = new anchor.Program(idl, programId);
console.log('ProgramId: ', program.programId.toBase58());


const main = async () => {
    // let address = await getAuctionKey(new PublicKey('GF4XmpVKCf9aozU5igmr9sKNzDBkjvmiWujx8uC7Bnp4'), 5);
    //     console.log(address.toBase58());
    //     let state = await getOpenAuctionState(address);
    //     console.log(state.endTime.toNumber());
    // console.log(state.title.toString());
    await CreateOpenAuction(payer.publicKey, 
        new PublicKey('CcwNCohPuki8CppGshivP5WrZCbqWgxYF24QJocueCLX'), 
        new PublicKey('8EoML7gaBJsgJtepm25wq3GuUCqLYHBoqd3HP1JxtyBx'), 
        'My WsF Auction', 
        1, 
        20, 
        0.1, 
        1, 
        30,
        1657107850, 
        1657108000,
        1);
    // await CancelOpenAuction(payer.publicKey, address);
    // await MakeOpenBid(payer.publicKey, address, 11);
    // await ReclaimItemOpen(payer.publicKey, address);
    // console.log(state.endTime.toNumber());
}

export const CreateOpenAuction = async (
    owner: PublicKey,
    nft_mint: PublicKey,
    tokenMint: PublicKey,
    auctionTitle: String,
    floor: number,
    tokenFloor: number,
    increment: number,
    tokenIncrement: number,
    biddercap: number,
    startTime: number,
    endTime: number,
    amount: number
) => {

    const [auctionAddress, bump] = await PublicKey.findProgramAddress(
        [Buffer.from("open auction"), owner.toBytes(), Buffer.from(auctionTitle.slice(0, 32))],
        program.programId
    );

    let auctionAta = await getAssociatedTokenAccount(auctionAddress, nft_mint);
    let auctionTokenAta = await getAssociatedTokenAccount(auctionAddress, tokenMint);

    let ownerAta = await getAssociatedTokenAccount(owner, nft_mint);

    console.log(auctionAddress.toBase58());
    console.log(nft_mint.toBase58());
    console.log(tokenMint.toBase58())
    console.log(TOKEN_PROGRAM_ID.toBase58());
    console.log(ASSOCIATED_TOKEN_PROGRAM_ID.toBase58());
    console.log(SystemProgram.programId.toBase58());
    console.log(SYSVAR_RENT_PUBKEY.toBase58());

    const tx = await program.rpc.createOpenAuction(new anchor.BN(bump),
        auctionTitle,
        new anchor.BN(floor * DECIMALS),
        new anchor.BN(tokenFloor * DECIMALS),
        new anchor.BN(increment * DECIMALS),
        new anchor.BN(tokenIncrement * DECIMALS),
        new anchor.BN(startTime),
        new anchor.BN(endTime),
        new anchor.BN(biddercap),
        new anchor.BN(amount), {
        accounts: {
            auction: auctionAddress,
            auctionAta: auctionAta,
            auctionTokenAta,
            owner,
            ownerAta,
            mint: nft_mint,
            tokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rentSysvar: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);

}

export const CancelOpenAuction = async (
    owner: PublicKey,
    auctionAddress: PublicKey
) => {
    const tx = await program.rpc.cancelOpenAuction({
        accounts: {
            auction: auctionAddress,
            owner,
            systemProgram: SystemProgram.programId,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const MakeOpenBid = async (
    bidder: PublicKey,
    auctionAddress: PublicKey,
    amount: number
) => {
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, NKL_TOKEN_MINT);
    let bidderAta = await getAssociatedTokenAccount(bidder, NKL_TOKEN_MINT);

    const tx = await program.rpc.makeOpenBid(
        new anchor.BN(amount * DECIMALS), {
        accounts: {
            auction: auctionAddress,
            auctionAta: auctionAta,
            bidder,
            bidderAta,
            tokenMint: NKL_TOKEN_MINT,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rentSysvar: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const ReclaimOpenBid = async (
    bidder: PublicKey,
    auctionAddress: PublicKey,
) => {
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, NKL_TOKEN_MINT);
    let bidderAta = await getAssociatedTokenAccount(bidder, NKL_TOKEN_MINT);

    const tx = await program.rpc.reclaimOpenBid({
        accounts: {
            auction: auctionAddress,
            auctionAta: auctionAta,
            bidder,
            bidderAta,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const WithdrawItemOpen = async (
    winner: PublicKey,
    auctionAddress: PublicKey,
) => {
    let auctionState = await getOpenAuctionState(auctionAddress);
    let nft_mint = auctionState.mint;
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, nft_mint);
    let winnerAta = await getAssociatedTokenAccount(winner, nft_mint);

    const tx = await program.rpc.withdrawItemOpen({
        accounts: {
            auction: auctionAddress,
            auctionAta: auctionAta,
            highestBidder: winner,
            highestBidderAta: winnerAta,
            mint: nft_mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rentSysvar: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const WithdrawWinningBidOpen = async (
    owner: PublicKey,
    auctionAddress: PublicKey,
) => {
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, NKL_TOKEN_MINT);
    let ownerAta = await getAssociatedTokenAccount(owner, NKL_TOKEN_MINT);

    const tx = await program.rpc.withdrawWinningBidOpen({
        accounts: {
            auction: auctionAddress,
            owner,
            auctionAta,
            ownerAta,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const ReclaimItemOpen = async (
    owner: PublicKey,
    auctionAddress: PublicKey,
) => {
    let auctionState = await getOpenAuctionState(auctionAddress);
    let nft_mint = auctionState.mint;
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, nft_mint);
    let ownerAta = await getAssociatedTokenAccount(owner, nft_mint);

    console.log(owner.toBase58());
    console.log(ownerAta.toBase58());
    console.log(auctionAddress.toBase58());
    console.log(auctionAta.toBase58());


    const tx = await program.rpc.reclaimItemOpen({
        accounts: {
            auction: auctionAddress,
            auctionAta,
            owner,
            ownerAta,
            mint: nft_mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rentSysvar: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}


export const CreateSealedAuction = async (
    owner: PublicKey,
    nft_mint: PublicKey,
    auctionTitle: String,
    floor: Number,
    firstPrice: Boolean,
    biddercap: Number,
    startTime: Number,
    endTime: Number,
    revealTime: Number,
    amount: Number
) => {

    const [auctionAddress, bump] = await PublicKey.findProgramAddress(
        [Buffer.from("sealed auction"), owner.toBytes(), Buffer.from(auctionTitle.slice(0, 32))],
        program.programId
    );

    let auctionAta = await getAssociatedTokenAccount(auctionAddress, nft_mint);
    let ownerAta = await getAssociatedTokenAccount(owner, nft_mint);


    const tx = await program.rpc.createOpenAuction(new anchor.BN(bump),
        auctionTitle,
        new anchor.BN(floor),
        firstPrice,
        new anchor.BN(startTime),
        new anchor.BN(endTime),
        new anchor.BN(revealTime),
        new anchor.BN(biddercap),
        new anchor.BN(amount), {
        accounts: {
            auction: auctionAddress,
            auctionAta: auctionAta,
            owner,
            ownerAta,
            mint: nft_mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rentSysvar: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);

}

export const CancelSealedAuction = async (
    owner: PublicKey,
    auctionAddress: PublicKey
) => {

    const tx = await program.rpc.cancelSealedAuction({
        accounts: {
            auction: auctionAddress,
            owner,
            systemProgram: SystemProgram.programId,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const MakeSealedBid = async (
    bidder: PublicKey,
    auctionAddress: PublicKey,
    bid: Number,
    fakeBid: Number
) => {

    let auctionState = await getSealedAuctionState(auctionAddress);
    let length = auctionState.bidders.length;
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, NKL_TOKEN_MINT);
    let bidderAta = await getAssociatedTokenAccount(bidder, NKL_TOKEN_MINT);

    let hash = keccak_256.create();
    hash.update(bid.toString());
    hash.update(length.toString());
    let bidHash = Uint8Array.from(Buffer.from(hash.hex(), 'hex'));


    const tx = await program.rpc.makeSealedBid(
        bidHash,
        new anchor.BN(fakeBid), {
        accounts: {
            auction: auctionAddress,
            auctionAta: auctionAta,
            bidder,
            bidderAta,
            tokenMint: NKL_TOKEN_MINT,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rentSysvar: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const RevealSealedBid = async (
    bidder: PublicKey,
    auctionAddress: PublicKey,
    bid: Number
) => {
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, NKL_TOKEN_MINT);
    let bidderAta = await getAssociatedTokenAccount(bidder, NKL_TOKEN_MINT);

    let index = -1;
    let auctionState = await getSealedAuctionState(auctionAddress);
    let length = auctionState.bidders.length;
    for (let i = 0; i < length; i++) {
        if (auctionState.bidders[i].toBase58() === bidder.toBase58()) {
            index = i;
            break;
        }
    }

    const tx = await program.rpc.revealSealedBid(
        new anchor.BN(bid),
        new anchor.BN(index), {
        accounts: {
            auction: auctionAddress,
            auctionAta,
            bidder,
            bidderAta,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const ReclaimSealedBid = async (
    bidder: PublicKey,
    auctionAddress: PublicKey,
) => {
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, NKL_TOKEN_MINT);
    let bidderAta = await getAssociatedTokenAccount(bidder, NKL_TOKEN_MINT);

    const tx = await program.rpc.reclaimSealedBid({
        accounts: {
            auction: auctionAddress,
            auctionAta: auctionAta,
            bidder,
            bidderAta,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const WithdrawItemSealed = async (
    winner: PublicKey,
    auctionAddress: PublicKey,
) => {
    let auctionState = await getSealedAuctionState(auctionAddress);
    let nft_mint = auctionState.mint;
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, nft_mint);
    let auctionTokenAta = await getAssociatedTokenAccount(auctionAddress, NKL_TOKEN_MINT);
    let winnerAta = await getAssociatedTokenAccount(winner, nft_mint);
    let winnerTokenAta = await getAssociatedTokenAccount(winner, NKL_TOKEN_MINT);


    const tx = await program.rpc.withdrawItemSealed({
        accounts: {
            auction: auctionAddress,
            auctionAta,
            auctionTokenAta,
            highestBidder: winner,
            highestBidderAta: winnerAta,
            highestBidderTokenAta: winnerTokenAta,
            mint: nft_mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rentSysvar: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const WithdrawWinningBidSealed = async (
    owner: PublicKey,
    auctionAddress: PublicKey,
) => {
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, NKL_TOKEN_MINT);
    let ownerAta = await getAssociatedTokenAccount(owner, NKL_TOKEN_MINT);

    const tx = await program.rpc.withdrawWinningBidSealed({
        accounts: {
            auction: auctionAddress,
            owner,
            auctionAta,
            ownerAta,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const ReclaimItemSealed = async (
    owner: PublicKey,
    auctionAddress: PublicKey,
) => {
    let auctionState = await getSealedAuctionState(auctionAddress);
    let nft_mint = auctionState.mint;
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, nft_mint);
    let ownerAta = await getAssociatedTokenAccount(owner, nft_mint);

    const tx = await program.rpc.reclaimItemSealed({
        accounts: {
            auction: auctionAddress,
            auctionAta: auctionAta,
            owner,
            ownerAta,
            mint: nft_mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rentSysvar: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const getAuctionKey = async (
    nft_mint: PublicKey,
    bidderCap: number
): Promise<PublicKey | null> => {
    let poolAccounts = await solConnection.getParsedProgramAccounts(
        program.programId,
        {
            filters: [
                {
                    dataSize: 366 + 8 + 40 * bidderCap
                },
                {
                    memcmp: {
                        "offset": 40,
                        "bytes": nft_mint.toBase58()
                    }
                }
            ]
        }
    );

    if (poolAccounts.length !== 0) {
        let rentalKey = poolAccounts[0].pubkey;
        return rentalKey;
    } else {
        return null;
    }
}

export const getOpenAuctionState = async (
    auctionAddress: PublicKey
): Promise<OpenAuction | null> => {
    try {
        let auctionState = await program.account.openAuction.fetch(auctionAddress);
        return auctionState as OpenAuction;
    } catch {
        return null;
    }
}

export const getSealedAuctionState = async (
    auctionAddress: PublicKey
): Promise<SealedAuction | null> => {
    try {
        let auctionState = await program.account.sealedAuction.fetch(auctionAddress);
        return auctionState as SealedAuction;
    } catch {
        return null;
    }
}
const getAssociatedTokenAccount = async (ownerPubkey: PublicKey, mintPk: PublicKey): Promise<PublicKey> => {
    let associatedTokenAccountPubkey = (await PublicKey.findProgramAddress(
        [
            ownerPubkey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintPk.toBuffer(), // mint address
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];
    return associatedTokenAccountPubkey;
}

export const getATokenAccountsNeedCreate = async (
    connection: anchor.web3.Connection,
    walletAddress: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey,
    nfts: anchor.web3.PublicKey[],
) => {
    let instructions = [], destinationAccounts = [];
    for (const mint of nfts) {
        const destinationPubkey = await getAssociatedTokenAccount(owner, mint);
        let response = await connection.getAccountInfo(destinationPubkey);
        if (!response) {
            const createATAIx = createAssociatedTokenAccountInstruction(
                destinationPubkey,
                walletAddress,
                owner,
                mint,
            );
            instructions.push(createATAIx);
        }
        destinationAccounts.push(destinationPubkey);
        if (walletAddress != owner) {
            const userAccount = await getAssociatedTokenAccount(walletAddress, mint);
            response = await connection.getAccountInfo(userAccount);
            if (!response) {
                const createATAIx = createAssociatedTokenAccountInstruction(
                    userAccount,
                    walletAddress,
                    walletAddress,
                    mint,
                );
                instructions.push(createATAIx);
            }
        }
    }
    return {
        instructions,
        destinationAccounts,
    };
}

export const createAssociatedTokenAccountInstruction = (
    associatedTokenAddress: anchor.web3.PublicKey,
    payer: anchor.web3.PublicKey,
    walletAddress: anchor.web3.PublicKey,
    splTokenMintAddress: anchor.web3.PublicKey
) => {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
        { pubkey: walletAddress, isSigner: false, isWritable: false },
        { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
    ];
    return new anchor.web3.TransactionInstruction({
        keys,
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        data: Buffer.from([]),
    });
}


main()