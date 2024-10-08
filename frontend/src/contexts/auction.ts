export type Auctionhouse = {
    "version": "0.1.0",
    "name": "auctionhouse",
    "instructions": [
        {
            "name": "createOpenAuction",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "auctionAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "auctionTokenAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "ownerAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "mint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "ataProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rentSysvar",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                },
                {
                    "name": "title",
                    "type": "string"
                },
                {
                    "name": "floor",
                    "type": "u64"
                },
                {
                    "name": "tokenFloor",
                    "type": "u64"
                },
                {
                    "name": "increment",
                    "type": "u64"
                },
                {
                    "name": "tokenIncrement",
                    "type": "u64"
                },
                {
                    "name": "startTime",
                    "type": "u64"
                },
                {
                    "name": "endTime",
                    "type": "u64"
                },
                {
                    "name": "bidderCap",
                    "type": "u64"
                },
                {
                    "name": "tokenAmount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "cancelOpenAuction",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": false,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "makeOpenBid",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "auctionAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bidder",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "bidderAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "globalPool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "ataProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rentSysvar",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                },
                {
                    "name": "amount",
                    "type": "u64"
                },
                {
                    "name": "tokenAmount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "reclaimOpenBid",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "auctionAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bidder",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "bidderAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "globalPool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                }
            ]
        },
        {
            "name": "withdrawItemOpen",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "auctionAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "highestBidder",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "highestBidderAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "mint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "ataProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rentSysvar",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "withdrawWinningBidOpen",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "auctionAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "ownerAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "globalPool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                }
            ]
        },
        {
            "name": "reclaimItemOpen",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "auctionAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "ownerAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "mint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "ataProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rentSysvar",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        }
    ],
    "accounts": [
        {
            "name": "OpenAuction",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "owner",
                        "type": "publicKey"
                    },
                    {
                        "name": "mint",
                        "type": "publicKey"
                    },
                    {
                        "name": "tokenMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "tokenAmount",
                        "type": "u64"
                    },
                    {
                        "name": "startTime",
                        "type": "u64"
                    },
                    {
                        "name": "endTime",
                        "type": "u64"
                    },
                    {
                        "name": "cancelled",
                        "type": "bool"
                    },
                    {
                        "name": "title",
                        "type": "string"
                    },
                    {
                        "name": "bidderCap",
                        "type": "u64"
                    },
                    {
                        "name": "bidders",
                        "type": {
                            "vec": "publicKey"
                        }
                    },
                    {
                        "name": "bids",
                        "type": {
                            "vec": "u64"
                        }
                    },
                    {
                        "name": "bidToken",
                        "type": {
                            "vec": "u64"
                        }
                    },
                    {
                        "name": "highestBidder",
                        "type": "publicKey"
                    },
                    {
                        "name": "highestBid",
                        "type": "u64"
                    },
                    {
                        "name": "highestToken",
                        "type": "u64"
                    },
                    {
                        "name": "bidFloor",
                        "type": "u64"
                    },
                    {
                        "name": "tokenFloor",
                        "type": "u64"
                    },
                    {
                        "name": "minBidIncrement",
                        "type": "u64"
                    },
                    {
                        "name": "minBidTokenIncrement",
                        "type": "u64"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "TitleOverflow",
            "msg": "Title must be less than 50 characters."
        },
        {
            "code": 6001,
            "name": "InvalidIncrement",
            "msg": "Minimum bid increment must be greater than 0."
        },
        {
            "code": 6002,
            "name": "InvalidStartTime",
            "msg": "Start time must be in the future and before end time."
        },
        {
            "code": 6003,
            "name": "InvalidEndTime",
            "msg": "End time must be after start time."
        },
        {
            "code": 6004,
            "name": "InvalidBidFloor",
            "msg": "Bid floor must be at least 1 lamport."
        },
        {
            "code": 6005,
            "name": "InvalidRevealPeriod",
            "msg": "Reveal period must end after the auction ends."
        },
        {
            "code": 6006,
            "name": "InvalidTokenAmount",
            "msg": "SPL token amount must be greater than 0."
        },
        {
            "code": 6007,
            "name": "UnderBidFloor",
            "msg": "Must bid higher than the floor."
        },
        {
            "code": 6008,
            "name": "InsufficientBid",
            "msg": "Must bid at least min_bid_increment higher than max_bid."
        },
        {
            "code": 6009,
            "name": "AuctionCancelled",
            "msg": "Auction is cancelled and only allows reclaiming past bids and the item."
        },
        {
            "code": 6010,
            "name": "BidBeforeStart",
            "msg": "Auction period has not yet begun."
        },
        {
            "code": 6011,
            "name": "BidAfterClose",
            "msg": "Auction period has elapsed."
        },
        {
            "code": 6012,
            "name": "BidderCapReached",
            "msg": "Maximum number of unique bidders has been reached."
        },
        {
            "code": 6013,
            "name": "OwnerCannotBid",
            "msg": "Owner cannot bid on auction."
        },
        {
            "code": 6014,
            "name": "AuctionNotOver",
            "msg": "Auction is not over."
        },
        {
            "code": 6015,
            "name": "NotBidder",
            "msg": "No previous bid associated with this key."
        },
        {
            "code": 6016,
            "name": "NoWinningBid",
            "msg": "No winning bid to withdraw."
        },
        {
            "code": 6017,
            "name": "WinnerCannotWithdrawBid",
            "msg": "Auction winner cannot withdraw their bid."
        },
        {
            "code": 6018,
            "name": "AlreadyWithdrewBid",
            "msg": "Winning bid has already been withdrawn."
        },
        {
            "code": 6019,
            "name": "DuplicateSealedBid",
            "msg": "Each key can only have one active sealed bid per auction."
        },
        {
            "code": 6020,
            "name": "MustSendSol",
            "msg": "Sealed bids must be accompanied by a non-zero amount of SOL."
        },
        {
            "code": 6021,
            "name": "RevealPeriodOver",
            "msg": "Reveal period has elapsed."
        },
        {
            "code": 6022,
            "name": "RevealPeriodNotOver",
            "msg": "Reveal period is not over."
        },
        {
            "code": 6023,
            "name": "HashMismatch",
            "msg": "Keccak256 of provided bid and nonce does not match the sealed bid hash."
        },
        {
            "code": 6024,
            "name": "CannotCancelRevealPeriod",
            "msg": "Cannot cancel auction during reveal period."
        },
        {
            "code": 6025,
            "name": "CannotCancelAfterClose",
            "msg": "Cannot cancel auction after it has ended."
        },
        {
            "code": 6026,
            "name": "InsufficientSol",
            "msg": "Sealed bid cannot be higher than escrowed SOL."
        }
    ]
};

export const IDL: Auctionhouse = {
    "version": "0.1.0",
    "name": "auctionhouse",
    "instructions": [
        {
            "name": "createOpenAuction",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "auctionAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "auctionTokenAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "ownerAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "mint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "ataProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rentSysvar",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                },
                {
                    "name": "title",
                    "type": "string"
                },
                {
                    "name": "floor",
                    "type": "u64"
                },
                {
                    "name": "tokenFloor",
                    "type": "u64"
                },
                {
                    "name": "increment",
                    "type": "u64"
                },
                {
                    "name": "tokenIncrement",
                    "type": "u64"
                },
                {
                    "name": "startTime",
                    "type": "u64"
                },
                {
                    "name": "endTime",
                    "type": "u64"
                },
                {
                    "name": "bidderCap",
                    "type": "u64"
                },
                {
                    "name": "tokenAmount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "cancelOpenAuction",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": false,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "makeOpenBid",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "auctionAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bidder",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "bidderAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "globalPool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "ataProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rentSysvar",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                },
                {
                    "name": "amount",
                    "type": "u64"
                },
                {
                    "name": "tokenAmount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "reclaimOpenBid",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "auctionAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bidder",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "bidderAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "globalPool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                }
            ]
        },
        {
            "name": "withdrawItemOpen",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "auctionAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "highestBidder",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "highestBidderAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "mint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "ataProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rentSysvar",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "withdrawWinningBidOpen",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "auctionAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "ownerAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "globalPool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                }
            ]
        },
        {
            "name": "reclaimItemOpen",
            "accounts": [
                {
                    "name": "auction",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "auctionAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "ownerAta",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "mint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "ataProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rentSysvar",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        }
    ],
    "accounts": [
        {
            "name": "OpenAuction",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "owner",
                        "type": "publicKey"
                    },
                    {
                        "name": "mint",
                        "type": "publicKey"
                    },
                    {
                        "name": "tokenMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "tokenAmount",
                        "type": "u64"
                    },
                    {
                        "name": "startTime",
                        "type": "u64"
                    },
                    {
                        "name": "endTime",
                        "type": "u64"
                    },
                    {
                        "name": "cancelled",
                        "type": "bool"
                    },
                    {
                        "name": "title",
                        "type": "string"
                    },
                    {
                        "name": "bidderCap",
                        "type": "u64"
                    },
                    {
                        "name": "bidders",
                        "type": {
                            "vec": "publicKey"
                        }
                    },
                    {
                        "name": "bids",
                        "type": {
                            "vec": "u64"
                        }
                    },
                    {
                        "name": "bidToken",
                        "type": {
                            "vec": "u64"
                        }
                    },
                    {
                        "name": "highestBidder",
                        "type": "publicKey"
                    },
                    {
                        "name": "highestBid",
                        "type": "u64"
                    },
                    {
                        "name": "highestToken",
                        "type": "u64"
                    },
                    {
                        "name": "bidFloor",
                        "type": "u64"
                    },
                    {
                        "name": "tokenFloor",
                        "type": "u64"
                    },
                    {
                        "name": "minBidIncrement",
                        "type": "u64"
                    },
                    {
                        "name": "minBidTokenIncrement",
                        "type": "u64"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "TitleOverflow",
            "msg": "Title must be less than 50 characters."
        },
        {
            "code": 6001,
            "name": "InvalidIncrement",
            "msg": "Minimum bid increment must be greater than 0."
        },
        {
            "code": 6002,
            "name": "InvalidStartTime",
            "msg": "Start time must be in the future and before end time."
        },
        {
            "code": 6003,
            "name": "InvalidEndTime",
            "msg": "End time must be after start time."
        },
        {
            "code": 6004,
            "name": "InvalidBidFloor",
            "msg": "Bid floor must be at least 1 lamport."
        },
        {
            "code": 6005,
            "name": "InvalidRevealPeriod",
            "msg": "Reveal period must end after the auction ends."
        },
        {
            "code": 6006,
            "name": "InvalidTokenAmount",
            "msg": "SPL token amount must be greater than 0."
        },
        {
            "code": 6007,
            "name": "UnderBidFloor",
            "msg": "Must bid higher than the floor."
        },
        {
            "code": 6008,
            "name": "InsufficientBid",
            "msg": "Must bid at least min_bid_increment higher than max_bid."
        },
        {
            "code": 6009,
            "name": "AuctionCancelled",
            "msg": "Auction is cancelled and only allows reclaiming past bids and the item."
        },
        {
            "code": 6010,
            "name": "BidBeforeStart",
            "msg": "Auction period has not yet begun."
        },
        {
            "code": 6011,
            "name": "BidAfterClose",
            "msg": "Auction period has elapsed."
        },
        {
            "code": 6012,
            "name": "BidderCapReached",
            "msg": "Maximum number of unique bidders has been reached."
        },
        {
            "code": 6013,
            "name": "OwnerCannotBid",
            "msg": "Owner cannot bid on auction."
        },
        {
            "code": 6014,
            "name": "AuctionNotOver",
            "msg": "Auction is not over."
        },
        {
            "code": 6015,
            "name": "NotBidder",
            "msg": "No previous bid associated with this key."
        },
        {
            "code": 6016,
            "name": "NoWinningBid",
            "msg": "No winning bid to withdraw."
        },
        {
            "code": 6017,
            "name": "WinnerCannotWithdrawBid",
            "msg": "Auction winner cannot withdraw their bid."
        },
        {
            "code": 6018,
            "name": "AlreadyWithdrewBid",
            "msg": "Winning bid has already been withdrawn."
        },
        {
            "code": 6019,
            "name": "DuplicateSealedBid",
            "msg": "Each key can only have one active sealed bid per auction."
        },
        {
            "code": 6020,
            "name": "MustSendSol",
            "msg": "Sealed bids must be accompanied by a non-zero amount of SOL."
        },
        {
            "code": 6021,
            "name": "RevealPeriodOver",
            "msg": "Reveal period has elapsed."
        },
        {
            "code": 6022,
            "name": "RevealPeriodNotOver",
            "msg": "Reveal period is not over."
        },
        {
            "code": 6023,
            "name": "HashMismatch",
            "msg": "Keccak256 of provided bid and nonce does not match the sealed bid hash."
        },
        {
            "code": 6024,
            "name": "CannotCancelRevealPeriod",
            "msg": "Cannot cancel auction during reveal period."
        },
        {
            "code": 6025,
            "name": "CannotCancelAfterClose",
            "msg": "Cannot cancel auction after it has ended."
        },
        {
            "code": 6026,
            "name": "InsufficientSol",
            "msg": "Sealed bid cannot be higher than escrowed SOL."
        }
    ]
};
