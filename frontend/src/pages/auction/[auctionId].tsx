import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import moment, { min } from "moment";
import { useRouter } from "next/router";
import { useEffect, useState } from "react"
import CopyAddress from "../../components/CopyAddress";
import Countdown from "../../components/Countdown";
import { errorAlertCenter } from "../../components/toastGroup";
import { ADMIN_LIST, SPL_TOKENS } from "../../config";
import { CancelOpenAuction, getDecimals, getOpenAuctionState, MakeOpenBid, ReclaimItemOpen, ReclaimOpenBid, WithdrawItemOpen, WithdrawWinningBidOpen } from "../../contexts/transaction-auction";
import { adminValidation, getNftMetaData } from "../../contexts/utils";

export default function AuctionItemPage(props: {
    startLoading: Function,
    closeLoading: Function
}) {
    const { startLoading, closeLoading } = props;
    const router = useRouter();
    const { auctionId } = router.query;
    const wallet = useWallet();

    const [loading, setLoading] = useState(false);
    // const [buttonLoading, setButtonLoading] = useState(false);
    const [nftName, setNftName] = useState("");
    const [nftDescription, setNftDescription] = useState("");
    const [bidPrice, setBidPrice] = useState<any>();
    const [splBidPrice, setSplBidPrice] = useState<any>();
    const [image, setImage] = useState("");
    const [title, setTitle] = useState<String | undefined>()
    const [startTime, setStartTime] = useState();
    const [endTime, setEndTime] = useState();
    const [floorPrice, setFloorPrice] = useState(0);
    const [splFloorPrice, setSplFloorPrice] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isBidder, setIsBidder] = useState(false);
    const [splMint, setSplMint] = useState(SPL_TOKENS[0].address);
    const [splName, setSplName] = useState("");
    const [minIncrement, setMinIncrement] = useState(0);
    const [splMinIncrement, setSplMinIncrement] = useState(0);
    const [highestBid, setHighestBid] = useState(0);
    const [highestBidder, setHighestBidder] = useState<any>();
    const [bidderCap, setBidderCap] = useState<number | undefined>();
    const [oldBids, setOldBids] = useState<number | undefined>();
    const [highestToken, setHighestToken] = useState(0);

    // creator withdraw winning bid
    const [isWithdrawed, setIsWithdrawed] = useState(false);

    const [bidders, setBidders] = useState<{
        address: string,
        sol: number,
        spl: number
    }[]>();

    const [isClaimed, setIsClaimed] = useState(false);
    const [decimal, setDecimal] = useState(0);

    const getNftDetail = async () => {
        if (auctionId === undefined) return
        const detail = await getOpenAuctionState(new PublicKey(auctionId));
        if (detail?.mint !== undefined) {
            const uri = await getNftMetaData(detail?.mint)
            await fetch(uri)
                .then(resp =>
                    resp.json()
                ).then((json) => {
                    setImage(json.image);
                    setNftName(json.name);
                    setNftDescription(json.description);
                })
        }
    }
    const getAuctionDetail = async () => {
        if (!wallet.publicKey) return;
        if (auctionId === undefined) return
        setLoading(true);
        const detail = await getOpenAuctionState(new PublicKey(auctionId))
        if (detail !== null) {
            const now = new Date().getTime();
            let start: any;
            let end: any;
            start = new Date(detail?.startTime.toNumber() * 1000 + 60000);
            end = new Date(detail?.endTime.toNumber() * 1000 + 60000);
            if (end < now && detail.tokenAmount.toNumber() === 0 && detail.bids.length !== 0) {
                setIsClaimed(true);
            }
            const tokenDecimal = await getDecimals(wallet.publicKey, detail.tokenMint);
            const tokenMint = detail.tokenMint.toBase58();
            setSplMint(tokenMint);
            console.log(detail)
            console.log(tokenDecimal, "==> tokenDecimal")
            if (tokenDecimal) {
                setFloorPrice(detail.bidFloor.toNumber() / LAMPORTS_PER_SOL)
                setHighestToken(detail.highestToken.toNumber() / tokenDecimal);
                setSplFloorPrice(detail.tokenFloor.toNumber() / tokenDecimal);
                setHighestBid(detail.highestBid.toNumber() / LAMPORTS_PER_SOL);
                setMinIncrement(detail.minBidIncrement.toNumber() / LAMPORTS_PER_SOL);
                setSplMinIncrement(detail.minBidTokenIncrement.toNumber() / tokenDecimal);
                if (detail.highestBid.toNumber() === 0) {
                    setBidPrice((detail.bidFloor.toNumber() + detail.minBidIncrement.toNumber()) / LAMPORTS_PER_SOL)
                    setSplBidPrice((detail.tokenFloor.toNumber() + detail.minBidTokenIncrement.toNumber()) / tokenDecimal);
                } else {
                    setBidPrice((detail.highestBid.toNumber() + detail.minBidIncrement.toNumber()) / LAMPORTS_PER_SOL)
                    setSplBidPrice((detail.highestToken.toNumber() + detail.minBidTokenIncrement.toNumber()) / tokenDecimal);
                }

                let bidderList: {
                    address: string,
                    sol: number,
                    spl: number
                }[] = [];
                for (let i = 0; i < detail.bidders.length; i++) {
                    if (detail.bidders[i].toBase58() !== detail.highestBidder.toBase58())
                        bidderList.push({
                            address: detail.bidders[i].toBase58(),
                            sol: detail.bids[i].toNumber() / LAMPORTS_PER_SOL,
                            spl: detail.bidToken[i].toNumber() / tokenDecimal
                        });
                    if (detail.bidders[i].toBase58() === detail.highestBidder.toBase58() && detail.bids[i].toNumber() === 0) {
                        setIsWithdrawed(true);
                    }
                    if (detail.bidders[i].toBase58() === wallet.publicKey.toBase58() && detail.highestBidder.toBase58() !== wallet.publicKey.toBase58()) {
                        setIsBidder(true);
                    }
                }
                setBidders(bidderList);
            }
            const tokenAmount = detail.tokenAmount.toNumber();
            setIsClaimed(tokenAmount === 0);
            const tokenName = SPL_TOKENS.find((x) => x.address === tokenMint)?.tokenName;



            if (tokenName)
                setSplName(tokenName);
            setStartTime(start);
            setEndTime(end);
            setTitle(detail?.title);
            setHighestBidder(detail.highestBidder.toBase58());
            setBidderCap(detail.bidderCap.toNumber());
            setOldBids(detail.bids.length);
            if (decimal) {
                setBidPrice(floorPrice + minIncrement)
                setDecimal(decimal);
            }
        }
        setLoading(false);
    }

    const handleCancel = async () => {
        if (auctionId === undefined) return;
        try {
            await CancelOpenAuction(
                wallet,
                new PublicKey(auctionId),
                () => startLoading(),
                () => closeLoading(),
                () => router.push("/create")
            )
        } catch (error) {

        }
    }

    const handleReclaimNFT = async () => {
        if (auctionId === undefined) return;
        try {
            await ReclaimItemOpen(
                wallet,
                new PublicKey(auctionId),
                () => startLoading(),
                () => closeLoading(),
                () => router.push("/auction")
            );
        } catch (error) {
            console.log(error)
        }
    }

    const handleReclaimBid = async () => {
        if (auctionId === undefined) return;
        try {
            await ReclaimOpenBid(
                wallet,
                new PublicKey(auctionId),
                new PublicKey(splMint),
                () => startLoading(),
                () => closeLoading(),
                () => router.push("/auction")
            );
        } catch (error) {
            console.log(error)
        }
    }

    const handleClaimNFT = async () => {
        if (auctionId === undefined) return;
        try {
            await WithdrawItemOpen(
                wallet,
                new PublicKey(auctionId),
                () => startLoading(),
                () => closeLoading(),
                () => router.push("/auction")
            );
        } catch (error) {
            console.log(error)
        }
    }

    const handleWithdrawWinningBid = async () => {
        if (auctionId === undefined) return;
        try {
            await WithdrawWinningBidOpen(
                wallet,
                new PublicKey(auctionId),
                new PublicKey(splMint),
                () => startLoading(),
                () => closeLoading(),
                () => router.push("/auction")
            );
        } catch (error) {
            console.log(error)
        }
    }

    const handleMakeBid = async () => {
        if (auctionId === undefined) return;
        if (bidPrice < highestBid + minIncrement) {
            errorAlertCenter(`The price must to be bigger than ${highestBid + minIncrement}`)
            return
        }
        if (bidPrice < floorPrice) {
            errorAlertCenter(`The price must to be bigger than floor price.`)
            return
        }
        if (bidderCap === undefined || oldBids === undefined) return
        if (oldBids > bidderCap - 1) {
            errorAlertCenter(`You can't bid`)
            return
        }
        try {
            await MakeOpenBid(
                wallet,
                new PublicKey(auctionId),
                bidPrice,
                splBidPrice,
                new PublicKey(splMint),
                () => startLoading(),
                () => closeLoading(),
                () => getAuctionDetail()
            )
        } catch (error) {
            console.log(error)
        }
    }


    const fetchAuctionData = () => {
        setInterval(async () => {
            getAuctionDetail()
        }, 10000)
    }

    useEffect(() => {
        if (auctionId !== undefined) {
            getNftDetail();
            getAuctionDetail();
            fetchAuctionData();
        }
        if (wallet.publicKey !== null) {
            setIsAdmin(adminValidation(wallet.publicKey))
        } else {
            setIsAdmin(false)
        }
        // eslint-disable-next-line
    }, [wallet.connected, router]);

    return (
        <main>
            <div className="container">
                <div className="create-content">
                    <div className="nft-info">
                        <div className="media">
                            {/* eslint-disable-next-line */}
                            <img
                                src={image}
                                alt=""
                            />
                        </div>
                        <div className="info-item">
                            <label>Name: </label>
                            <h2>{nftName}</h2>
                        </div>
                        <div className="info-item">
                            <label>Description: </label>
                            <p className="description">{nftDescription}</p>
                        </div>
                    </div>
                    {!isClaimed ?
                        <>
                            <div className="create-panel">
                                <div className="row">
                                    <div className="col-12">
                                        <div className="auction-info-item">
                                            <h2>{title}</h2>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-half">
                                        <div className="auction-info-item">
                                            <label>Highest Bid</label>
                                            <p>
                                                {highestBid} ◎
                                                {splFloorPrice !== 0 &&
                                                    <span>
                                                        &nbsp;+&nbsp;{highestToken} {splName}
                                                    </span>
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-half">
                                        <div className="auction-info-item">
                                            <label>Bidder Cap</label>
                                            <p>{oldBids} / {bidderCap}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-half">
                                        <div className="auction-info-item">
                                            <label>Floor Price</label>
                                            <p>{floorPrice} ◎
                                                {splFloorPrice !== 0 &&
                                                    <span>
                                                        &nbsp;+&nbsp;{splFloorPrice} {splName}
                                                    </span>
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-half">
                                        <div className="auction-info-item">
                                            <label>Min Increment</label>
                                            <p>{minIncrement} ◎
                                                {(splFloorPrice !== 0 || splMinIncrement !== 0) &&
                                                    <span>
                                                        ,&nbsp;{splMinIncrement} {splName}
                                                    </span>
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {startTime !== undefined && endTime !== undefined &&
                                    <>
                                        <div className="row">
                                            <div className="col-half">
                                                <div className="auction-info-item">
                                                    <label>Start time</label>
                                                    {new Date() < startTime ?
                                                        <p>
                                                            <Countdown endDateTime={startTime} update={() => getAuctionDetail()} />
                                                        </p>
                                                        :
                                                        <p style={{ color: "#00000085", fontWeight: "bold" }}>
                                                            {moment(startTime).format('DD/MM/YYYY HH:mm')}
                                                        </p>
                                                    }
                                                </div>
                                            </div>
                                            <div className="col-half">
                                                <div className="auction-info-item">
                                                    <label>End time</label>
                                                    {new Date() < endTime ?
                                                        <p>
                                                            <Countdown endDateTime={endTime} update={() => getAuctionDetail()} />
                                                        </p>
                                                        :
                                                        <p style={{ color: "#00000085", fontWeight: "bold" }}>
                                                            closed
                                                        </p>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        {
                                            new Date() > startTime && new Date() < endTime &&
                                            <>
                                                <div className="row">
                                                    <div className="col-half">
                                                        <div className="form-control">
                                                            <label>Your bid (SOL)</label>
                                                            {/* <input
                                                                value={bidPrice}
                                                                onChange={(e) => setBidPrice(e.target.value)}
                                                                placeholder="SOL"
                                                                type="number"
                                                                min={inputMin}
                                                            /> */}
                                                            <p className="req-price">{bidPrice} SOL</p>
                                                        </div>
                                                    </div>
                                                    {splFloorPrice !== 0 &&
                                                        <div className="col-half">
                                                            <div className="form-control">
                                                                <label>Your bid ({splName})</label>
                                                                {/* <input
                                                                    value={splBidPrice}
                                                                    onChange={(e) => setSplBidPrice(e.target.value)}
                                                                    placeholder={splName}
                                                                    type="number"
                                                                    min={splInputMin}
                                                                /> */}
                                                                <p className="req-price">{splBidPrice} {splName}</p>
                                                            </div>
                                                        </div>
                                                    }
                                                </div>
                                                {!isAdmin &&
                                                    <div className="row">
                                                        <div className="col-half">
                                                            <button className="btn-create-aution mt-10" style={{ marginBottom: 20 }} onClick={() => handleMakeBid()}>
                                                                Place Bid
                                                            </button>
                                                        </div>
                                                    </div>
                                                }
                                            </>
                                        }
                                        {
                                            new Date() > endTime &&
                                            <div className="row">
                                                <div className="col-half">
                                                    {wallet.publicKey === highestBidder ?
                                                        <button className="btn-create-aution mt-10">
                                                            Claim NFT
                                                        </button>
                                                        :
                                                        (
                                                            (ADMIN_LIST.findIndex((address) => address.address == wallet.publicKey?.toBase58().toString()) != -1) ?
                                                                <button className="btn-create-aution mt-10" onClick={() => handleReclaimNFT()}>
                                                                    Reclaim NFT
                                                                </button>
                                                                :
                                                                (
                                                                    isBidder ?
                                                                        <button className="btn-cancel-aution mt-10" style={{ marginBottom: 20 }} onClick={() => handleReclaimBid()}>
                                                                            Reclaim bid
                                                                        </button>
                                                                        :
                                                                        <span></span>
                                                                )
                                                        )
                                                    }
                                                </div>
                                            </div>
                                        }
                                        {new Date() > endTime && highestBidder === wallet.publicKey?.toBase58() && !isAdmin &&
                                            <div className="row">
                                                <div className="col-half">
                                                    <button className="btn-create-aution mt-20" onClick={() => handleClaimNFT()}>
                                                        Claim NFT
                                                    </button>
                                                </div>
                                            </div>
                                        }
                                        {
                                            new Date() < endTime && (ADMIN_LIST.findIndex((address) => address.address == wallet.publicKey?.toBase58().toString()) != -1) &&
                                            <div className="row">
                                                <div className="col-half">
                                                    <button className="btn-cancel-aution mt-20" onClick={() => handleCancel()}>
                                                        Cancel Auction
                                                    </button>
                                                </div>
                                            </div>
                                        }
                                    </>
                                }
                            </div>
                        </>
                        :
                        <>
                            <div className="create-panel">
                                <div className="row">
                                    <div className="col-12">
                                        <div className="auction-info-item">
                                            <h2>{title}</h2>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-half">
                                        <div className="auction-info-item">
                                            <label>Winning Bid</label>
                                            <p>
                                                {highestBid} ◎
                                                {(splFloorPrice !== 0 || splMinIncrement !== 0) &&
                                                    <span>
                                                        &nbsp;+&nbsp;{highestToken} {splName}
                                                    </span>
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-half">
                                        <div className="auction-info-item">
                                            <label>Bidder Cap</label>
                                            <p>{oldBids} / {bidderCap}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-half">
                                        <div className="auction-info-item">
                                            <label>Floor Price</label>
                                            <p>{floorPrice} ◎
                                                {(splFloorPrice !== 0 || splMinIncrement !== 0) &&
                                                    <span>
                                                        &nbsp;+&nbsp;{splFloorPrice} {splName}
                                                    </span>
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-half">
                                        <div className="auction-info-item">
                                            <label>Min Increment</label>
                                            <p>{minIncrement} ◎
                                                {(splFloorPrice !== 0 || splMinIncrement !== 0) &&
                                                    <span>
                                                        ,&nbsp;{splMinIncrement} {splName}
                                                    </span>
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div style={{ paddingLeft: 10 }}>
                                        <div className="auction-info-item">
                                            <label>Winning bidder</label>
                                            {wallet.publicKey?.toBase58() === highestBidder ?
                                                <p style={{ color: "#f9cd38" }}>YOU WON!</p>
                                                :
                                                (
                                                    highestBidder &&
                                                    <CopyAddress address={highestBidder} />
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-half">
                                        <div className="auction-info-item">
                                            {(ADMIN_LIST.findIndex((address) => address.address == wallet.publicKey?.toBase58().toString()) != -1) && !isWithdrawed &&
                                                <button className="btn-create-aution mt-20" onClick={() => handleWithdrawWinningBid()}>
                                                    Withdraw winning bid
                                                </button>
                                            }
                                        </div>
                                    </div>
                                </div>

                                {
                                    isBidder &&
                                    <div className="row">
                                        <div className="col-half">
                                            <div className="auction-info-item">
                                                <button className="btn-cancel-aution mt-10" style={{ marginBottom: 20 }} onClick={() => handleReclaimBid()}>
                                                    Reclaim bid
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                }
                                {bidders && bidders.length !== 0 &&
                                    <div className="">
                                        <div className="auction-info-item">
                                            <label>Other Bidders</label>
                                            <table className="bidder-table">
                                                <thead>
                                                    <tr>
                                                        <th align="left">Address</th>
                                                        {/* <th>SOL</th>
                                                        {(splFloorPrice !== 0 || splMinIncrement !== 0) &&
                                                            <th>{splName}</th>
                                                        } */}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bidders.map((item: any, key: number) => (
                                                        <tr key={key}>
                                                            <td>
                                                                <CopyAddress address={item.address} />
                                                            </td>
                                                            {/* <td width={"20%"} align="center">
                                                                {item.sol}
                                                            </td>
                                                            {(splFloorPrice !== 0 || splMinIncrement !== 0) &&
                                                                <td width={"20%"} align="center">
                                                                    {item.spl}
                                                                </td>
                                                            } */}
                                                        </tr>

                                                    ))
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                }
                            </div>
                        </>
                    }
                </div>
            </div>
        </main>
    )
}
