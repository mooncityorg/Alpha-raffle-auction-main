import { useState } from "react";
import { PastIcon } from "./svgIcons";
import copy from "copy-to-clipboard";

export default function CopyAddress(props: { address: string }) {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = (text: string) => {
        copy(text);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    }

    return (
        <p className="winner-address" onClick={() => handleCopy(props.address)}>
            {props.address.slice(0, 8)}...{props.address.slice(-8)}
            <span className="copy-icon" style={{ marginLeft: 10 }}>
                {!isCopied ?
                    <PastIcon /> :
                    <span className="copied">copied!</span>
                }
            </span>
        </p>
    )
}