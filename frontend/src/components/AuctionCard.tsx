import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { adminValidation, getNftMetaData } from "../contexts/utils";
import HashLoader from "react-spinners/HashLoader";
import { useRouter } from "next/router";
import moment from "moment";
import { getDecimals, getOpenAuctionState, ReclaimItemOpen } from "../contexts/transaction-auction";
import { SPL_TOKENS } from "../config";

export default function AuctionCard(props: {
    auctionId: string
}) {

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [buttonLoading, setButtonLoading] = useState(false);
    const [isCanceled, setIsCanceled] = useState<any>(false);
    const [image, setImage] = useState("");
    const [isClaimed, setIsClaimed] = useState(false);
    const [title, setTitle] = useState<String | undefined>();
    const [startTime, setStartTime] = useState();
    const [isClosed, setIsClosed] = useState(false);
    const [floorPrice, setFloorPrice] = useState(0);
    const [splFloorPrice, setSplFloorPrice] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [tokenAmount, setTokenAmount] = useState(0);
    const [splName, setSplName] = useState("");
    const [highestBid, setHighestBid] = useState(0);
    const [splHighestBid, setSplHighestBid] = useState(0);
    const [splMint, setSplMint] = useState(SPL_TOKENS[0].address);
    const wallet = useWallet();
    const getAuctionDetail = async () => {
        setLoading(true);
        const detail = await getOpenAuctionState(new PublicKey(props.auctionId));
        console.log(detail)
        if (detail !== null) {
            if (detail?.mint !== undefined) {
                const uri = await getNftMetaData(detail?.mint)
                await fetch(uri)
                    .then(resp =>
                        resp.json()
                    ).then((json) => {
                        setImage(json.image)
                    })
            }
            if (!wallet.publicKey) return;
            const tokenDecimal = await getDecimals(wallet.publicKey, detail.tokenMint);
            const tokenMint = detail.tokenMint.toBase58();
            setSplMint(tokenMint)
            const tokenName = SPL_TOKENS.find((x) => x.address === tokenMint)?.tokenName;
            if (tokenName)
                setSplName(tokenName);
            const now = new Date().getTime();
            let start: any;
            let end: any;
            start = new Date(detail?.startTime.toNumber() * 1000 + 60000)
            end = new Date(detail?.endTime.toNumber() * 1000 + 60000)
            if (end < now && detail.tokenAmount.toNumber() === 0 && detail.bids.length !== 0) {
                setIsClaimed(true);
            }

            setStartTime(start);
            setIsClosed(end < now);
            setTitle(detail?.title);
            setIsCanceled(detail.cancelled);
            setHighestBid(detail.highestBid.toNumber() / LAMPORTS_PER_SOL);
            if (tokenDecimal) {
                setSplFloorPrice(detail.tokenFloor.toNumber() / tokenDecimal);
                setSplHighestBid(detail.highestToken.toNumber() / tokenDecimal);
            }
            setFloorPrice(detail.bidFloor.toNumber() / LAMPORTS_PER_SOL);
            setTokenAmount(detail.tokenAmount.toNumber());
        }
        setLoading(false);
    }
    const handleReclaim = async () => {
        try {
            await ReclaimItemOpen(
                wallet,
                new PublicKey(props.auctionId),
                () => setButtonLoading(true),
                () => setButtonLoading(false),
                () => getAuctionDetail()
            );
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getAuctionDetail();
        if (wallet.publicKey !== null) {
            setIsAdmin(adminValidation(wallet.publicKey))
        }
        // eslint-disable-next-line
    }, [wallet.connected]);

    // for image layout
    const cardRef: any = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        if (cardRef.current) {
            setDimensions({
                width: cardRef.current.offsetWidth,
                height: cardRef.current.offsetHeight
            });
        }
    }, []);


    return (
        <div className="auction-card">
            {/* eslint-disable-next-line */}
            <div className="media" ref={cardRef}>
                {/* eslint-disable-next-line */}
                <img
                    src={image}
                    alt=""
                    style={{
                        filter: `${isClosed ? "grayscale(1)" : "none"}`,
                        height: dimensions.width
                    }}
                />
            </div>
            <p className="card-title">{title}</p>
            {isClosed ?
                <div className="display-center flex-column auction-card-detail" style={{ minHeight: 150 }}>
                    {highestBid > floorPrice ?
                        <>
                            <p className="card-winning-title ">Winning Bid</p>
                            <p className="card-winning">{highestBid}&nbsp;
                                {splFloorPrice !== 0 &&
                                    <span>
                                        &nbsp;+&nbsp;{splHighestBid} {splName}
                                    </span>
                                }</p>
                        </>
                        :
                        <p style={{ fontSize: 20 }}>No bids</p>
                    }
                    <div className="auction-endtime">
                        {!loading &&
                            <p className="close-time">
                                AUCTION CLOSED
                            </p>
                        }
                    </div>
                    {highestBid > floorPrice &&
                        <button className="btn-primary" onClick={() => router.push(`auction/${props.auctionId}`)}>
                            View Winners
                        </button>
                    }
                    {
                        !isCanceled && !isClaimed && highestBid <= floorPrice && isAdmin && tokenAmount !== 0 &&
                        <button className="create-raffle" disabled={buttonLoading} onClick={() => handleReclaim()}>
                            {buttonLoading ?
                                <HashLoader size={20} color="#fff" />
                                :
                                <>Reclaim NFT</>
                            }
                        </button>
                    }
                </div>
                :
                <>
                    <p className="card-floor">
                        <span style={{ fontSize: 18, textTransform: "uppercase", color: "#000" }}>Floor Price:</span><br />
                        <span>{floorPrice} ◎</span>
                        {splFloorPrice !== 0 &&
                            <>
                                + {splFloorPrice} {splName}
                            </>
                        }
                    </p>

                    {startTime !== undefined && !loading &&
                        new Date() < startTime ?
                        <p className="close-countdown" style={{ padding: '30px 0' }}>
                            Comming Soon
                        </p>
                        :
                        <>
                            <p style={{ marginTop: 10 }}>Started Time</p>
                            <p style={{ fontWeight: "bold", marginBottom: 20 }}>
                                {moment(startTime).format('DD/MM/YYYY HH:mm')}
                            </p>
                        </>
                    }
                    <button className="btn-primary" onClick={() => router.push(`auction/${props.auctionId}`)}>
                        View Auction
                    </button>
                </>
            }
        </div >
    )
}