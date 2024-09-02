import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import moment from "moment";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { claimReward, withdrawNft } from "../contexts/transaction-raffle";
import { getNftMetaData } from "../contexts/utils";

export default function StakedNFTCard(props: {
  mint: string,
  lockTime: number,
  model: number,
  rate: number,
  rewardTime: number,
  stakedTime: number,
  startLoading: Function,
  closeLoading: Function,
  updatePage: Function,
}) {
  const [image, setImage] = useState("");
  const [name, setName] = useState("");
  const wallet = useWallet();

  const getNFTdetail = async () => {
    const uri = await getNftMetaData(new PublicKey(props.mint))
    await fetch(uri)
      .then(resp =>
        resp.json()
      ).then((json) => {
        setImage(json.image);
        setName(json.name);
      })
      .catch((error) => {
        console.log(error)
      })
  }

  const handleUnstake = async () => {
    try {
      await withdrawNft(
        wallet,
        new PublicKey(props.mint),
        () => props.startLoading(),
        () => props.closeLoading(),
        () => props.updatePage()
      )
    } catch (error) {

    }
  }

  const handleClaim = async () => {
    if (wallet.publicKey === null) return;
    try {
      await claimReward(
        wallet,
        new PublicKey(props.mint),
        () => props.startLoading(),
        () => props.closeLoading(),
        () => props.updatePage()
      )
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getNFTdetail();
    // eslint-disable-next-line
  }, [])


  // for image layout
  const cardRef = useRef<HTMLDivElement>(null);
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
      <div className="nft-card-content">
        <div className="media" ref={cardRef}>
          {/* eslint-disable-next-line */}
          <img
            src={image}
            style={{ height: dimensions.width }}
            alt=""
          />
          <div className="card-content">
            <p style={{ fontWeight: "bold" }}>{name}</p>
            <p className="card-info"><span>Model:</span> {props.model}</p>
            <p className="card-info"><span>Rate:</span> {props.rate / LAMPORTS_PER_SOL}</p>
            <p className="card-info"><span>StakedTime:</span> {moment(props.stakedTime * 1000).format()}</p>
            <div className="align-center">
              <button className="btn-primary" onClick={() => handleUnstake()}>
                unstake
              </button>
              <button className="btn-primary" onClick={() => handleClaim()}>
                claim
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
