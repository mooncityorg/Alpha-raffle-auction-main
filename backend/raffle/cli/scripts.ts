import { Program, web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import {
    Keypair,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    ParsedAccountData,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID, AccountLayout, MintLayout, ASSOCIATED_TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";

import fs from 'fs';
import { GlobalPool, RafflePool } from './types';
import { publicKey } from '@project-serum/anchor/dist/cjs/utils';
import { Raffle } from '../target/types/raffle';

const GLOBAL_AUTHORITY_SEED = "global-authority";
const VAULT_AUTHORITY_SEED = "vault-authority";

const PROGRAM_ID = "3RGdPiDD6sJq925NSnaZJ8sakDc7aGSr1MWbb6DBBAR3";
const NKL_TOKEN_MINT = new PublicKey("DUM5J59yrYGukU52i1hC6YGZQ8Bfg7ppVpsYwJDF41f6");
const RAFFLE_SIZE = 32240;
const DECIMALS = 1000000000;

anchor.setProvider(anchor.Provider.local(web3.clusterApiUrl('devnet')));
const solConnection = anchor.getProvider().connection;
const payer = anchor.getProvider().wallet;
console.log(payer.publicKey.toBase58());

const idl = JSON.parse(
    fs.readFileSync(__dirname + "/raffle.json", "utf8")
);

let program: Program = null;

// Address of the deployed program.
const programId = new anchor.web3.PublicKey(PROGRAM_ID);

// Generate the program client from IDL.
program = new anchor.Program(idl, programId);
console.log('ProgramId: ', program.programId.toBase58());

const main = async () => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    console.log('GlobalAuthority: ', globalAuthority.toBase58());

    // const [vault, vaultBump] = await PublicKey.findProgramAddress(
    //     [Buffer.from(VAULT_AUTHORITY_SEED)],
    //     program.programId
    // );
    // console.log('Vault:', vault.toBase58());

    // let raffleState = await getRaffleState(new PublicKey("GF4XmpVKCf9aozU5igmr9sKNzDBkjvmiWujx8uC7Bnp4"));
    // console.log(raffleState);


    // let userFirstTokenAccount = await getAssociatedTokenAccount(payer.publicKey, new PublicKey('11111111111111111111111111111111'));
    // console.log("User Account: ", userFirstTokenAccount.toBase58());
    await initProject();
    // await createRaffle(payer.publicKey, new PublicKey("GF4XmpVKCf9aozU5igmr9sKNzDBkjvmiWujx8uC7Bnp4"), new PublicKey("AsACVnuMa5jpmfp3BjArmb2qWg5A6HBkuXePwT37RrLY"), new PublicKey("8EoML7gaBJsgJtepm25wq3GuUCqLYHBoqd3HP1JxtyBx"), 1, 1, 0, 1651041998, 100);
    // await buyTicket(payer.publicKey, new PublicKey("GF4XmpVKCf9aozU5igmr9sKNzDBkjvmiWujx8uC7Bnp4"), 10);
    // await revealWinner(payer.publicKey, new PublicKey("GF4XmpVKCf9aozU5igmr9sKNzDBkjvmiWujx8uC7Bnp4"));
    // await claimReward(payer.publicKey, new PublicKey("GF4XmpVKCf9aozU5igmr9sKNzDBkjvmiWujx8uC7Bnp4"));
    // await withdrawNft(payer.publicKey, new PublicKey("GF4XmpVKCf9aozU5igmr9sKNzDBkjvmiWujx8uC7Bnp4"));

    // const key = await getRaffleKey(new PublicKey("56mo5cpfwTE8Cry52PXWLK6VKPsPmwTt4fj8e2FBZVVZ"));
    // console.log(key);
    // const pool = await getRaffleState(new PublicKey("56mo5cpfwTE8Cry52PXWLK6VKPsPmwTt4fj8e2FBZVVZ"));
    // console.log(pool);
    // 11111111111111111111111111111111
}

/**
 * @dev Initialize the project - exactly the init account
 * @returns Init accounts for this project
 */
export const initProject = async () => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    const tx = await program.rpc.initialize(
        bump, {
        accounts: {
            admin: payer.publicKey,
            globalAuthority,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
    return true;
}

export const createRaffle = async (
    userAddress: PublicKey,
    nft_mint: PublicKey,
    firstToken: PublicKey,
    secondToken: PublicKey,
    ticketPriceFirst: number,
    ticketPriceSecond: number,
    ticketPriceSol: number,
    endTimestamp: number,
    max: number
) => {

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    let ownerNftAccount = await getAssociatedTokenAccount(userAddress, nft_mint);

    let ix0 = await getATokenAccountsNeedCreate(
        solConnection,
        userAddress,
        globalAuthority,
        [nft_mint]
    );
    console.log("Dest NFT Account = ", ix0.destinationAccounts[0].toBase58());


    let ix1 = await getATokenAccountsNeedCreate(
        solConnection,
        userAddress,
        userAddress,
        [NKL_TOKEN_MINT]
    );

    let FIRST_DECIMALS = 0,
        SECOND_DECIMALS = 0;

    if (ticketPriceFirst > 0) {
        FIRST_DECIMALS = await getDecimals(userAddress, firstToken);
    }

    if (ticketPriceSecond > 0) {
        SECOND_DECIMALS = await getDecimals(userAddress, secondToken);
    }

    let raffle;
    let i;

    for (i = 10; i > 0; i--) {
        raffle = await PublicKey.createWithSeed(
            userAddress,
            nft_mint.toBase58().slice(0, i),
            program.programId,
        );
        let state = await getStateByKey(raffle);
        if (state === null) {
            console.log(i);
            break;
        }
    }
    console.log(i);
    let ix = SystemProgram.createAccountWithSeed({
        fromPubkey: userAddress,
        basePubkey: userAddress,
        seed: nft_mint.toBase58().slice(0, i),
        newAccountPubkey: raffle,
        lamports: await solConnection.getMinimumBalanceForRentExemption(RAFFLE_SIZE),
        space: RAFFLE_SIZE,
        programId: program.programId,
    });

    const tx = await program.rpc.createRaffle(
        bump,
        new anchor.BN(ticketPriceFirst * FIRST_DECIMALS),
        new anchor.BN(ticketPriceSecond * SECOND_DECIMALS),
        new anchor.BN(ticketPriceSol * DECIMALS),
        new anchor.BN(endTimestamp),
        new anchor.BN(max),
        {
            accounts: {
                admin: payer.publicKey,
                globalAuthority,
                raffle,
                ownerTempNftAccount: ownerNftAccount,
                destNftTokenAccount: ix0.destinationAccounts[0],
                firstTokenAddress: firstToken,
                secondTokenAddress: secondToken,
                nftMintAddress: nft_mint,
                tokenProgram: TOKEN_PROGRAM_ID,
            },
            instructions: [
                ix,
                ...ix0.instructions,
                ...ix1.instructions
            ],
            signers: [],
        });


    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);

}

export const buyTicket = async (
    userAddress: PublicKey,
    nft_mint: PublicKey,
    amount: number
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    const raffleKey = await getRaffleKey(nft_mint);
    console.log(raffleKey)
    let raffleState = await getRaffleState(nft_mint);
    console.log(raffleState);
    let firstToken = raffleState.tokenMintFirst;
    let secondToken = raffleState.tokenMintSecond;

    const creator = raffleState.creator;

    let userFirstTokenAccount = await getAssociatedTokenAccount(userAddress, firstToken);
    let userSecondTokenAccount = await getAssociatedTokenAccount(userAddress, secondToken);
    let creatorFirstTokenAccount = await getAssociatedTokenAccount(creator, firstToken);
    let creatorSecondTokenAccount = await getAssociatedTokenAccount(creator, secondToken);

    const tx = await program.rpc.buyTickets(
        bump,
        new anchor.BN(amount),
        {
            accounts: {
                buyer: userAddress,
                raffle: raffleKey,
                globalAuthority,
                creator,
                creatorFirstTokenAccount,
                creatorSecondTokenAccount,
                userFirstTokenAccount,
                userSecondTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            },
            instructions: [],
            signers: [],
        });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);

}

export const revealWinner = async (
    userAddress: PublicKey,
    nft_mint: PublicKey,
) => {
    const raffleKey = await getRaffleKey(nft_mint);
    const tx = await program.rpc.revealWinner(
        {
            accounts: {
                buyer: userAddress,
                raffle: raffleKey,
            },
            instructions: [],
            signers: [],
        });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const claimReward = async (
    userAddress: PublicKey,
    nft_mint: PublicKey,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    const raffleKey = await getRaffleKey(nft_mint);
    const srcNftTokenAccount = await getAssociatedTokenAccount(globalAuthority, nft_mint);

    let ix0 = await getATokenAccountsNeedCreate(
        solConnection,
        userAddress,
        userAddress,
        [nft_mint]
    );
    console.log(ix0.instructions);

    let tx;
    if (ix0.instructions.length === 0) {
        console.log("yse")
        tx = await program.rpc.claimReward(
            bump,
            {
                accounts: {
                    claimer: userAddress,
                    globalAuthority,
                    raffle: raffleKey,
                    claimerNftTokenAccount: ix0.destinationAccounts[0],
                    srcNftTokenAccount,
                    nftMintAddress: nft_mint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
                instructions: [],
                signers: [],
            });
    } else {
        tx = await program.rpc.claimReward(
            bump,
            {
                accounts: {
                    claimer: userAddress,
                    globalAuthority,
                    raffle: raffleKey,
                    claimerNftTokenAccount: ix0.destinationAccounts[0],
                    srcNftTokenAccount,
                    nftMintAddress: nft_mint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
                instructions: [
                    ...ix0.instructions
                ],
                signers: [],
            });
    }
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);

}

export const withdrawNft = async (
    userAddress: PublicKey,
    nft_mint: PublicKey,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    const raffleKey = await getRaffleKey(nft_mint);
    const srcNftTokenAccount = await getAssociatedTokenAccount(globalAuthority, nft_mint);

    let raffleState = await getRaffleState(nft_mint);
    console.log(raffleState.endTimestamp.toNumber());

    let ix0 = await getATokenAccountsNeedCreate(
        solConnection,
        userAddress,
        userAddress,
        [nft_mint]
    );
    let tx;
    if (ix0.instructions.length === 0) {
        tx = await program.rpc.withdrawNft(
            bump,
            {
                accounts: {
                    claimer: userAddress,
                    globalAuthority,
                    raffle: raffleKey,
                    claimerNftTokenAccount: ix0.destinationAccounts[0],
                    srcNftTokenAccount,
                    nftMintAddress: nft_mint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
                signers: [],
            });
    } else {
        tx = await program.rpc.withdrawNft(
            bump,
            {
                accounts: {
                    claimer: userAddress,
                    globalAuthority,
                    raffle: raffleKey,
                    claimerNftTokenAccount: ix0.destinationAccounts[0],
                    srcNftTokenAccount,
                    nftMintAddress: nft_mint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
                instructions: [
                    ...ix0.instructions
                ],
                signers: [],
            });
    }

    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);

}

export const getRaffleKey = async (
    nft_mint: PublicKey
): Promise<PublicKey | null> => {
    let poolAccounts = await solConnection.getParsedProgramAccounts(
        program.programId,
        {
            filters: [
                {
                    dataSize: RAFFLE_SIZE
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
        let len = poolAccounts.length;
        console.log(len);
        let max = 0;
        let maxId = 0;
        for (let i = 0; i < len; i++) {
            let state = await getStateByKey(poolAccounts[i].pubkey);
            if (state.endTimestamp.toNumber() > max) {
                max = state.endTimestamp.toNumber();
                maxId = i;
            }
        }
        let raffleKey = poolAccounts[maxId].pubkey;
        return raffleKey;
    } else {
        return null;
    }
}
export const getDecimals = async (owner: PublicKey, tokenMint: PublicKey): Promise<number | null> => {
    try {
        let ownerTokenAccount = await getAssociatedTokenAccount(owner, tokenMint);
        const tokenAccount = await solConnection.getParsedAccountInfo(ownerTokenAccount);
        let decimal = (tokenAccount.value?.data as ParsedAccountData).parsed.info.tokenAmount.decimals;
        let DECIMALS = Math.pow(10, decimal);
        return DECIMALS;
    } catch {
        return null;
    }
}

export const getRaffleState = async (
    nft_mint: PublicKey
): Promise<RafflePool | null> => {

    let poolAccounts = await solConnection.getParsedProgramAccounts(
        program.programId,
        {
            filters: [
                {
                    dataSize: RAFFLE_SIZE
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
        console.log(poolAccounts[0].pubkey.toBase58());
        let rentalKey = poolAccounts[0].pubkey;

        try {
            let rentalState = await program.account.rafflePool.fetch(rentalKey);
            return rentalState as RafflePool;
        } catch {
            return null;
        }
    } else {
        return null;
    }
}

export const getStateByKey = async (
    raffleKey: PublicKey
): Promise<RafflePool | null> => {
    try {
        let rentalState = await program.account.rafflePool.fetch(raffleKey);
        return rentalState as RafflePool;
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