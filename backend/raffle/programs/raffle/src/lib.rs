use anchor_lang::{accounts::cpi_account::CpiAccount, prelude::*, AccountSerialize, System};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Token, TokenAccount, Transfer},
};
use solana_program::program::{invoke, invoke_signed};
use solana_program::pubkey::Pubkey;
use spl_token::instruction::*;

pub mod account;
pub mod constants;
pub mod error;
pub mod utils;

use account::*;
use constants::*;
use error::*;
use utils::*;

declare_id!("3RGdPiDD6sJq925NSnaZJ8sakDc7aGSr1MWbb6DBBAR3");

#[program]
pub mod raffle {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, _global_bump: u8) -> ProgramResult {
        let global_authority = &mut ctx.accounts.global_authority;
        global_authority.super_admin = ctx.accounts.admin.key();
        Ok(())
    }

    pub fn create_raffle(
        ctx: Context<CreateRaffle>,
        global_bump: u8,
        winner_count: u64,
        ticket_price_first: u64,
        ticket_price_second: u64,
        ticket_price_sol: u64,
        end_timestamp: i64,
        max_entrants: u64,
    ) -> ProgramResult {
        let mut raffle = ctx.accounts.raffle.load_init()?;

        let timestamp = Clock::get()?.unix_timestamp;
        msg!("Timestamp: {:?}", timestamp);
        msg!("End Timestamp: {:?}", end_timestamp);

        if timestamp > end_timestamp {
            return Err(RaffleError::InvalidEndTimestamp.into());
        }
        if max_entrants > 1000 {
            return Err(RaffleError::MaxEntrantsTooLarge.into());
        }

        // Transfer NFT to the PDA
        let src_token_account_info = &mut &ctx.accounts.owner_temp_nft_account;
        let dest_token_account_info = &mut &ctx.accounts.dest_nft_token_account;
        let token_program = &mut &ctx.accounts.token_program;

        let cpi_accounts = Transfer {
            from: src_token_account_info.to_account_info().clone(),
            to: dest_token_account_info.to_account_info().clone(),
            authority: ctx.accounts.admin.to_account_info().clone(),
        };
        token::transfer(
            CpiContext::new(token_program.clone().to_account_info(), cpi_accounts),
            1,
        )?;

        raffle.creator = ctx.accounts.admin.key();
        raffle.nft_mint = ctx.accounts.nft_mint_address.key();
        raffle.token_mint_first = ctx.accounts.first_token_address.key();
        raffle.token_mint_second = ctx.accounts.second_token_address.key();
        raffle.ticket_price_first = ticket_price_first;
        raffle.ticket_price_second = ticket_price_second;
        raffle.ticket_price_sol = ticket_price_sol;
        raffle.winner_count = winner_count;
        raffle.end_timestamp = end_timestamp;
        raffle.max_entrants = max_entrants;
        raffle.withdrawed = 0;

        Ok(())
    }

    pub fn buy_tickets(ctx: Context<BuyTickets>, global_bump: u8, amount: u64) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
        let mut raffle = ctx.accounts.raffle.load_mut()?;
        msg!("{}", timestamp);

        if timestamp > raffle.end_timestamp {
            return Err(RaffleError::RaffleEnded.into());
        }
        if raffle.count + amount > raffle.max_entrants {
            return Err(RaffleError::NotEnoughTicketsLeft.into());
        }

        let total_amount_first = amount * raffle.ticket_price_first;
        let total_amount_second = amount * raffle.ticket_price_second;
        let total_amount_sol = amount * raffle.ticket_price_sol;

        if ctx.accounts.buyer.to_account_info().lamports() < total_amount_sol {
            return Err(RaffleError::NotEnoughSOL.into());
        }
        if raffle.count == 0 {
            raffle.no_repeat = 1;
        } else {
            let mut index: u64 = 0;
            for i in 0..raffle.count {
                if raffle.entrants[i as usize] == ctx.accounts.buyer.key() {
                    index = i + 1 as u64;
                }
            }
            if index == 0 {
                raffle.no_repeat += 1;
            }
        }

        for _ in 0..amount {
            raffle.append(ctx.accounts.buyer.key());
        }

        let src_first_account_info = &mut &ctx.accounts.user_first_token_account;
        let dest_first_account_info = &mut &ctx.accounts.creator_first_token_account;

        let src_second_account_info = &mut &ctx.accounts.user_second_token_account;
        let dest_second_account_info = &mut &ctx.accounts.creator_second_token_account;

        let token_program = &mut &ctx.accounts.token_program;

        if total_amount_first > 0 {
            let cpi_accounts = Transfer {
                from: src_first_account_info.to_account_info().clone(),
                to: dest_first_account_info.to_account_info().clone(),
                authority: ctx.accounts.buyer.to_account_info().clone(),
            };
            token::transfer(
                CpiContext::new(token_program.clone().to_account_info(), cpi_accounts),
                total_amount_first,
            )?;
        }

        if total_amount_second > 0 {
            let cpi_accounts = Transfer {
                from: src_second_account_info.to_account_info().clone(),
                to: dest_second_account_info.to_account_info().clone(),
                authority: ctx.accounts.buyer.to_account_info().clone(),
            };
            token::transfer(
                CpiContext::new(token_program.clone().to_account_info(), cpi_accounts),
                total_amount_second,
            )?;
        }

        if total_amount_sol > 0 {
            sol_transfer_user(
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.creator.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                total_amount_sol,
            )?;
        }

        Ok(())
    }

    pub fn reveal_winner(ctx: Context<RevealWinner>) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
        let mut raffle = ctx.accounts.raffle.load_mut()?;

        if timestamp < raffle.end_timestamp {
            return Err(RaffleError::RaffleNotEnded.into());
        }

        if raffle.count < raffle.winner_count {
            for j in 0..raffle.count {
                raffle.winner_indexes[j as usize] = j;
                raffle.winners[j as usize] = raffle.entrants[j as usize];
            }
            raffle.winner_count = raffle.count;
        } else {
            let count = raffle.winner_count;
            let mut crt: u64 = 0;

            while crt < count {
                let (player_address, _bump) = Pubkey::find_program_address(
                    &[
                        RANDOM_SEED.as_bytes(),
                        crt.to_string().as_bytes(),
                        timestamp.to_string().as_bytes(),
                    ],
                    &raffle::ID,
                );

                let char_vec: Vec<char> = player_address.to_string().chars().collect();
                let mut mul = 1;
                for i in 0..7 {
                    mul *= u64::from(char_vec[i as usize]);
                }
                mul += u64::from(char_vec[7]);
                let winner_index = mul % raffle.count;
                let mut flag: u64 = 0;
                
                for j in 0..crt {
                    if raffle.winner_indexes[j as usize] == winner_index {
                        flag = 1;
                        break;
                    }
                }
                if flag == 0 {
                    raffle.winners[crt as usize] = raffle.entrants[winner_index as usize];
                    raffle.winner_indexes[crt as usize] = winner_index;
                    crt += 1;
                }
            }
        }
        
        Ok(())
    }

    pub fn claim_reward(ctx: Context<ClaimReward>) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
        let mut raffle = ctx.accounts.raffle.load_mut()?;

        if timestamp < raffle.end_timestamp {
            return Err(RaffleError::RaffleNotEnded.into());
        }
        for i in 0..raffle.winner_count {
            if raffle.winners[i as usize] == ctx.accounts.claimer.key() {
                raffle.claimed_winner[i as usize] = 1;
            }
        }

        Ok(())
    }

    pub fn withdraw_nft(ctx: Context<WithdrawNft>, global_bump: u8) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
        let mut raffle = ctx.accounts.raffle.load_mut()?;

        if timestamp < raffle.end_timestamp {
            return Err(RaffleError::RaffleNotEnded.into());
        }
        if raffle.creator != ctx.accounts.claimer.key() {
            return Err(RaffleError::NotCreator.into());
        }
       
        // Transfer NFT to the winner's wallet
        let src_token_account = &mut &ctx.accounts.src_nft_token_account;
        let dest_token_account = &mut &ctx.accounts.claimer_nft_token_account;
        let token_program = &mut &ctx.accounts.token_program;
        let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: src_token_account.to_account_info().clone(),
            to: dest_token_account.to_account_info().clone(),
            authority: ctx.accounts.global_authority.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                token_program.clone().to_account_info(),
                cpi_accounts,
                signer,
            ),
            1,
        )?;

        raffle.withdrawed = 1;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(global_bump: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump = global_bump,
        payer = admin
    )]
    pub global_authority: Account<'info, GlobalPool>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(global_bump: u8)]
pub struct CreateRaffle<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump = global_bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,

    #[account(zero)]
    pub raffle: AccountLoader<'info, RafflePool>,

    #[account(
        mut,
        constraint = owner_temp_nft_account.mint == *nft_mint_address.to_account_info().key,
        constraint = owner_temp_nft_account.owner == *admin.key,
    )]
    pub owner_temp_nft_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = dest_nft_token_account.mint == *nft_mint_address.to_account_info().key,
        constraint = dest_nft_token_account.owner == *global_authority.to_account_info().key,
    )]
    pub dest_nft_token_account: Account<'info, TokenAccount>,

    pub first_token_address: AccountInfo<'info>,
    pub second_token_address: AccountInfo<'info>,
    pub nft_mint_address: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(global_bump: u8)]
pub struct BuyTickets<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut)]
    pub raffle: AccountLoader<'info, RafflePool>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump = global_bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,

    #[account(mut)]
    pub creator: AccountInfo<'info>,
    #[account(mut)]
    pub creator_first_token_account: AccountInfo<'info>,
    #[account(mut)]
    pub creator_second_token_account: AccountInfo<'info>,
    #[account(mut)]
    pub user_first_token_account: AccountInfo<'info>,
    #[account(mut)]
    pub user_second_token_account: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevealWinner<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut)]
    pub raffle: AccountLoader<'info, RafflePool>,
}

#[derive(Accounts)]
#[instruction(global_bump: u8)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,

    #[account(mut)]
    pub raffle: AccountLoader<'info, RafflePool>,
}

#[derive(Accounts)]
#[instruction(global_bump: u8)]
pub struct WithdrawNft<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump = global_bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,

    #[account(mut)]
    pub raffle: AccountLoader<'info, RafflePool>,

    #[account(
        mut,
        constraint = claimer_nft_token_account.mint == *nft_mint_address.to_account_info().key,
        constraint = claimer_nft_token_account.owner == *claimer.key,
    )]
    pub claimer_nft_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = src_nft_token_account.mint == *nft_mint_address.to_account_info().key,
        constraint = src_nft_token_account.owner == *global_authority.to_account_info().key,
    )]
    pub src_nft_token_account: Account<'info, TokenAccount>,

    pub nft_mint_address: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}
