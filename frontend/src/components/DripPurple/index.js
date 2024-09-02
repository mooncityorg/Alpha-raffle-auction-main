import React from "react";
import cn from "classnames";
import styles from "./DripPurple.module.sass";

const DripPurple = () => {
    return (
        <div
            className={cn(styles.drip, "drip")}
            style={{
                background: "url('/assets/drip-purple.png')",
                backgroundSize: "cover",
            }}
        ></div>
    );
};

export default DripPurple;
