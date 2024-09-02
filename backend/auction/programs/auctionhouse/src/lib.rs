pub mod account;
pub mod context;
pub mod error;
pub mod utils;
use account::*;
use anchor_lang::prelude::*;
use context::*;
use error::*;
use utils::*;

declare_id!("HLqQzFqC8m7dehwGR5YmekDGefdPXv1DmCaxDMWnhXgT");

#[program]
pub mod auctionhouse {
    use super::*;
    pub fn create_open_auction(
        ctx: Context<CreateOpenAuction>,
        bump: u8,
        title: String,
        floor: u64,
        token_floor: u64,
        increment: u64,
        token_increment: u64,
        start_time: u64,
        end_time: u64,
        bidder_cap: u64,
        token_amount: u64,
    ) -> ProgramResult {
        let auction: &mut Account<OpenAuction> = &mut ctx.accounts.auction;
        let auction_ata = &ctx.accounts.auction_ata;
        let auction_token_ata = &ctx.accounts.auction_token_ata;
        let owner = &ctx.accounts.owner;
        let owner_ata = &ctx.accounts.owner_ata;
        let mint = &ctx.accounts.mint;
        let token_mint = &ctx.accounts.token_mint;
        let token_program = &ctx.accounts.token_program;
        let ata_program = &ctx.accounts.ata_program;
        let system_program = &ctx.accounts.system_program;
        let rent_sysvar = &ctx.accounts.rent_sysvar;

        msg!("sTART....");
        let clock: Clock = Clock::get().unwrap();
        let cur_time: u64 = clock.unix_timestamp as u64;

        require!(
            title.chars().count() <= 50,
            Err(AuctionError::TitleOverflow.into())
        );
        require!(increment != 0, Err(AuctionError::InvalidIncrement.into()));
        require!(
            token_amount != 0,
            Err(AuctionError::InvalidTokenAmount.into())
        );
        require!(
            start_time < end_time,
            Err(AuctionError::InvalidStartTime.into())
        );
        require!(
            cur_time < start_time || start_time == 0,
            Err(AuctionError::InvalidStartTime.into())
        );
        require!(
            cur_time < end_time,
            Err(AuctionError::InvalidEndTime.into())
        );
        require!(floor > 0, Err(AuctionError::InvalidBidFloor.into()));

        auction.owner = *owner.key;
        auction.mint = mint.key();
        auction.token_mint = token_mint.key();
        auction.token_amount = token_amount;

        auction.start_time = if start_time == 0 {
            cur_time
        } else {
            start_time
        };
        auction.end_time = end_time;
        auction.cancelled = false;

        auction.title = title;

        auction.bidder_cap = bidder_cap;
        auction.highest_bid = 0;
        auction.bid_floor = floor;
        auction.token_floor = token_floor;
        auction.min_bid_increment = increment;
        auction.min_bid_token_increment = token_increment;

        auction.bump = bump;

        create_ata(
            owner.to_account_info(),
            auction.to_account_info(),
            mint.to_account_info(),
            auction_ata.to_account_info(),
            token_program.to_account_info(),
            ata_program.to_account_info(),
            system_program.to_account_info(),
            rent_sysvar.to_account_info(),
        )?;

        create_ata(
            owner.to_account_info(),
            auction.to_account_info(),
            token_mint.to_account_info(),
            auction_token_ata.to_account_info(),
            token_program.to_account_info(),
            ata_program.to_account_info(),
            system_program.to_account_info(),
            rent_sysvar.to_account_info(),
        )?;


        transfer_spl(
            owner.to_account_info(),
            owner_ata.to_account_info(),
            auction_ata.to_account_info(),
            token_amount,
            token_program.to_account_info(),
            &[],
        )?;

        Ok(())
    }

    pub fn cancel_open_auction(ctx: Context<CancelOpenAuction>) -> ProgramResult {
        let auction: &mut Account<OpenAuction> = &mut ctx.accounts.auction;

        let clock: Clock = Clock::get().unwrap();
        let cur_time: u64 = clock.unix_timestamp as u64;

        require!(
            cur_time < auction.end_time,
            Err(AuctionError::CannotCancelAfterClose.into())
        );

        auction.cancelled = true;

        Ok(())
    }

    pub fn make_open_bid(ctx: Context<MakeOpenBid>, bump: u8, amount: u64, token_amount: u64) -> ProgramResult {
        let auction: &mut Account<OpenAuction> = &mut ctx.accounts.auction;
        let auction_ata = &ctx.accounts.auction_ata;
        let bidder: &Signer = &ctx.accounts.bidder;
        let bidder_ata = &ctx.accounts.bidder_ata;
        let token_mint = &ctx.accounts.token_mint;
        let token_program = &ctx.accounts.token_program;
        let ata_program = &ctx.accounts.ata_program;
        let rent_sysvar = &ctx.accounts.rent_sysvar;
        let global_pool = &ctx.accounts.global_pool;

        let system_program = &ctx.accounts.system_program;

        let clock: Clock = Clock::get().unwrap();
        let cur_time: u64 = clock.unix_timestamp as u64;

        require!(
            !auction.cancelled,
            Err(AuctionError::AuctionCancelled.into())
        );
        require!(
            cur_time > auction.start_time,
            Err(AuctionError::BidBeforeStart.into())
        );
        require!(
            cur_time < auction.end_time,
            Err(AuctionError::BidAfterClose.into())
        );
        require!(
            *bidder.key != auction.owner,
            Err(AuctionError::OwnerCannotBid.into())
        );

        let index = auction.bidders.iter().position(|&x| x == *bidder.key);

        // new amount plus already bid amount
        let mut total_bid = amount;
        let mut total_token_bid = token_amount;
        let mut new_bidder = false;

        if let None = index {
            require!(
                auction.bidders.len() < (auction.bidder_cap as usize),
                Err(AuctionError::BidderCapReached.into())
            );
            new_bidder = true;
        } else {
            total_bid += auction.bids[index.unwrap()];
            total_token_bid += auction.bid_token[index.unwrap()];
        }

        require!(
            total_bid > auction.bid_floor,
            Err(AuctionError::UnderBidFloor.into())
        );
        require!(
            total_token_bid > auction.token_floor,
            Err(AuctionError::UnderBidFloor.into())
        );
        if auction.highest_bid == 0 {
            msg!("total_bid1 {:?} bid {:?} ", total_bid, auction.bid_floor + auction.min_bid_increment);
            require!(
                total_bid >= (auction.bid_floor + auction.min_bid_increment),
                Err(AuctionError::InsufficientBid.into())
            );
        } else {
            msg!("total_bid2 {:?} bid {:?} ", total_bid, auction.bid_floor + auction.min_bid_increment);

            require!(
                total_bid >= (auction.highest_bid + auction.min_bid_increment),
                Err(AuctionError::InsufficientBid.into())
            );
        }

        if auction.highest_token == 0 {
            msg!("total_bid3 {:?} bid {:?} ", total_bid, auction.bid_floor + auction.min_bid_increment);

            require!(
                total_token_bid >= (auction.token_floor + auction.min_bid_token_increment),
                Err(AuctionError::InsufficientBid.into())
            );
        } else {
            msg!("total_bid4 {:?} bid {:?} ", total_bid, auction.bid_floor + auction.min_bid_increment);

            require!(
                total_token_bid >= (auction.highest_token + auction.min_bid_token_increment),
                Err(AuctionError::InsufficientBid.into())
            );
        }

        if new_bidder {
            auction.bidders.push(*bidder.key);
            auction.bids.push(total_bid);
            auction.bid_token.push(total_token_bid);
        } else {
            auction.bids[index.unwrap()] = total_bid;
            auction.bid_token[index.unwrap()] = total_token_bid;
        }

        if auction.end_time - cur_time < 300 {
            auction.end_time += 300;
        }

        auction.highest_bidder = *bidder.key;
        auction.highest_bid = total_bid;
        auction.highest_token = total_token_bid;

        if auction_ata.to_account_info().data_is_empty() {
            create_ata(
                bidder.to_account_info(),
                auction.to_account_info(),
                token_mint.to_account_info(),
                auction_ata.to_account_info(),
                token_program.to_account_info(),
                ata_program.to_account_info(),
                system_program.to_account_info(),
                rent_sysvar.to_account_info(),
            )?;
        }
        transfer_spl(
            bidder.to_account_info(),
            bidder_ata.to_account_info(),
            auction_ata.to_account_info(),
            token_amount,
            token_program.to_account_info(),
            &[],
        )?;

        transfer_sol(
            bidder.to_account_info(),
            global_pool.to_account_info(),
            amount,
            system_program.to_account_info()
        )?;

        Ok(())
    }

    pub fn reclaim_open_bid(ctx: Context<ReclaimOpenBid>, bump: u8) -> ProgramResult {
        let auction: &mut Account<OpenAuction> = &mut ctx.accounts.auction;
        let bidder: &Signer = &ctx.accounts.bidder;
        let global_pool = &ctx.accounts.global_pool;
        let system_program = &ctx.accounts.system_program;
        let token_program = &ctx.accounts.token_program;
        let index = auction.bidders.iter().position(|&x| x == *bidder.key);

        if let None = index {
            return Err(AuctionError::NotBidder.into());
        } else if *bidder.key == auction.highest_bidder && !auction.cancelled {
            return Err(AuctionError::WinnerCannotWithdrawBid.into());
        } else {
            let bid = auction.bids[index.unwrap()];
            let bid_token = auction.bid_token[index.unwrap()];
            let bidder_ata = &ctx.accounts.bidder_ata;
            let auction_ata = &ctx.accounts.auction_ata;

            auction.bidders.remove(index.unwrap());
            auction.bids.remove(index.unwrap());
            auction.bid_token.remove(index.unwrap());

            transfer_spl(
                auction.to_account_info(),
                auction_ata.to_account_info(),
                bidder_ata.to_account_info(),
                bid_token,
                token_program.to_account_info(),
                &[&[
                    b"open auction",
                    auction.owner.as_ref(),
                    name_seed(&auction.title),
                    &[auction.bump],
                ]],
            )?;

            transfer_sol_with_signer(
                global_pool.to_account_info(),
                bidder.to_account_info(),
                system_program.to_account_info(),
                &[&[b"global",&[bump]]],
                bid,
            )?;
        }

        Ok(())
    }

    pub fn withdraw_item_open(ctx: Context<WithdrawItemOpen>) -> ProgramResult {
        let auction: &mut Account<OpenAuction> = &mut ctx.accounts.auction;
        let auction_ata = &ctx.accounts.auction_ata;
        let winner = &ctx.accounts.highest_bidder;
        let winner_ata = &ctx.accounts.highest_bidder_ata;
        let mint = &ctx.accounts.mint;
        let token_program = &ctx.accounts.token_program;
        let ata_program = &ctx.accounts.ata_program;
        let system_program = &ctx.accounts.system_program;
        let rent_sysvar = &ctx.accounts.rent_sysvar;

        let clock: Clock = Clock::get().unwrap();
        let cur_time: u64 = clock.unix_timestamp as u64;

        require!(
            !auction.cancelled,
            Err(AuctionError::AuctionCancelled.into())
        );
        require!(
            cur_time > auction.end_time,
            Err(AuctionError::AuctionNotOver.into())
        );

        let amount = auction.token_amount;

        if winner_ata.to_account_info().data_is_empty() {
            create_ata(
                winner.to_account_info(),
                winner.to_account_info(),
                mint.to_account_info(),
                winner_ata.to_account_info(),
                token_program.to_account_info(),
                ata_program.to_account_info(),
                system_program.to_account_info(),
                rent_sysvar.to_account_info(),
            )?;
        }

        transfer_spl(
            auction.to_account_info(),
            auction_ata.to_account_info(),
            winner_ata.to_account_info(),
            amount,
            token_program.to_account_info(),
            &[&[
                b"open auction",
                auction.owner.as_ref(),
                name_seed(&auction.title),
                &[auction.bump],
            ]],
        )?;
        auction.token_amount = 0;

        Ok(())
    }

    pub fn withdraw_winning_bid_open(ctx: Context<WithdrawWinningBidOpen>, bump: u8) -> ProgramResult {
        let auction: &mut Account<OpenAuction> = &mut ctx.accounts.auction;
        let owner: &Signer = &ctx.accounts.owner;
        let global_pool = &ctx.accounts.global_pool;
        let system_program = &ctx.accounts.system_program;
        let token_program = &ctx.accounts.token_program;

        let clock: Clock = Clock::get().unwrap();
        let cur_time: u64 = clock.unix_timestamp as u64;

        require!(
            !auction.cancelled,
            Err(AuctionError::AuctionCancelled.into())
        );
        require!(
            cur_time > auction.end_time,
            Err(AuctionError::AuctionNotOver.into())
        );

        let index = auction
            .bidders
            .iter()
            .position(|&x| x == auction.highest_bidder);
        if let None = index {
            return Err(AuctionError::NoWinningBid.into());
        } else {
            let winning_bid = auction.bids[index.unwrap()];
            let winning_token_bid = auction.bid_token[index.unwrap()];

            require!(
                winning_bid > 0,
                Err(AuctionError::AlreadyWithdrewBid.into())
            );

            auction.bids[index.unwrap()] = 0;
            auction.bid_token[index.unwrap()] = 0;

            let owner_ata = &ctx.accounts.owner_ata;
            let auction_ata = &ctx.accounts.auction_ata;
            transfer_spl(
                auction.to_account_info(),
                auction_ata.to_account_info(),
                owner_ata.to_account_info(),
                winning_token_bid,
                token_program.to_account_info(),
                &[&[
                    b"open auction",
                    auction.owner.as_ref(),
                    name_seed(&auction.title),
                    &[auction.bump],
                ]],
            )?;

            transfer_sol_with_signer(
                global_pool.to_account_info(),
                owner.to_account_info(),
                system_program.to_account_info(),
                &[&[b"global",&[bump]]],
                winning_bid,
            )?;
        }

        Ok(())
    }

    pub fn reclaim_item_open(ctx: Context<ReclaimItemOpen>) -> ProgramResult {
        let auction: &mut Account<OpenAuction> = &mut ctx.accounts.auction;
        let auction_ata = &ctx.accounts.auction_ata;
        let owner = &ctx.accounts.owner;
        let owner_ata = &ctx.accounts.owner_ata;
        let mint = &ctx.accounts.mint;
        let token_program = &ctx.accounts.token_program;
        let ata_program = &ctx.accounts.ata_program;
        let system_program = &ctx.accounts.system_program;
        let rent_sysvar = &ctx.accounts.rent_sysvar;

        let clock: Clock = Clock::get().unwrap();
        let cur_time: u64 = clock.unix_timestamp as u64;

        require!(
            (auction.highest_bid == 0 && cur_time > auction.end_time) || auction.cancelled,
            Err(AuctionError::AuctionNotOver.into())
        );

        let amount = auction.token_amount;

        if owner_ata.to_account_info().data_is_empty() {
            create_ata(
                owner.to_account_info(),
                owner.to_account_info(),
                mint.to_account_info(),
                owner_ata.to_account_info(),
                token_program.to_account_info(),
                ata_program.to_account_info(),
                system_program.to_account_info(),
                rent_sysvar.to_account_info(),
            )?;
        }

        transfer_spl(
            auction.to_account_info(),
            auction_ata.to_account_info(),
            owner_ata.to_account_info(),
            amount,
            token_program.to_account_info(),
            &[&[
                b"open auction",
                auction.owner.as_ref(),
                name_seed(&auction.title),
                &[auction.bump],
            ]],
        )?;

        auction.token_amount = 0; 
        Ok(())
    }
}