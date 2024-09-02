import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { createRaffle, getNftMetaData } from "../../../contexts/transaction-raffle";
import Skeleton from '@mui/material/Skeleton';
import { FormControl, RadioGroup, FormControlLabel, Radio, Select, MenuItem, InputLabel } from '@mui/material';
import ClipLoader from "react-spinners/ClipLoader";
import { useWallet } from "@solana/wallet-adapter-react";
import moment from "moment";
import { SPL_TOKENS } from "../../../config";
import { useRouter } from "next/router";
import { errorAlertCenter } from "../../../components/toastGroup";
import { CreateOpenAuction } from "../../../contexts/transaction-auction";

export default function NewRaffle({ startLoading, closeLoading }) {
  const router = useRouter();
  const wallet = useWallet();
  const { mint } = router.query;
  const now = new Date();
  const [image, setImage] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [buyType, setBuyType] = useState("sol");
  const [firstToken, setFirstToken] = useState(SPL_TOKENS[0]);

  const [auctionTitle, setAuctionTitle] = useState("");
  const [floor, setFloor] = useState(0);
  const [splFloor, setSplFloor] = useState(0);
  const [increment, setIncrement] = useState(0);
  const [splIncrement, setSplIncrement] = useState(0);
  const [biddercap, setBiddercap] = useState(0);
  const [amount, setAmount] = useState(1);
  const [startTime, setStartTime] = useState(now);
  const [endTime, setEndTime] = useState(now);

  const handleFirstChange = (event) => {
    let name = "";
    for (let item of SPL_TOKENS) {
      if (item.address === event.target.value)
        name = item.tokenName
    }
    setFirstToken({
      tokenName: name,
      address: event.target.value
    }
    );
  };

  const handleTickets = (e) => {
    setAmount(e);
  }

  const handleEndTime = (e) => {
    setEndTime(e)
  }

  const handleStartTime = (e) => {
    setStartTime(e)
  }

  const handleBuyType = (e) => {
    setBuyType(e.target.value)
  }

  const getNFTdetail = async () => {
    setLoading(true);
    if (mint !== undefined) {
      const uri = await getNftMetaData(new PublicKey(mint))
      await fetch(uri)
        .then(resp =>
          resp.json()
        ).catch((error) => {
          console.log(error)
        })
        .then((json) => {
          setImage(json?.image);
          setName(json?.name);
        })
    }
    setLoading(false);
  }

  const handleCreate = async () => {
    if (auctionTitle === "") {
      errorAlertCenter("Input correct title.");
      return;
    }
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (auctionTitle === "") {
      errorAlertCenter("Input correct title.");
      return;
    }
    if (now > start) {
      errorAlertCenter("Invalid start time.");
      return;
    }
    if (now > end) {
      errorAlertCenter("Invalid end time.");
      return;
    }
    if (floor === 0 || floor === undefined) {
      errorAlertCenter("Invalid floor price.");
      return;
    }
    if (parseInt(biddercap) === 0) {
      errorAlertCenter("Invalid biddercap!");
      return;
    }
    try {
      await CreateOpenAuction(
        wallet,
        new PublicKey(mint),
        new PublicKey(firstToken.address),
        auctionTitle,
        parseFloat(floor),
        parseFloat(splFloor),
        parseFloat(increment),
        parseFloat(splIncrement),
        parseFloat(biddercap),
        start / 1000,
        end / 1000,
        parseInt(amount),
        () => startLoading(),
        () => closeLoading(),
        () => router.push("/auction")
      )
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getNFTdetail();
    // eslint-disable-next-line
  }, [router])
  return (
    <div className="new-raffle">
      <div className="container">
        <div className="new-create-content">
          <div className="nft-detail">
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
                <Skeleton variant="rectangular" width={320} height={45} style={{ marginRight: "auto", marginLeft: "auto", borderRadius: 6 }} />
                :
                <>{name}</>
              }
            </p>
            <p className="mint-address">
              {loading ?
                <Skeleton variant="rectangular" width={300} height={21} style={{ marginRight: "auto", marginLeft: "auto", borderRadius: 6 }} />
                :
                <>
                  {image !== "" && <>{mint.slice(0, 10) + "..." + mint.slice(-10)}</>}
                </>
              }
            </p>
          </div>
          <div className="new-raffle-control">
            <div className="row">
              <div className="col-half">
                <div className="form-control">
                  <label className="form-label">Auction Title</label>
                  <input
                    value={auctionTitle}
                    onChange={(e) => setAuctionTitle(e.target.value)}
                    name="title"
                    placeholder="Enter auction title"
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-half">
                <p>Payment type</p>
                <FormControl>
                  <RadioGroup
                    value={buyType}
                    onChange={(e) => handleBuyType(e)}
                    defaultValue="sol"
                    name="radio-buttons-group"
                  >
                    <FormControlLabel value="sol" control={<Radio />} label="SOL" />
                    <FormControlLabel value="sol-spl" control={<Radio />} label="SOL + SPL" />
                  </RadioGroup>
                </FormControl>
              </div>
              <div className="col-half">
                <div className="row">
                  <div className="col-12">
                    <div className="form-control">
                      <label className="form-label">Floor SOL Price</label>
                      <input
                        value={floor}
                        name="floor-price"
                        onChange={(e) => setFloor(e.target.value)}
                      />
                    </div>
                  </div>
                  {buyType === "sol-spl" &&
                    <>
                      <FormControl fullWidth>
                        <InputLabel>SPL Token</InputLabel>
                        <Select
                          value={firstToken.address}
                          label="SPL Token"
                          onChange={handleFirstChange}
                        >
                          {SPL_TOKENS.map((item, key) => (
                            <MenuItem value={item.address} key={key}>{item.tokenName}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <div className="col-12">
                        <div className="form-control">
                          <label className="form-label" style={{ marginTop: 16 }}>Floor SPL Price</label>
                          <input
                            value={splFloor}
                            name="floor-price"
                            onChange={(e) => setSplFloor(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  }
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-half">
                <div className="form-control">
                  <label className="form-label">Start time</label>
                  <input
                    value={startTime}
                    name="startime"
                    onChange={(e) => handleStartTime(e.target.value)}
                    type="datetime-local"
                  />
                </div>
              </div>
              <div className="col-half">
                <div className="form-control">
                  <label className="form-label">End time</label>
                  <input
                    value={endTime}
                    name="endtime"
                    onChange={(e) => handleEndTime(e.target.value)}
                    type="datetime-local"
                  />
                </div>
              </div>
            </div>

            <div className="row">

              <div className="col-half">
                <div className="form-control">
                  <label className="form-label">SOL Min increment</label>
                  <input
                    value={increment}
                    name="increment"
                    onChange={(e) => setIncrement(e.target.value)}
                    placeholder="Enter minimum increment of auction"
                  />
                </div>
              </div>
              <div className="col-half">
                <div className="form-control">
                  <label className="form-label">Spl token Min increment</label>
                  <input
                    value={splIncrement}
                    name="increment"
                    onChange={(e) => setSplIncrement(e.target.value)}
                    placeholder="Enter minimum increment of auction"
                  />
                </div>
              </div>

              <div className="col-half">
                <div className="form-control">
                  <label className="form-label">Biddercap</label>
                  <input
                    value={biddercap}
                    name="biddercap"
                    onChange={(e) => setBiddercap(e.target.value)}
                    placeholder="Enter bidder cap"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-half"></div>
              <div className="col-half">
                <div className="form-control">
                  <button className="btn-create" onClick={() => handleCreate()}>
                    Create an auction
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}