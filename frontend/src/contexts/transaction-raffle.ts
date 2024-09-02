import { programs } from "@metaplex/js";
import * as anchor from '@project-serum/anchor';
import { web3 } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
    AccountInfo,
    PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction,
} from '@solana/web3.js';
import { successAlert } from "../components/toastGroup";
import { ADMIN_LIST, DECIMALS, NKL_TOKEN_MINT, GLOBAL_AUTHORITY_SEED, PROGRAM_ID_RAFFLE, RAFFLE_SIZE } from "../config";
import { IDL } from "./raffle";
import { RafflePool } from "./type";
import { getAssociatedTokenAccount, getATokenAccountsNeedCreate, getDecimals } from "./utils";

export const solConnection = new web3.Connection(web3.clusterApiUrl("mainnet-beta"));

export const getNftMetaData = async (nftMintPk: PublicKey) => {
    let { metadata: { Metadata } } = programs;
    let metadataAccount = await Metadata.getPDA(nftMintPk);
    const metadata = await Metadata.load(solConnection, metadataAccount);
    return metadata.data.data.uri;
}

export const initProject = async (
    wallet: WalletContextState
) => {
    if (!wallet.publicKey) return;
    let cloneWindow: any = window;

    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_RAFFLE, provider);
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    const tx = await program.rpc.initialize(
        bump, {
        accounts: {
            admin: wallet.publicKey,
            globalAuthority,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "finalized");

    await new Promise((resolve, reject) => {
        solConnection.onAccountChange(globalAuthority, (data: AccountInfo<Buffer> | null) => {
            if (!data) reject();
            resolve(true);
        });
    });

    successAlert("Success. txHash=" + tx);
    return false;
}

export const createRaffle = async (
    wallet: WalletContextState,
    nft_mint: PublicKey,
    winnerCount: number,
    firstToken: PublicKey,
    secondToken: PublicKey,
    ticketPriceFirst: number,
    ticketPriceSecond: number,
    ticketPriceSol: number,
    endTimestamp: number,
    max: number,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {

    if (!wallet.publicKey) return;
    startLoading();
    let cloneWindow: any = window;
    const userAddress = wallet.publicKey;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_RAFFLE, provider);

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    try {

        let ownerNftAccount = await getAssociatedTokenAccount(userAddress, nft_mint);

        let ix0 = await getATokenAccountsNeedCreate(
            solConnection,
            userAddress,
            globalAuthority,
            [nft_mint]
        );

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
                break;
            }
        }
        if (raffle === undefined) return;
        let ix = SystemProgram.createAccountWithSeed({
            fromPubkey: userAddress,
            basePubkey: userAddress,
            seed: nft_mint.toBase58().slice(0, i),
            newAccountPubkey: raffle,
            lamports: await solConnection.getMinimumBalanceForRentExemption(RAFFLE_SIZE),
            space: RAFFLE_SIZE,
            programId: program.programId,
        });

        let tx = new Transaction();
        tx.add(ix)
        if (ix0.instructions.length !== 0) tx.add(ix0.instructions[0]);
        if (ix1.instructions.length !== 0) tx.add(ix1.instructions[0]);
        console.log(endTimestamp)
        tx.add(program.instruction.createRaffle(
            bump,
            new anchor.BN(winnerCount),
            new anchor.BN(ticketPriceFirst * FIRST_DECIMALS),
            new anchor.BN(ticketPriceSecond * SECOND_DECIMALS),
            new anchor.BN(ticketPriceSol * DECIMALS),
            new anchor.BN(endTimestamp),
            new anchor.BN(max),
            {
                accounts: {
                    admin: wallet.publicKey,
                    globalAuthority,
                    raffle,
                    ownerTempNftAccount: ownerNftAccount,
                    destNftTokenAccount: ix0.destinationAccounts[0],
                    firstTokenAddress: firstToken,
                    secondTokenAddress: secondToken,
                    nftMintAddress: nft_mint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
                instructions: [],
                signers: [],
            }
        ))
        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        closeLoading();
        successAlert("You succeeded in creating a Raffle!");
        updatePage();
    } catch (error) {
        console.log(error)
        closeLoading();
    }
}

export const adminValidate = (
    wallet: WalletContextState
) => {
    let res = false;
    for (let item of ADMIN_LIST) {
        if (wallet.publicKey?.toBase58() === item.address) {
            res = res || true;
        }
    }
    return res;
}

export const buyTicket = async (
    wallet: WalletContextState,
    raffleKey: PublicKey,
    amount: number,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (!wallet.publicKey) return;
    startLoading();
    let cloneWindow: any = window;
    const userAddress = wallet.publicKey;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_RAFFLE, provider);
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    try {
        let raffleState = await getRaffleStateByAddress(raffleKey);
        if (raffleState === null) return;

        let firstToken = raffleState.tokenMintFirst;
        let secondToken = raffleState.tokenMintSecond;

        const creator = raffleState.creator;

        let userFirstTokenAccount = await getAssociatedTokenAccount(userAddress, firstToken);
        let userSecondTokenAccount = await getAssociatedTokenAccount(userAddress, secondToken);
        let creatorFirstTokenAccount = await getAssociatedTokenAccount(creator, firstToken);
        let creatorSecondTokenAccount = await getAssociatedTokenAccount(creator, secondToken);
        let tx = new Transaction();
        tx.add(program.instruction.buyTickets(
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
            }
        ))
        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        closeLoading();
        successAlert(`You have purchased ${amount} tickets.`);
        updatePage();
    } catch (error) {
        closeLoading();
        console.log(error)
    }

}

export const getRaffleState = async (nft_mint: PublicKey): Promise<RafflePool | null> => {

    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_RAFFLE, provider);
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

export const getRaffleStateByAddress = async (raffleAddress: PublicKey): Promise<RafflePool | null> => {
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_RAFFLE, provider);
    try {
        let rentalState = await program.account.rafflePool.fetch(raffleAddress);
        return rentalState as RafflePool;
    } catch {
        return null;
    }
}

export const revealWinner = async (
    wallet: WalletContextState,
    raffleKey: PublicKey,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return;
    startLoading();

    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions());
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_RAFFLE, provider);
    const userAddress = wallet.publicKey;
    console.log(raffleKey.toBase58(), "===> raffle key")
    try {
        let tx = new Transaction();
        tx.add(program.instruction.revealWinner(
            {
                accounts: {
                    buyer: userAddress,
                    raffle: raffleKey,
                },
                instructions: [],
                signers: [],
            }
        ))
        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        closeLoading();
        successAlert("Successful!")
        updatePage();
        console.log("txHash =", tx);
    } catch (error) {
        console.log(error)
        closeLoading();
    }
}

export const claimReward = async (
    wallet: WalletContextState,
    raffleKey: PublicKey,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return
    startLoading();
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions());
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_RAFFLE, provider);
    const userAddress = wallet.publicKey;
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    try {
        let raffleState = await getRaffleStateByAddress(raffleKey);
        if (raffleState === null) return;
        const srcNftTokenAccount = await getAssociatedTokenAccount(globalAuthority, raffleState.nftMint);

        let ix0 = await getATokenAccountsNeedCreate(
            solConnection,
            userAddress,
            userAddress,
            [raffleState.nftMint]
        );

        let tx = new Transaction();
        if (ix0.instructions.length !== 0) tx.add(ix0.instructions[0])
        if (ix0.instructions.length === 0) {
            tx.add(program.instruction.claimReward(
                bump,
                {
                    accounts: {
                        claimer: userAddress,
                        globalAuthority,
                        raffle: raffleKey,
                        claimerNftTokenAccount: ix0.destinationAccounts[0],
                        srcNftTokenAccount,
                        nftMintAddress: raffleState.nftMint,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    },
                    instructions: [],
                    signers: [],
                }
            ))
        } else {
            tx.add(program.instruction.claimReward(
                bump,
                {
                    accounts: {
                        claimer: userAddress,
                        globalAuthority,
                        raffle: raffleKey,
                        claimerNftTokenAccount: ix0.destinationAccounts[0],
                        srcNftTokenAccount,
                        nftMintAddress: raffleState.nftMint,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    },
                    instructions: [],
                    signers: [],
                }
            ))
        }
        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        closeLoading();
        successAlert("Successful claim!");
        updatePage();
    } catch (error) {
        closeLoading();
        console.log(error)
    }
}

export const withdrawNft = async (
    wallet: WalletContextState,
    raffleKey: PublicKey,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return;
    startLoading();
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions());
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_RAFFLE, provider);
    const userAddress = wallet.publicKey;

    try {

        const [globalAuthority, bump] = await PublicKey.findProgramAddress(
            [Buffer.from(GLOBAL_AUTHORITY_SEED)],
            program.programId
        );
        let raffleState = await getRaffleStateByAddress(raffleKey);
        if (raffleState === null) return;
        const srcNftTokenAccount = await getAssociatedTokenAccount(globalAuthority, raffleState.nftMint);

        let ix0 = await getATokenAccountsNeedCreate(
            solConnection,
            userAddress,
            userAddress,
            [raffleState.nftMint]
        );
        let tx = new Transaction();
        if (ix0.instructions.length !== 0) tx.add(ix0.instructions[0]);
        if (ix0.instructions.length === 0) {
            tx.add(program.instruction.withdrawNft(
                bump,
                {
                    accounts: {
                        claimer: userAddress,
                        globalAuthority,
                        raffle: raffleKey,
                        claimerNftTokenAccount: ix0.destinationAccounts[0],
                        srcNftTokenAccount,
                        nftMintAddress: raffleState.nftMint,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    },
                    signers: [],
                }
            ))
        } else {
            tx.add(program.instruction.withdrawNft(
                bump,
                {
                    accounts: {
                        claimer: userAddress,
                        globalAuthority,
                        raffle: raffleKey,
                        claimerNftTokenAccount: ix0.destinationAccounts[0],
                        srcNftTokenAccount,
                        nftMintAddress: raffleState.nftMint,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    },
                    instructions: [
                        ...ix0.instructions
                    ],
                    signers: [],
                }
            ))
        }

        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        closeLoading();
        successAlert("Successful withdraw");
        updatePage();
    } catch (error) {
        closeLoading()
        console.log(error)
    }

}

export const getRaffleGlobalState = async () => {
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_RAFFLE, provider);
    let poolAccounts = await solConnection.getParsedProgramAccounts(
        program.programId,
        {
            filters: [
                {
                    dataSize: RAFFLE_SIZE
                }
            ]
        }
    );
    if (poolAccounts.length !== 0) {
        let tempData = [];
        for (let i = 0; i < poolAccounts.length; i++) {
            const data = await getRaffleStateByAddress(poolAccounts[i].pubkey)
            tempData.push(
                {
                    ...data,
                    raffleKey: poolAccounts[i].pubkey
                }
            )
        }
        return tempData;
    } else {
        return null;
    }
}

export const getRaffleDataByMintAddress = async (mintAddress: PublicKey) => {
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_RAFFLE, provider);
    let poolAccounts = await solConnection.getParsedProgramAccounts(
        program.programId,
        {
            filters: [
                {
                    dataSize: RAFFLE_SIZE
                }
            ]
        }
    );
    let res;
    if (poolAccounts.length !== 0) {
        for (let i = 0; i < poolAccounts.length; i++) {
            const data = await getRaffleStateByAddress(poolAccounts[i].pubkey)
            if (data?.nftMint.toBase58() === mintAddress.toBase58()) {
                res = data
            }
        }
        return res;
    } else {
        return null;
    }
}

export const getStateByKey = async (
    raffleKey: PublicKey
): Promise<RafflePool | null> => {
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_RAFFLE, provider);
    try {
        let rentalState = await program.account.rafflePool.fetch(raffleKey);
        return rentalState as RafflePool;
    } catch {
        return null;
    }
}

export const getRaffleKey = async (
    nft_mint: PublicKey
): Promise<PublicKey | null> => {
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_RAFFLE, provider);
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
            if (state === null) break;
            if (state.endTimestamp.toNumber() > max) {
                maxId = i;
            }
        }
        let raffleKey = poolAccounts[maxId].pubkey;
        return raffleKey;
    } else {
        return null;
    }
}
