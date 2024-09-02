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

export default function NewRaffle() {
    const router = useRouter();
    const wallet = useWallet();
    const { mint } = router.query;
    const now = new Date();
    const [image, setImage] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const [ticketsNumber, setTicketsNumber] = useState(1);
    const [endTime, setEndTime] = useState(now)
    const [buyType, setBuyType] = useState("sol");

    const [solPrice, setSolPrice] = useState(0);
    const [firstSplPrice, setFirstSplPrice] = useState(0);
    const [secondSplPrice, setSecondSplPrice] = useState(0);

    const [buttonLoading, setButtonLoading] = useState(false);
    const [winnerCount, setWinnerCount] = useState(1);

    const [firstToken, setFirstToken] = useState(SPL_TOKENS[0]);
    const [secondToken, setSecondToken] = useState(SPL_TOKENS[1]);

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

    const handleSecondChange = (event) => {
        let name = "";
        for (let item of SPL_TOKENS) {
            if (item.address === event.target.value)
                name = item.tokenName
        }
        setSecondToken({
            tokenName: name,
            address: event.target.value
        }
        );
    };

    const handleBuyType = (e) => {
        setBuyType(e.target.value)
    }
    const handleTickets = (e) => {
        setTicketsNumber(e);
    }

    const handleWinners = (e) => {
        setWinnerCount(e);
    }

    const handleEndTime = (e) => {
        setEndTime(e)
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
        const nowData = new Date();
        if (moment(endTime)._d.getTime() + 1000 * 10 < nowData.getTime()) {
            errorAlertCenter("Please choose end time");
            return
        }
        if (buyType === "sol" && solPrice === 0) {
            errorAlertCenter("Please enter the ticket price.");
            return
        }

        if (buyType === "spl" && firstSplPrice === 0) {
            errorAlertCenter("Please enter the ticket price.");
            return
        }

        if (buyType === "sol-spl" && (solPrice === 0 || firstSplPrice === 0)) {
            errorAlertCenter("Please enter the ticket price.");
            return
        }

        if (buyType === "spl-spl" && (secondSplPrice === 0 || firstSplPrice === 0)) {
            errorAlertCenter("Please enter the ticket price.");
            return
        }
        setButtonLoading(true);
        try {
            await createRaffle(
                wallet,
                new PublicKey(mint),
                winnerCount,
                new PublicKey(firstToken.address),
                new PublicKey(secondToken.address),
                parseFloat(firstSplPrice),
                parseFloat(secondSplPrice),
                parseFloat(solPrice),
                new Date(endTime).getTime() / 1000,
                parseFloat(ticketsNumber),
                () => setButtonLoading(true),
                () => setButtonLoading(false),
                () => router.push("/raffle")
            )
        } catch (error) {
            console.log(error, "Error from create")
            setButtonLoading(false);
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
                                    <label className="form-label">Tickets amount</label>
                                    <input
                                        value={ticketsNumber}
                                        onChange={(e) => handleTickets(e.target.value)}
                                        min={1}
                                        max={1000}
                                        type="number"
                                    />
                                    <p className="input-helper">The maximum number of tickets is 1000.</p>
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="form-control">
                                    <label className="form-label">End time</label>
                                    <input
                                        value={endTime}
                                        onChange={(e) => handleEndTime(e.target.value)}
                                        type="datetime-local"
                                    />
                                </div>
                            </div>
                            <div className="col-half">
                                <div className="form-control">
                                    <label className="form-label">Winner Count</label>
                                    <input
                                        value={winnerCount}
                                        onChange={(e) => handleWinners(e.target.value)}
                                        min={1}
                                        max={200}
                                        type="number"
                                    />
                                    <p className="input-helper">The maximum number of count is 200.</p>
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
                                        <FormControlLabel value="spl" control={<Radio />} label="SPL" />
                                        {/* <FormControlLabel value="sol-spl" control={<Radio />} label="SOL + SPL" />
                                        <FormControlLabel value="spl-spl" control={<Radio />} label="SPL + SPL" /> */}
                                    </RadioGroup>
                                </FormControl>
                            </div>
                            <div className="col-half">
                                {(buyType === "sol" || buyType === "sol-spl") &&
                                    <div className="form-control">
                                        <div className="form-control-icon">
                                            <input
                                                value={solPrice}
                                                onChange={(e) => setSolPrice(e.target.value)}
                                            />
                                            <span>SOL</span>
                                        </div>
                                    </div>
                                }

                                {buyType !== "sol" &&
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

                                        <div className="form-control">
                                            <div className="form-control-icon">
                                                <input
                                                    value={firstSplPrice}
                                                    onChange={(e) => setFirstSplPrice(e.target.value)}
                                                />
                                                <span>{firstToken.tokenName}</span>
                                            </div>
                                        </div>
                                    </>
                                }
                                {buyType === "spl-spl" &&
                                    <>
                                        <FormControl fullWidth >
                                            <InputLabel>SPL Token</InputLabel>
                                            <Select
                                                value={secondToken.address}
                                                label="SPL Token"
                                                onChange={handleSecondChange}
                                            >
                                                {SPL_TOKENS.map((item, key) => (
                                                    <MenuItem value={item.address} key={key}>{item.tokenName}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <div className="form-control">
                                            <div className="form-control-icon">
                                                <input
                                                    value={secondSplPrice}
                                                    onChange={(e) => setSecondSplPrice(e.target.value)}
                                                />
                                                <span>{secondToken.tokenName}</span>
                                            </div>
                                        </div>
                                    </>
                                }
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-half"></div>
                            <div className="col-half">
                                <div className="form-control">
                                    <button className="btn-create" disabled={buttonLoading} onClick={() => handleCreate()}>
                                        {!buttonLoading ?
                                            <>
                                                Create a Raffle
                                            </>
                                            :
                                            <ClipLoader color="#fff" size={20} />
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}