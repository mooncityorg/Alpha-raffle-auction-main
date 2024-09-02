import axios from "axios";
import { useEffect, useState } from "react"
import AuctionCard from "../../components/AuctionCard";
import { API_URL } from "../../config";

export default function RafflePage() {

    const [auctionList, setAuctionList] = useState<any>();
    const getAuctionList = () => {
        axios.post(`${API_URL}getAllAuctionInfos`)
            .then(function (response) {
                const res = response.data;
                res.sort((a: any, b: any) => b.startTime - a.startTime);
                setAuctionList(res);
            })
            .catch(function (error) {
                console.log(error);
            })
    }
    useEffect(() => {
        getAuctionList()
    }, [])
    return (
        <main>
            <div className="container">
                <div className="auction-list">
                    {auctionList && auctionList.length !== 0 &&
                        auctionList.reverse().map((item: any, key: number) => (
                            <AuctionCard
                                auctionId={item.auction_id}
                                key={key}
                            />
                        ))
                    }
                </div>
            </div>
        </main>
    )
}