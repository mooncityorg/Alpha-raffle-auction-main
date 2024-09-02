import { useLayoutEffect, useRef, useState } from "react";
import { Skeleton } from "@mui/material";

export default function SkeletonCard() {
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
    <div className="nft-card" >
      <div className="nft-card-content">
        <div className="media" ref={cardRef}>
          <Skeleton variant="rectangular" animation="wave" width={dimensions.width} height={dimensions.width} style={{ borderRadius: 0, background: "#0000002e" }} />
        </div>
        <div className="card-content">
          <Skeleton variant="rectangular" animation="wave" width={200} height={28} style={{ borderRadius: "0px", margin: "3px auto", background: "#0000002e" }} />
          <Skeleton variant="rectangular" animation="wave" width={120} height={24} style={{ borderRadius: "0px", margin: "10px auto", background: "#0000002e" }} />
          <Skeleton variant="rectangular" animation="wave" width={80} height={16} style={{ borderRadius: "0px", margin: "4px auto", background: "#0000002e" }} />
          <Skeleton variant="rectangular" animation="wave" width={120} height={18} style={{ borderRadius: "0px", margin: "4px auto", background: "#0000002e" }} />
          <Skeleton variant="rectangular" animation="wave" width={140} height={40} style={{ borderRadius: "0px", margin: "14px auto 4px", background: "#0000002e" }} />
        </div>
      </div>
    </div>
  )
}