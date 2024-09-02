import * as anchor from '@project-serum/anchor';
import {
    LAMPORTS_PER_SOL,
    ParsedAccountData,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
} from '@solana/web3.js';
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";

import { filterError, getAssociatedTokenAccount, solConnection } from './utils';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { API_URL, NKL_TOKEN_MINT, GLOBAL_AUTHORITY_SEED, PROGRAM_ID_AUCTION } from '../config';
import { IDL } from './auction';
import { OpenAuction } from './type';
import { successAlert } from '../components/toastGroup';
import axios from 'axios';

export const CreateOpenAuction = async (
    wallet: WalletContextState,
    nft_mint: PublicKey,
    token_mint: PublicKey,
    auctionTitle: String,
    floor: number,
    tokenFloor: number,
    increment: number,
    tokenIncrement: number,
    biddercap: number,
    startTime: number,
    endTime: number,
    amount: number,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return;
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_AUCTION, provider);
    console.log(nft_mint.toBase58(), token_mint.toBase58(), auctionTitle, floor, tokenFloor, increment, biddercap, endTime, startTime, amount);
    startLoading();
    const owner = wallet.publicKey;
    try {
        const [auctionAddress, bump] = await PublicKey.findProgramAddress(
            [Buffer.from("open auction"), owner.toBytes(), Buffer.from(auctionTitle.slice(0, 32))],
            program.programId
        );

        let auctionAta = await getAssociatedTokenAccount(auctionAddress, nft_mint);
        let auctionTokenAta = await getAssociatedTokenAccount(auctionAddress, token_mint);
        let ownerAta = await getAssociatedTokenAccount(owner, nft_mint);
        let userTokenAccount = await getAssociatedTokenAccount(owner, nft_mint);
        if (!await isExistAccount(userTokenAccount)) {
            let accountOfNFT = await getNFTTokenAccount(nft_mint);
            if (userTokenAccount.toBase58() != accountOfNFT.toBase58()) {
                let nftOwner = await getOwnerOfNFT(nft_mint);
                if (nftOwner.toBase58() == owner.toBase58()) userTokenAccount = accountOfNFT;
                else if (nftOwner.toBase58() !== auctionAddress.toBase58()) {
                    throw 'Error: Nft is not owned by user';
                }
            }
        }
        const decimal = await getDecimals(owner, token_mint);
        if (decimal === null) return;
        let tx = new Transaction();

        console.log(auctionAddress.toBase58(), "auctionAddress");
        console.log(auctionAta.toBase58(), "auctionAta");
        console.log(auctionTokenAta.toBase58(), "auctionTokenAta");
        console.log(ownerAta.toBase58(), "ownerAta");

        tx.add(program.instruction.createOpenAuction(
            bump,
            auctionTitle,
            new anchor.BN(floor * LAMPORTS_PER_SOL),
            new anchor.BN(tokenFloor * decimal),
            new anchor.BN(increment * LAMPORTS_PER_SOL),
            new anchor.BN(tokenIncrement * decimal),
            new anchor.BN(startTime),
            new anchor.BN(endTime),
            new anchor.BN(biddercap),
            new anchor.BN(amount), {
            accounts: {
                auction: auctionAddress,
                auctionAta: auctionAta,
                auctionTokenAta: auctionTokenAta,
                owner,
                ownerAta,
                mint: nft_mint,
                tokenMint: token_mint,
                tokenProgram: TOKEN_PROGRAM_ID,
                ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rentSysvar: SYSVAR_RENT_PUBKEY,
            },
            signers: [],
        }
        ));

        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        await axios.post(`${API_URL}registerAuctionInfo`, {
            owner: wallet.publicKey?.toBase58(),
            nft_mint: nft_mint,
            token_mint: nft_mint,
            auctionTitle: auctionTitle,
            floor: floor.toString(),
            increment: increment.toString(),
            biddercap: biddercap.toString(),
            startTime: startTime,
            endTime: endTime,
            amount: 1,
            auction_id: auctionAddress,
        })
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });

        closeLoading();
        successAlert("Action created!")
        updatePage();
    } catch (error) {
        console.log(error);
        closeLoading();
        filterError(error);
    }
}

export const CancelOpenAuction = async (
    wallet: WalletContextState,
    auctionAddress: PublicKey,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return;
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_AUCTION, provider);
    startLoading();
    try {
        const owner = wallet.publicKey;
        let tx = new Transaction();
        tx.add(program.instruction.cancelOpenAuction(
            {
                accounts: {
                    auction: auctionAddress,
                    owner,
                    systemProgram: SystemProgram.programId,
                },
                signers: [],
            }
        ))
        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        closeLoading();
        successAlert("Action calceled!");
        updatePage();
    } catch (error) {
        closeLoading();
        console.log(error);
        filterError(error);
    }
}

export const MakeOpenBid = async (
    wallet: WalletContextState,
    auctionAddress: PublicKey,
    amount: number,
    tokenAmount: number,
    tokenMint: PublicKey,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return;
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_AUCTION, provider);
    const bidder = wallet.publicKey;
    try {
        startLoading();
        console.log(amount, tokenAmount)
        const [globalAuthority, bump] = await PublicKey.findProgramAddress(
            [Buffer.from("global")],
            program.programId
        );
        let auctionAta = await getAssociatedTokenAccount(auctionAddress, tokenMint);
        let bidderAta = await getAssociatedTokenAccount(bidder, tokenMint);
        const decimal = await getDecimals(bidder, tokenMint);
        if (decimal === null) return;
        let tx = new Transaction();
        tx.add(program.instruction.makeOpenBid(
            bump,
            new anchor.BN(amount * LAMPORTS_PER_SOL),
            new anchor.BN(tokenAmount * decimal), {
            accounts: {
                auction: auctionAddress,
                auctionAta: auctionAta,
                bidder,
                bidderAta,
                globalPool: globalAuthority,
                tokenMint: tokenMint,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                rentSysvar: SYSVAR_RENT_PUBKEY,
            },
            signers: [],
        }
        ))
        const txId = await wallet.sendTransaction(tx, solConnection);
        console.log(txId)
        await solConnection.confirmTransaction(txId, "finalized");
        successAlert("Made a bid!");
        closeLoading();
        updatePage();
    } catch (error) {
        console.log(error);
        filterError(error)
        closeLoading();
    }
}

export const ReclaimOpenBid = async (
    wallet: WalletContextState,
    auctionAddress: PublicKey,
    tokenMint: PublicKey,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return;
    console.log(auctionAddress.toBase58())
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_AUCTION, provider);
    const bidder = wallet.publicKey;
    try {
        startLoading();
        const [globalAuthority, bump] = await PublicKey.findProgramAddress(
            [Buffer.from("global")],
            program.programId
        );
        let auctionAta = await getAssociatedTokenAccount(auctionAddress, tokenMint);
        let bidderAta = await getAssociatedTokenAccount(bidder, tokenMint);

        let tx = new Transaction();
        tx.add(program.instruction.reclaimOpenBid(
            bump, {
            accounts: {
                auction: auctionAddress,
                auctionAta: auctionAta,
                bidder,
                bidderAta,
                globalPool: globalAuthority,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,

            },
            signers: [],
        }
        ));
        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        closeLoading();
        successAlert("NFT was reclaimed!")
        updatePage();
    } catch (error) {
        console.log(error);
        closeLoading();
        filterError(error);
    }
}

export const WithdrawItemOpen = async (
    wallet: WalletContextState,
    auctionAddress: PublicKey,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return;
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_AUCTION, provider);
    const winner = wallet.publicKey;
    try {
        startLoading();
        let auctionState = await getOpenAuctionState(auctionAddress);
        if (auctionState === null) return;
        let nft_mint = auctionState.mint;
        let auctionAta = await getAssociatedTokenAccount(auctionAddress, nft_mint);
        let winnerAta = await getAssociatedTokenAccount(winner, nft_mint);

        let tx = new Transaction();
        tx.add(program.instruction.withdrawItemOpen(
            {
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
            }
        ))
        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        closeLoading();
        updatePage();
        successAlert("NFT claimed");
    } catch (error) {
        console.log(error)
        closeLoading();
        filterError(error);
    }
}

export const WithdrawWinningBidOpen = async (
    wallet: WalletContextState,
    auctionAddress: PublicKey,
    tokenMint: PublicKey,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return;

    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_AUCTION, provider);
    const owner = wallet.publicKey;
    try {
        startLoading();
        let auctionAta = await getAssociatedTokenAccount(auctionAddress, tokenMint);
        let ownerAta = await getAssociatedTokenAccount(owner, tokenMint);
        const [globalAuthority, bump] = await PublicKey.findProgramAddress(
            [Buffer.from("global")],
            program.programId
        );
        let tx = new Transaction();
        tx.add(program.instruction.withdrawWinningBidOpen(
            bump, {
            accounts: {
                auction: auctionAddress,
                owner,
                auctionAta,
                ownerAta,
                globalPool: globalAuthority,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
            },
            signers: [],
        }
        ))
        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        closeLoading();
        updatePage();
        successAlert("NFT claimed!")
    } catch (error) {
        closeLoading();
        console.log(error);
        filterError(error);
    }
}

export const ReclaimItemOpen = async (
    wallet: WalletContextState,
    auctionAddress: PublicKey,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return;

    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_AUCTION, provider);
    const owner = wallet.publicKey;
    try {
        startLoading();
        let auctionState = await getOpenAuctionState(auctionAddress);
        if (!auctionState) return;
        let nft_mint = auctionState.mint;
        let auctionAta = await getAssociatedTokenAccount(auctionAddress, nft_mint);
        let ownerAta = await getAssociatedTokenAccount(owner, nft_mint);

        let tx = new Transaction();
        tx.add(program.instruction.reclaimItemOpen(
            {
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
            }
        ))
        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        closeLoading();
        updatePage();

    } catch (error) {
        closeLoading();
        console.log(error);
        filterError(error);
    }

}

export const getAuctionKey = async (
    nft_mint: PublicKey,
    bidderCap: number
): Promise<PublicKey | null> => {

    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_AUCTION, provider);

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


export const getOwnerOfNFT = async (nftMintPk: PublicKey): Promise<PublicKey> => {
    let tokenAccountPK = await getNFTTokenAccount(nftMintPk);
    let tokenAccountInfo = await solConnection.getAccountInfo(tokenAccountPK);

    console.log("nftMintPk=", nftMintPk.toBase58());
    console.log("tokenAccountInfo =", tokenAccountInfo);

    if (tokenAccountInfo && tokenAccountInfo.data) {
        let ownerPubkey = new PublicKey(tokenAccountInfo.data.slice(32, 64))
        console.log("ownerPubkey=", ownerPubkey.toBase58());
        return ownerPubkey;
    }
    return new PublicKey("");
}
export const getOpenAuctionState = async (
    auctionAddress: PublicKey
): Promise<OpenAuction | null> => {

    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID_AUCTION, provider);

    try {
        let auctionState = await program.account.openAuction.fetch(auctionAddress);
        return auctionState as OpenAuction;
    } catch {
        return null;
    }
}

export const getNFTTokenAccount = async (nftMintPk: PublicKey): Promise<PublicKey> => {
    let tokenAccount = await solConnection.getProgramAccounts(
        TOKEN_PROGRAM_ID,
        {
            filters: [
                {
                    dataSize: 165
                },
                {
                    memcmp: {
                        offset: 64,
                        bytes: '2'
                    }
                },
                {
                    memcmp: {
                        offset: 0,
                        bytes: nftMintPk.toBase58()
                    }
                },
            ]
        }
    );
    return tokenAccount[0].pubkey;
}

export const isExistAccount = async (address: PublicKey) => {
    try {
        const res = await solConnection.getAccountInfo(address);
        if (res && res.data) return true;
    } catch (e) {
        return false;
    }
}

export const getDecimals = async (owner: PublicKey, tokenMint: PublicKey): Promise<number | null> => {
    try {
        let ownerTokenAccount = await getAssociatedTokenAccount(owner, tokenMint);
        const tokenAccount = await solConnection.getParsedAccountInfo(ownerTokenAccount);
        let decimal = (tokenAccount.value?.data as ParsedAccountData).parsed.info.tokenAmount.decimals;
        let DECIMALS = Math.pow(10, decimal);
        return DECIMALS;
    }
    catch { return null; }
}