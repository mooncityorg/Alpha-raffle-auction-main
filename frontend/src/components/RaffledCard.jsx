import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import CircleIcon from '@mui/icons-material/Circle';
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import moment from "moment";
import Countdown from "react-countdown";
import { useRouter } from "next/router";
import { getNftMetaData, getRaffleStateByAddress } from "../contexts/transaction-raffle";
import { PublicKey } from "@solana/web3.js";

export default function RaffledCard({
    raffleKey,
    endTimestamp,
    ...props
}) {

    const [endTime, setEndTime] = useState("");
    const router = useRouter();
    const [image, setImage] = useState("");
    const [nftName, setNftName] = useState("");
    const [count, setCount] = useState(0);
    const [maxEntrants, setMaxEntrants] = useState(0);

    const getNFTDetail = async () => {
        const nftData = await getRaffleStateByAddress(raffleKey);
        console.log(nftData, "===> nft Data");
        if (nftData) {
            setCount(nftData.count.toNumber());
            setMaxEntrants(nftData.maxEntrants.toNumber());
            try {
                const uri = await getNftMetaData(nftData.nftMint);
                await fetch(uri)
                    .then(resp =>
                        resp.json()
                    ).catch((error) => {
                        console.log(error)
                    })
                    .then((json) => {
                        setImage(json.image);
                        setNftName(json.name);
                    })
            } catch (error) {
                console.log(error)
            }
        }
    }
    useEffect(() => {
        getNFTDetail();
        setEndTime(moment(endTimestamp * 1000).format())
        // eslint-disable-next-line
    }, [])

    // for image layout
    const cardRef = useRef(null);
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
        <div className="raffled-card">
            {
                endTime !== "" &&
                    moment(new Date()).format() < moment(endTimestamp * 1000).format() ?
                    <div className="media" ref={cardRef}>
                        {/* eslint-disable-next-line */}
                        <img
                            src={image}
                            style={{ height: dimensions.width }}
                            alt={`${nftName}`}
                        />
                    </div>
                    :
                    <div className="media closed" ref={cardRef}>
                        {/* eslint-disable-next-line */}
                        <img
                            src={image}
                            style={{ height: dimensions.width }}
                            alt={`${nftName}`}
                        />
                    </div>
            }
            <div className="raffled-card-content">
                <p className="nft-name">
                    {nftName}
                </p>
                {
                    endTime !== "" &&
                        moment(new Date()).format() < moment(endTimestamp * 1000).format() ?
                        <>
                            <div className="card-tickets">
                                <ConfirmationNumberIcon sx={{ fill: "#3eff3e", marginRight: 1 }} />
                                {`${count} / ${maxEntrants}`}
                            </div>
                            <div className="endtime-countdown">
                                <CircleIcon sx={{ fill: "#3eff3e", fontSize: 12 }} />
                                <p>Ends in: </p>
                                <Countdown date={endTime} />
                            </div>
                            <div className="join-raffle">
                                <button onClick={() => router.push(`/raffle/${raffleKey}`)} className="btn-join">
                                    Join Raffle
                                </button>
                            </div>
                        </>
                        :
                        <>
                            <div className="card-tickets closed">
                                <ConfirmationNumberIcon sx={{ fill: "#aaa", marginRight: 1 }} />
                                {`${count} / ${maxEntrants}`}
                            </div>
                            <div className="endtime-countdown closed">
                                <CircleIcon sx={{ fill: "#aaa", fontSize: 12 }} />
                                <p>Raffle Closed </p>
                            </div>
                            <div className="join-raffle">
                                <button onClick={() => router.push(`/raffle/${raffleKey}`)} className="btn-join closed">
                                    Viewer Winners
                                </button>
                            </div>
                        </>
                }
            </div>
        </div>
    )
}