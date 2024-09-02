import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import Skeleton from "@mui/material/Skeleton";
import ClipLoader from "react-spinners/ClipLoader";
import MoonLoader from "react-spinners/MoonLoader";
import { useWallet } from "@solana/wallet-adapter-react";
import moment from "moment";
import { adminValidate, buyTicket, claimReward, getNftMetaData, getRaffleDataByMintAddress, getRaffleStateByAddress, revealWinner, withdrawNft } from "../../contexts/transaction-raffle";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Countdown from "react-countdown";
import { HashLoader } from "react-spinners";
import Link from "next/link";
import { useRouter } from "next/router";
import { EMPTY_ADDRESS, SPL_TOKENS } from "../../config";
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { ClickAwayListener } from "@mui/material";

export default function RaffleItem() {
    const router = useRouter();
    const { raffleKey } = router.query;
    const [image, setImage] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState(1);
    const [endTime, setEndTime] = useState("");

    const [price, setPrice] = useState("");
    const [maxTickets, setMaxTickets] = useState(0);
    const [count, setCount] = useState(0);
    const [payType, setPayType] = useState("");
    const [winner, setWinner] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [unique, setUnique] = useState(0);
    const [isClaimed, setIsClaimed] = useState(false);
    const [myTickets, setMyTickets] = useState();
    const [minePanel, setMinePanel] = useState(false);
    const [nftMint, setNftMint] = useState("");
    const [withdrawed, setWithdrawed] = useState(0);
    const [winners, setWinners] = useState([]);

    // 0: endTime < now                : buy tickets
    // endTime >= now
    // 1:     count === 0   
    // 2:         isAdmin             : withdraw NFT
    // 3:         !isAdmin            : back to raffle page
    // 4:     count !== 0
    // 5:         winner === ""       : reveal winner
    // 6:         winner !== ""
    // 7:             isWinner        : claim NFT
    // 8:             !isWinner       : back to raffle page

    const handleTickets = (e) => {
        setAmount(e)
    }

    const onInc = () => {
        let tick = amount;
        tick++;
        setAmount(tick)
    }

    const onDec = () => {
        if (amount > 1) {
            let tick = amount;
            tick--;
            setAmount(tick)
        }
    }

    const wallet = useWallet();

    const [buttonLoading, setButtonLoading] = useState(false);

    const getNFTdetail = async () => {
        setLoading(true);
        const raffleDetail = await getRaffleStateByAddress(new PublicKey(raffleKey));
        if (raffleDetail) {
            console.log(raffleDetail, "raffledetail");
            const uri = await getNftMetaData(raffleDetail.nftMint);
            setNftMint(raffleDetail.nftMint.toBase58());
            await fetch(uri)
                .then(resp =>
                    resp.json()
                ).catch((error) => {
                    console.log(error)
                })
                .then((json) => {
                    setImage(json.image);
                    setName(json.name);
                })

            const tokenMintFirst = raffleDetail.tokenMintFirst.toBase58();
            const tokenMintSecond = raffleDetail.tokenMintSecond.toBase58();
            setWithdrawed(raffleDetail.withdrawed.toNumber());

            let firstName = "";
            let secondName = "";
            let firstDecimal = 1;
            let secondDecimal = 1;
            for (let item of SPL_TOKENS) {
                if (item.address === tokenMintFirst) {
                    firstName = item.tokenName;
                    firstDecimal = item.decimal;
                } else if (item.address === tokenMintSecond) {
                    secondName = item.tokenName;
                    secondDecimal = item.decimal;
                }
            }

            const solPrice = raffleDetail.ticketPriceSol.toNumber() / LAMPORTS_PER_SOL;
            const ticketPriceFirst = raffleDetail.ticketPriceFirst.toNumber() / firstDecimal;
            const ticketPriceSecond = raffleDetail.ticketPriceSecond.toNumber() / secondDecimal;

            let winnerList = [];
            for (let i = 0; i < raffleDetail.winnerCount.toNumber(); i++) {
                if (raffleDetail.winners[i].toBase58() !== EMPTY_ADDRESS) {
                    winnerList.push({
                        address: raffleDetail.winners[i].toBase58(),
                        index: raffleDetail.winnerIndexes[i].toNumber()
                    }
                    )
                }
            }
            winnerList.sort(function (a, b) {
                return parseFloat(a.index) - parseFloat(b.index);
            });
            setWinners(winnerList)

            if (solPrice !== 0 && ticketPriceFirst !== 0) {
                setPayType(`${solPrice} SOL  +  ${ticketPriceFirst} ${firstName}`)
            } else if (ticketPriceSecond !== 0 && ticketPriceFirst !== 0) {
                setPayType(`${ticketPriceFirst} ${firstName}  +  ${ticketPriceSecond} ${secondName}`)
            } else if (solPrice !== 0 && ticketPriceFirst === 0 && ticketPriceSecond === 0) {
                setPayType(`${solPrice} SOL`)
            } else if (solPrice === 0 && ticketPriceFirst !== 0) {
                setPayType(`${ticketPriceFirst} ${firstName}`)
            }

            const endTimes = raffleDetail.endTimestamp.toNumber() * 1000;
            setMaxTickets(raffleDetail.maxEntrants.toNumber());
            const countTickets = raffleDetail.count.toNumber();
            setCount(countTickets);
            let mine = [];
            for (let i = 0; i < countTickets; i++) {
                if (raffleDetail.entrants[i].toBase58() === wallet.publicKey.toBase58()) {
                    mine.push({
                        index: i + 1
                    })
                }
            }
            setMyTickets(mine);
            setUnique(raffleDetail.noRepeat.toNumber());
            setEndTime(moment(endTimes).format());
        }
        setLoading(false);
    }

    const handleBuy = async () => {
        await buyTicket(
            wallet,
            new PublicKey(raffleKey),
            amount,
            () => setButtonLoading(true),
            () => setButtonLoading(false),
            () => getNFTdetail()
        );
    }
    const handleWithdrawNft = async () => {
        await withdrawNft(
            wallet,
            new PublicKey(raffleKey),
            () => setButtonLoading(true),
            () => setButtonLoading(false),
            () => router.push("/raffle")
        );
    }
    const handleRevealWinner = async () => {
        await revealWinner(
            wallet,
            new PublicKey(raffleKey),
            () => setButtonLoading(true),
            () => setButtonLoading(false),
            () => getNFTdetail()
        );
    }
    const handleClaim = async () => {
        await claimReward(
            wallet,
            new PublicKey(raffleKey),
            () => setButtonLoading(true),
            () => setButtonLoading(false),
            () => getNFTdetail()
        );
    }

    useEffect(() => {
        setLoading(true);
        if (wallet.publicKey !== null) {
            setIsAdmin(adminValidate(wallet));
            getNFTdetail();
        }
        // eslint-disable-next-line
    }, [wallet.connected])
    return (
        <div className="new-raffle">
            <div className="container">
                <div className="new-raffle-content">
                    {loading ?
                        <Skeleton variant="rectangular" width={320} height={320} style={{ marginRight: "auto", marginLeft: "auto", borderRadius: 12 }} />
                        :
                        <div className="media">
                            {image !== "" &&
                                // eslint-disable-next-line
                                <img
                                    src={image}
                                    alt=""
                                />
                            }
                        </div>
                    }

                    <p className="nft-name">
                        {loading ?
                            <Skeleton variant="rectangular" width={360} height={45} style={{ marginRight: "auto", marginLeft: "auto", borderRadius: 6 }} />
                            :
                            <>{name}</>
                        }
                    </p>
                    <p className="mint-address">
                        {loading ?
                            <Skeleton variant="rectangular" width={300} height={21} style={{ marginRight: "auto", marginLeft: "auto", borderRadius: 6 }} />
                            :
                            <>
                                {image !== "" && <>{nftMint}</>}
                            </>
                        }
                    </p>
                    <div className="raffle-control">
                        {!loading ?
                            (
                                moment(endTime).format() > moment(new Date()).format() ?
                                    //buy tickets
                                    <>
                                        <div className="raffle-detail">
                                            <div className="raffle-detail-item">
                                                <label>Tickets sold</label>
                                                <p>{count}</p>
                                            </div>
                                            <div className="raffle-detail-item">
                                                <label>Unique wallets</label>
                                                <p>{unique}</p>
                                            </div>
                                            <div className="raffle-detail-item">
                                                <label>
                                                    <span>
                                                        My tickets
                                                    </span>
                                                    {myTickets && myTickets.length !== 0 &&
                                                        <button onClick={() => setMinePanel(true)}>
                                                            {!minePanel ?
                                                                <RemoveRedEyeIcon sx={{ fontSize: 16 }} />
                                                                :
                                                                <VisibilityOffIcon sx={{ fontSize: 16 }} />
                                                            }
                                                        </button>
                                                    }
                                                </label>
                                                <p>{myTickets && myTickets.length}</p>
                                                {minePanel &&
                                                    <ClickAwayListener onClickAway={() => setMinePanel(false)}>
                                                        <ul>
                                                            {myTickets && myTickets.length !== 0 && myTickets.map((item, key) => (
                                                                <li key={key}>
                                                                    #&nbsp;{item.index}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </ClickAwayListener>
                                                }
                                            </div>
                                        </div>
                                        <div className="buy-ticket-item">
                                            <label className="form-label">Tickets price</label>
                                            <p>{price.toLocaleString()}&nbsp;{payType}</p>
                                        </div>
                                        <div className="buy-ticket-item">
                                            <label className="form-label">End time</label>
                                            {endTime !== ""
                                                &&
                                                <Countdown date={endTime} />
                                            }
                                        </div>
                                        <label className="form-label">Tickets {`(${count} / ${maxTickets})`}</label>
                                        <div className="tickets-input">
                                            <button onClick={() => onDec()}>
                                                <RemoveRoundedIcon />
                                            </button>
                                            <input
                                                value={amount}
                                                onChange={(e) => handleTickets(e.target.value)}
                                            />
                                            <button onClick={() => onInc()}>
                                                <AddRoundedIcon />
                                            </button>
                                        </div>

                                        <div className="buy-ticket-item">
                                            <button className="btn-create" disabled={buttonLoading} onClick={() => handleBuy()}>
                                                {!buttonLoading ?
                                                    <>
                                                        Buy {amount} ticket(s)
                                                    </>
                                                    :
                                                    <ClipLoader color="#fff" size={20} />
                                                }
                                            </button>
                                        </div>
                                    </>
                                    :
                                    (
                                        count === 0 ?
                                            <>
                                                <p className="no-ticket-alert">Raffle is over. Not a single ticket was sold.</p>
                                                <div className="buy-ticket-item">
                                                    {isAdmin ?
                                                        // withdraw NFT
                                                        (
                                                            withdrawed !== 1 ?

                                                                <button className="btn-create" disabled={buttonLoading} onClick={() => handleWithdrawNft()}>
                                                                    {!buttonLoading ?
                                                                        <>
                                                                            withdraw nft
                                                                        </>
                                                                        :
                                                                        <ClipLoader color="#fff" size={20} />
                                                                    }
                                                                </button>
                                                                :

                                                                <Link href="/raffle">
                                                                    <a className="btn-create" style={{ marginTop: 20 }}>
                                                                        Back to raffle list
                                                                    </a>
                                                                </Link>
                                                        )
                                                        :
                                                        // back to raffle page
                                                        <Link href="/raffle">
                                                            <a className="btn-create" style={{ marginTop: 20 }}>
                                                                Back to raffle list
                                                            </a>
                                                        </Link>
                                                    }
                                                </div>

                                            </>
                                            :
                                            (
                                                winners.length === 0 ?
                                                    // reveal winner
                                                    <>
                                                        <p className="no-ticket-alert">
                                                            Can&#39;t see a winner right now.
                                                            You must pay a transaction fee to view it.
                                                            Do you want to continue?
                                                        </p>
                                                        <div className="buy-ticket-item">
                                                            <button className="btn-create" disabled={buttonLoading} onClick={() => handleRevealWinner()}>
                                                                {!buttonLoading ?
                                                                    <>
                                                                        view winner
                                                                    </>
                                                                    :
                                                                    <ClipLoader color="#fff" size={20} />
                                                                }
                                                            </button>
                                                        </div>
                                                    </>
                                                    :
                                                    <>
                                                        <label>Winners:</label>
                                                        {winners && winners.length !== 0 && winners.map((item, key) => (
                                                            <div className="winner-show" key={key}>
                                                                <p className="raffle-winner">{item.address}</p>
                                                                <p className="raffle-winner">#{item.index}</p>
                                                            </div>
                                                        ))}
                                                        {/* <div className="buy-ticket-item">
                                                            {
                                                                wallet.publicKey !== null && winner.address === wallet.publicKey.toBase58() ?
                                                                    // claim NFT
                                                                    !isClaimed &&
                                                                    <button className="btn-create" disabled={buttonLoading} onClick={() => handleClaim()} style={{ marginTop: 20 }}>
                                                                        {!buttonLoading ?
                                                                            <>
                                                                                Claim NFT
                                                                            </>
                                                                            :
                                                                            <ClipLoader color="#fff" size={20} />
                                                                        }
                                                                    </button>
                                                                    :
                                                                    // back to raffle page
                                                                    <Link href="/raffle" >
                                                                        <a className="btn-create" style={{ marginTop: 20 }}>
                                                                            Back to raffle list
                                                                        </a>
                                                                    </Link>
                                                            }
                                                        </div> */}
                                                    </>
                                            )
                                    )
                            )
                            :
                            <div className="page-loader">
                                <MoonLoader size={60} />
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div >
    )
}