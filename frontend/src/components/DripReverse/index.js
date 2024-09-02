import React from "react";
import cn from "classnames";
import styles from "./DripReverse.module.sass";

const DripReverse = () => {
    return (
        <div
            className={cn(styles.dripReverse, "dripReverse")}
            style={{
                background: "url('/assets/drip-reverse.png')",
                backgroundSize: "cover",
            }}
        ></div>
    );
};

export default DripReverse;
