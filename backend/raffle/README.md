# Raffle-program
This is the raffle project that winners can receive the raffle NFT by buying tickets. You can buy tickets by $Sol and $NKL token.


When users want to see the winners, call `revealWinner` function.

`revealWinner(
    userAddress: PublicKey,
    nft_mint: PublicKey
)`


## Install Dependencies
- Install `node` and `yarn`
- Install `ts-node` as global command
- Confirm the solana wallet preparation: `/home/fury/.config/solana/id.json` in test case

## Usage
- Main script source for all functionality is here: `/cli/script.ts`
- Program account types are declared here: `/cli/types.ts`
- Idl to make the JS binding easy is here: `/cli/raffle.json`

Able to test the script functions working in this way.
- Change commands properly in the main functions of the `script.ts` file to call the other functions
- Confirm the `ANCHOR_WALLET` environment variable of the `ts-node` script in `package.json`
- Run `yarn ts-node`

## Features

### - As a Smart Contract Owner
For the first time use, the Smart Contract Owner should `initialize` the Smart Contract for global account allocation.
- `initProject`


### - As the Creator of Raffle
The NFTs will be stored in the globalAuthority address.
When the admin creates a raffle, call the `creatRaffle` function, the NFT will be sent to the PDA and the data of this raffle is stored on blockchain.

`creatRaffle(
    userAddress: PublicKey,
    nft_mint: PublicKey,
    ticketPriceSol: number,
    ticketPriceSpl: number,
    endTimestamp: number,
    max: number
)`

The creator can withdraw NFT from the PDA if nobody buys tickets and the time exceeds the endTime of raffle. 

`withdrawNft(
    userAddress: PublicKey,
    nft_mint: PublicKey
)`

### - As the User of Raffle
When users buy tickets, call the `buyTicket` function, users will send $Sol and $NKL token to the raffle creator.

`buyTicket(
    userAddress: PublicKey,
    nft_mint: PublicKey,
    amount: number
)`

When users want to see the winners, call `revealWinner` function.

`revealWinner(
    userAddress: PublicKey,
    nft_mint: PublicKey
)`

### - As the Winner of Raffle
Winners can claim rewards by calling `claimReward` function.

`claimReward(
    userAddress: PublicKey,
    nft_mint: PublicKey
)`


