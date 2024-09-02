import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getNftMetaData } from '../../contexts/transaction-raffle';
import { useRouter } from 'next/router';

export default function NFTCard({ mint }) {
    const [image, setImage] = useState("");
    const [name, setName] = useState("");
    const router = useRouter();
    const getNFTdetail = async () => {
        const uri = await getNftMetaData(new PublicKey(mint))
        await fetch(uri)
            .then(resp =>
                resp.json()
            ).then((json) => {
                setImage(json.image);
                setName(json.name);
            }).catch((error) =>
                console.log(error)
            )
    }

    useEffect(() => {
        getNFTdetail();
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
        <div className="nft-card">
            <div className="media" ref={cardRef}>
                {/* eslint-disable-next-line */}
                <img
                    src={image}
                    style={{ height: dimensions.width }}
                    alt=""
                />
            </div>
            <div className="card-content">
                <p>{name}</p>
                <div className="create-raffle" onClick={() => router.push(`/create/raffle/${mint}`)}>
                    Create a Raffle
                </div>
                <div className="create-raffle" onClick={() => router.push(`/create/auction/${mint}`)}>
                    Create an Auction
                </div>
            </div>
        </div >
    )
}