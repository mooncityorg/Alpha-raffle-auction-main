use anchor_lang::prelude::*;
use std::clone::Clone;
use std::result::Result;

use crate::constants::*;
use crate::error::*;

#[account]
#[derive(Default)]
pub struct GlobalPool {
    pub super_admin: Pubkey, // 32
}

#[account(zero_copy)]
pub struct RafflePool {
    // 128+48*200+32*1000+80 = 41808
    pub creator: Pubkey,                  //32
    pub nft_mint: Pubkey,                 //32
    pub token_mint_first: Pubkey,         //32
    pub token_mint_second: Pubkey,        //32
    pub count: u64,                       //8
    pub winner_count: u64,                //8
    pub no_repeat: u64,                   //8
    pub max_entrants: u64,                //8
    pub end_timestamp: i64,               //8
    pub ticket_price_first: u64,          //8
    pub ticket_price_second: u64,         //8
    pub ticket_price_sol: u64,            //8
    pub withdrawed: u64,                  //8
    pub claimed_winner: [u64; MAX_WINNERS], //8 *200
    pub winner_indexes: [u64; MAX_WINNERS], //8 *200
    pub winners: [Pubkey; MAX_WINNERS],     //32 *200
    pub entrants: [Pubkey; MAX_ENTRANTS], //32*1000
}

impl Default for RafflePool {
    #[inline]
    fn default() -> RafflePool {
        RafflePool {
            creator: Pubkey::default(),
            count: 0,
            no_repeat: 0,
            max_entrants: 0,
            winner_count: 0,
            end_timestamp: 0,
            ticket_price_first: 0,
            ticket_price_second: 0,
            ticket_price_sol: 0,
            withdrawed: 0,
            claimed_winner: [0; MAX_WINNERS],
            winner_indexes: [0; MAX_WINNERS],
            nft_mint: Pubkey::default(),
            token_mint_first: Pubkey::default(),
            token_mint_second: Pubkey::default(),
            winners: [Pubkey::default(); MAX_WINNERS],
            entrants: [Pubkey::default(); MAX_ENTRANTS],
        }
    }
}
impl RafflePool {
    pub fn append(&mut self, buyer: Pubkey) {
        self.entrants[self.count as usize] = buyer;
        self.count += 1;
    }
}
