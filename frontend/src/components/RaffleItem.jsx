import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import ClipLoader from "react-spinners/ClipLoader";
import MoonLoader from "react-spinners/MoonLoader";
import { useWallet } from "@solana/wallet-adapter-react";
import moment from "moment";
import { adminValidate, buyTicket, claimReward, getNftMetaData, getRaffleDataByMintAddress, revealWinner, withdrawNft } from "../context/helper";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Countdown from "react-countdown";
import { HashLoader } from "react-spinners";

export default function RaffleItem() {
  const { mint } = useParams();
  const [image, setImage] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(1);
  const [endTime, setEndTime] = useState("");

  const [price, setPrice] = useState(0);
  const [maxTickets, setMaxTickets] = useState(0);
  const [count, setCount] = useState(0);
  const [payType, setPayType] = useState("");
  const [winner, setWinner] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [unique, setUnique] = useState(0);

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
    const uri = await getNftMetaData(new PublicKey(mint));
    const raffleDetail = await getRaffleDataByMintAddress(new PublicKey(mint));
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
    if (raffleDetail.winner.toBase58() !== "11111111111111111111111111111111") {
      setWinner(raffleDetail.winner.toBase58())
    }
    const solPrice = raffleDetail.ticketPriceSol.toNumber();
    const splPrice = raffleDetail.ticketPriceSpl.toNumber();
    if (solPrice === 0) {
      setPrice(splPrice / 100);
      setPayType("Flower")
    } else if (splPrice === 0) {
      setPrice(solPrice / LAMPORTS_PER_SOL);
      setPayType("SOL");
    }
    const endTimes = raffleDetail.endTimestamp.toNumber() * 1000;
    setMaxTickets(raffleDetail.maxEntrants.toNumber());
    setCount(raffleDetail.count.toNumber());
    setUnique(raffleDetail.noRepeat.toNumber());

    setEndTime(moment(endTimes).format());
    setLoading(false);
  }

  const handleBuy = async () => {
    await buyTicket(wallet, new PublicKey(mint), amount, () => setButtonLoading(true), () => setButtonLoading(false));
  }
  const handleWithdrawNft = async () => {
    await withdrawNft(wallet, new PublicKey(mint), () => setButtonLoading(true), () => setButtonLoading(false));
  }
  const handleRevealWinner = async () => {
    await revealWinner(wallet, new PublicKey(mint), () => setButtonLoading(true), () => setButtonLoading(false));
  }
  const handleClaim = async () => {
    await claimReward(wallet, new PublicKey(mint), () => setButtonLoading(true), () => setButtonLoading(false));
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
                {image !== "" && <>{mint}</>}
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
                        <label>{payType} sold</label>
                        <p>{(count * price).toLocaleString()}</p>
                      </div>
                      <div className="raffle-detail-item">
                        <label>Unique wallets</label>
                        <p>{unique}</p>
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
                            // back to raffle page
                            <>
                              <Link className="btn-create" to="/raffle" style={{ marginTop: 20 }}>
                                Back to raffle list
                              </Link>
                            </>
                          }
                        </div>

                      </>
                      :
                      (
                        winner === "" ?
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
                            <label>Winner:</label>
                            <p className="raffle-winner">{winner}</p>
                            <div className="buy-ticket-item">
                              {
                                winner === wallet.publicKey.toBase58() ?
                                  // claim NFT
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
                                  <Link className="btn-create" to="/raffle" style={{ marginTop: 20 }}>
                                    Back to raffle list
                                  </Link>
                              }
                            </div>
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