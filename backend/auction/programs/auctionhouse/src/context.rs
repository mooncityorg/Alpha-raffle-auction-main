use crate::account::*;
use crate::utils::*;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{system_program, sysvar};
use anchor_spl::token::Mint;

#[derive(Accounts)]
#[instruction(
    bump: u8,
    title: String,
    floor: u64,
    increment: u64,
    start_time: u64,
    end_time: u64,
    bidder_cap: u64,
    token_amount: u64
)]
pub struct CreateOpenAuction<'info> {
    #[account(
        init,
        seeds = [b"open auction", owner.to_account_info().key.as_ref(), name_seed(&title)],
        bump = bump,
        payer = owner,
        space = 10000)]
    pub auction: Account<'info, OpenAuction>,
    #[account(mut)]
    pub auction_ata: AccountInfo<'info>,
    #[account(mut)]
    pub auction_token_ata: AccountInfo<'info>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub owner_ata: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    pub token_mint: Account<'info, Mint>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
    #[account(address = spl_associated_token_account::ID)]
    pub ata_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    #[account(address = sysvar::rent::ID)]
    pub rent_sysvar: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CancelOpenAuction<'info> {
    #[account(mut, has_one = owner)]
    pub auction: Account<'info, OpenAuction>,
    pub owner: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(
    bump: u8
)]
pub struct MakeOpenBid<'info> {
    #[account(mut)]
    pub auction: Account<'info, OpenAuction>,
    #[account(mut)]
    pub auction_ata: AccountInfo<'info>,
    #[account(mut)]
    pub bidder: Signer<'info>,
    #[account(mut)]
    pub bidder_ata: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"global"],
        bump = bump
    )]
    pub global_pool: AccountInfo<'info>,
    pub token_mint: Account<'info, Mint>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
    #[account(address = spl_associated_token_account::ID)]
    pub ata_program: AccountInfo<'info>,
    #[account(address = sysvar::rent::ID)]
    pub rent_sysvar: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(
    bump: u8
)]
pub struct ReclaimOpenBid<'info> {
    #[account(mut)]
    pub auction: Account<'info, OpenAuction>,
    #[account(mut)]
    pub auction_ata: AccountInfo<'info>,
    #[account(mut)]
    pub bidder: Signer<'info>,
    #[account(mut)]
    pub bidder_ata: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"global"],
        bump = bump
    )]
    pub global_pool: AccountInfo<'info>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct WithdrawItemOpen<'info> {
    #[account(mut, has_one = highest_bidder, has_one = mint)]
    pub auction: Account<'info, OpenAuction>,
    #[account(mut)]
    pub auction_ata: AccountInfo<'info>,
    #[account(mut)]
    pub highest_bidder: Signer<'info>,
    #[account(mut)]
    pub highest_bidder_ata: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
    #[account(address = spl_associated_token_account::ID)]
    pub ata_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    #[account(address = sysvar::rent::ID)]
    pub rent_sysvar: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(
    bump: u8
)]
pub struct WithdrawWinningBidOpen<'info> {
    #[account(mut, has_one = owner)]
    pub auction: Account<'info, OpenAuction>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub auction_ata: AccountInfo<'info>,
    #[account(mut)]
    pub owner_ata: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"global"],
        bump = bump
    )]
    pub global_pool: AccountInfo<'info>,

    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ReclaimItemOpen<'info> {
    #[account(mut, has_one = owner.key(), has_one = mint.key())]
    pub auction: Account<'info, OpenAuction>,
    #[account(mut)]
    pub auction_ata: AccountInfo<'info>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub owner_ata: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
    #[account(address = spl_associated_token_account::ID)]
    pub ata_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    #[account(address = sysvar::rent::ID)]
    pub rent_sysvar: AccountInfo<'info>,
}