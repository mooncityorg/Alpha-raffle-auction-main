import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react"
import { HashLoader } from "react-spinners";
import { getNftMetaData, getRaffleGlobalState } from "../context/helper";
import RaffledCard from "./RaffledCard";

export default function RafflePage() {
    const [globalData, setGlobalData] = useState();
    const [loading, setLoading] = useState(false);
    const getGlobalData = async () => {
        setLoading(true);
        const result = await getRaffleGlobalState();
        let tempData = [];
        for (let item of result) {
            const count = item.count.toNumber();
            const creator = item.creator.toBase58();
            const maxEntrants = item.maxEntrants.toNumber();
            const noRepeat = item.noRepeat.toNumber();
            const ticketPriceSol = item.ticketPriceSol.toNumber();
            const ticketPriceSpl = item.ticketPriceSpl.toNumber();
            const endTimestamp = item.endTimestamp.toNumber();
            const nftMint = item.nftMint.toBase58();
            let image = "";
            let nftName = "";
            if (item.claimed.toNumber() === 0) {
                try {
                    const uri = await getNftMetaData(new PublicKey(nftMint));
                    await fetch(uri)
                        .then(resp =>
                            resp.json()
                        ).catch((error) => {
                            console.log(error)
                        })
                        .then((json) => {
                            image = json.image;
                            nftName = json.name;
                        })
                } catch (error) {
                    console.log(error)
                }
                tempData.push({
                    count: count,
                    creator: creator,
                    maxEntrants: maxEntrants,
                    noRepeat: noRepeat,
                    ticketPriceSol: ticketPriceSol,
                    ticketPriceSpl: ticketPriceSpl,
                    endTimestamp: endTimestamp,
                    image: image,
                    nftName: nftName,
                    nftMint: nftMint
                })
            }
        }
        tempData.sort(function (a, b) {
            return parseFloat(a.endTimestamp) - parseFloat(b.endTimestamp);
        });
        setGlobalData(tempData.reverse())
        setLoading(false)
    }
    useEffect(() => {
        getGlobalData();
    }, [])
    return (
        <main>
            {loading &&
                <div className="page-loading">
                    <div className="loading-box">
                        <HashLoader size={32} color="#3498db" />
                    </div>
                </div>
            }
            <div className="container">
                {!loading ?
                    <div className="raffle-page">
                        {globalData && globalData.length !== 0 &&
                            globalData.map((item, key) => (
                                item.image !== "" &&
                                <RaffledCard
                                    key={key}
                                    count={item.count}
                                    creator={item.creator}
                                    maxEntrants={item.maxEntrants}
                                    noRepeat={item.noRepeat}
                                    ticketPriceSol={item.ticketPriceSol}
                                    ticketPriceSpl={item.ticketPriceSpl}
                                    image={item.image}
                                    nftName={item.nftName}
                                    nftMint={item.nftMint}
                                    endTimestamp={item.endTimestamp}
                                />
                            ))
                        }
                    </div>
                    :
                    <>
                        <h1>Loading...</h1>
                    </>
                }
            </div>
        </main>
    )
}