import { ParsedAccountData, PublicKey } from "@solana/web3.js";
import { web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import { programs } from "@metaplex/js";
import { ADMIN_LIST, NETWORK } from "../config";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { errorAlert } from "../components/toastGroup";
export const solConnection = new web3.Connection(web3.clusterApiUrl(NETWORK));

export const adminValidation = (address: PublicKey) => {
    let res = false;
    for (let item of ADMIN_LIST) {
        res = res || (item.address === address.toBase58())
    }
    return res
}

export const getNftMetaData = async (nftMintPk: PublicKey) => {
    let { metadata: { Metadata } } = programs;
    let metadataAccount = await Metadata.getPDA(nftMintPk);
    const metadata = await Metadata.load(solConnection, metadataAccount);
    return metadata.data.data.uri;
}


export const getAssociatedTokenAccount = async (ownerPubkey: PublicKey, mintPk: PublicKey): Promise<PublicKey> => {
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
        if (walletAddress !== owner) {
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

export const getDecimals = async (owner: PublicKey, tokenMint: PublicKey) => {
    try {
        let ownerTokenAccount = await getAssociatedTokenAccount(owner, tokenMint);
        const tokenAccount = await solConnection.getParsedAccountInfo(ownerTokenAccount);
        let decimal = (tokenAccount.value?.data as ParsedAccountData).parsed.info.tokenAmount.decimals;
        let DECIMALS = Math.pow(10, decimal);
        return DECIMALS;
    } catch {
        return 0;
    }
}

export const filterError = (error: any) => {
    if (error.message) {
        const errorCode = parseInt(error.message.split("custom program error: ")[1])
        // "custom program error: "
        switch (errorCode) {
            case 6000:
                errorAlert("Title must be less than 50 characters.")
                break;
            case 6001:
                errorAlert("Minimum bid increment must be greater than 0.")
                break;
            case 6002:
                errorAlert("Start time must be in the future and before end time.")
                break;
            case 6003:
                errorAlert("End time must be after start time.")
                break;
            case 6004:
                errorAlert("Bid floor must be at least 1 lamport.")
                break;
            case 6005:
                errorAlert("Reveal period must end after the auction ends.")
                break;
            case 6006:
                errorAlert("SPL token amount must be greater than 0.")
                break;
            case 6007:
                errorAlert("Must bid higher than the floor.")
                break;
            case 6008:
                errorAlert("Must bid at least min_bid_increment higher than max_bid.")
                break;
            case 6009:
                errorAlert("Auction is cancelled and only allows reclaiming past bids and the item.")
                break;
            case 6010:
                errorAlert("Auction period has not yet begun.")
                break;
            case 6011:
                errorAlert("Auction period has elapsed.")
                break;
            case 6012:
                errorAlert("Maximum number of unique bidders has been reached.")
                break;
            case 6013:
                errorAlert("Owner cannot bid on auction.")
                break;
            case 6014:
                errorAlert("Auction is not over.")
                break;
            case 6015:
                errorAlert("No previous bid associated with this key.")
                break;
            case 6016:
                errorAlert("No winning bid to withdraw.")
                break;
            case 6017:
                errorAlert("Auction winner cannot withdraw their bid.")
                break;
            case 6018:
                errorAlert("Winning bid has already been withdrawn.")
                break;
            case 6019:
                errorAlert("Each key can only have one active sealed bid per auction.")
                break;
            case 6020:
                errorAlert("Sealed bids must be accompanied by a non-zero amount of SOL.")
                break;
            case 6021:
                errorAlert("Reveal period has elapsed.")
                break;
            case 6022:
                errorAlert("Reveal period is not over.")
                break;
            case 6023:
                errorAlert("Keccak256 of provided bid and nonce does not match the sealed bid hash.")
                break;
            case 6024:
                errorAlert("Cannot cancel auction during reveal period.")
                break;
            case 6025:
                errorAlert("Cannot cancel auction after it has ended.")
                break;
            case 6026:
                errorAlert("Sealed bid cannot be higher than escrowed SOL.")
                break;

            default:
                break;
        }
        return errorCode
    }
}