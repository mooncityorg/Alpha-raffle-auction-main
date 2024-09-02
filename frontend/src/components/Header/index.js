import { useEffect, useState } from "react";
import cn from "classnames";
import styles from "./Header.module.sass";
import Image from "../Image"; /* 
import User from "./User"; */
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { adminValidate } from "../../contexts/transaction-raffle";
import { useWallet } from "@solana/wallet-adapter-react";

const Headers = () => {
  const [visibleNav, setVisibleNav] = useState(false);
  const wallet = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (wallet.publicKey !== null) {
      const admin = adminValidate(wallet);
      setIsAdmin(admin)
    }
    // eslint-disable-next-line
  }, [wallet.connected])

  return (
    <header className={styles.header}>
      {/* <video playsInline autoPlay muted loop poster={stillBg}>
        <source src={headerBg} type="video/mp4" />
        Your browser does not support the video tag.
      </video> */}
      <div className={cn(styles.container)}>
        <Link href="/">
          <a className={styles.logo}>
            {/* eslint-disable-next-line */}
            <Image
              className={styles.pic}
              src="/assets/logo.png"
              srcDark="/assets/logo.png"
              alt="SOL LOGO"
            />
          </a>
        </Link>
        <div className={cn(styles.wrapper, styles.visibleNav)}>
          <nav className={styles.nav}>
            <ul className={styles.headerul}>
              {isAdmin &&
                <li className={styles.headerli}>
                  <Link href={"/create"}>
                    <a className={styles.link} >
                      Create
                    </a>
                  </Link>
                </li>
              }
              <li className={styles.headerli}>
                <Link href={"/raffle"}>
                  <a className={styles.link} >
                    Raffle
                  </a>
                </Link>
              </li>
              <li className={styles.headerli} style={{ marginRight: 20 }}>
                <Link href={"/auction"}>
                  <a className={styles.link}>
                    Auction
                  </a>
                </Link>
              </li>
              <li className={styles.headerli}>
                <WalletModalProvider>
                  <WalletMultiButton />
                </WalletModalProvider>
              </li>
            </ul>
          </nav>
        </div>

        <button
          className={cn(styles.burger, { [styles.active]: visibleNav })}
          onClick={() => setVisibleNav(!visibleNav)}
        ></button>
      </div>
    </header>
  );
};

export default Headers;
