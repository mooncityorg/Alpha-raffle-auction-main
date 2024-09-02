import { useEffect, useState } from "react"
import { HashLoader } from "react-spinners";
import RaffledCard from "../../components/RaffledCard";
import { getRaffleGlobalState } from "../../contexts/transaction-raffle"

export default function RafflePage() {
    const [globalData, setGlobalData] = useState();
    const [loading, setLoading] = useState(false);
    const getGlobalData = async () => {
        setLoading(true);
        const result = await getRaffleGlobalState();
        let tempData = [];
        for (let item of result) {
            const endTimestamp = item.endTimestamp.toNumber();
            tempData.push({
                raffleKey: item.raffleKey.toBase58(),
                endTimestamp: endTimestamp
            })
        }
        // }
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
                                    raffleKey={item.raffleKey}
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