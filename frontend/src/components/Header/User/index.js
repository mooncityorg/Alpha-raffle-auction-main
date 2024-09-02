import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import cn from "classnames";
import OutsideClickHandler from "react-outside-click-handler";
import styles from "./User.module.sass";
import Icon from "../../Icon";
import Theme from "../../Theme";
import { getAssociatedTokenAddress, REWARD_MINT } from "../../../util/staking";

const items = [
  {
    title: "My profile",
    icon: "user",
    url: "",
  },
  {
    title: "My items",
    icon: "image",
    url: "",
  },
  {
    title: "Dark theme",
    icon: "bulb",
  },
  {
    title: "Disconnect",
    icon: "exit",
    url: "https://staking.solflowers.io",
  },
];

const User = ({ className }) => {
  const [visible, setVisible] = useState(false);

  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [balance, setBalance] = useState(0);
  useEffect(() => {
    if (!publicKey) return;
    connection
      .getBalance(publicKey)
      .then((balance) => setBalance(balance / LAMPORTS_PER_SOL));
  }, [connection, publicKey]);

  const [rewardMintAmount, setRewardMintAmount] = useState(0);
  useEffect(() => {
    (async () => {
      if (!publicKey) return;

      let accountAddress = await getAssociatedTokenAddress(
        publicKey,
        REWARD_MINT
      );
      let accountAddressData = await connection
        .getTokenAccountBalance(accountAddress, "processed")
        .catch(() => null);
      if (accountAddressData)
        setRewardMintAmount(accountAddressData.value.uiAmount);
      else setRewardMintAmount(0);
    })();
  }, [connection, publicKey]);

  return (
    <OutsideClickHandler onOutsideClick={() => setVisible(false)}>
      {publicKey ? (
        <div className={cn(styles.user, className)}>
          <div className={styles.head} onClick={() => setVisible(!visible)}>
            <div className={styles.avatar}>
              {/* eslint-disable-next-line */}
              <img
                src="https://staking.solflowers.io/images/content/SOL_FLOWERS.png"
                alt="Avatar"
              />
            </div>
            <div className={styles.wallet}>
              {balance.toFixed(2)} <span className={styles.currency}>SOL</span>
            </div>
            <div className={styles.wallet}>
              {rewardMintAmount.toFixed(2)}{" "}
              <span className={styles.currency}>$SEED</span>
            </div>
          </div>
          {visible && (
            <div className={styles.body}>
              <div className={styles.name}>Flower Friend</div>
              <div className={styles.code}>
                <div className={styles.number}>
                  {shortenPublicKey(publicKey)}
                </div>
                <button className={styles.copy}>
                  <Icon name="copy" size="16" />
                </button>
              </div>
              <div className={styles.wrap}>
                <div className={styles.line}>
                  <div className={styles.preview}>
                    {/* eslint-disable-next-line */}
                    <img
                      src="/images/content/solana-sol-logo.png"
                      alt="Solana"
                    />
                  </div>
                  <div className={styles.details}>
                    <div className={styles.info}>Balance</div>
                    <div className={styles.price}>{balance.toFixed(4)} SOL</div>
                  </div>
                </div>
                <button
                  className={cn("button-stroke button-small", styles.button)}
                >
                  Stake your Flower!
                </button>
              </div>
              <div className={styles.menu}>
                {items.map((x, index) =>
                  x.url ? (
                    x.url.startsWith("http") ? (
                      <a
                        className={styles.item}
                        href={x.url}
                        rel="noopener noreferrer"
                        key={index}
                      >
                        <div className={styles.icon}>
                          <Icon name={x.icon} size="20" />
                        </div>
                        <div className={styles.text}>{x.title}</div>
                      </a>
                    ) : (
                      <Link
                        className={styles.item}
                        to={x.url}
                        onClick={() => setVisible(!visible)}
                        key={index}
                      >
                        <div className={styles.icon}>
                          <Icon name={x.icon} size="20" />
                        </div>
                        <div className={styles.text}>{x.title}</div>
                      </Link>
                    )
                  ) : (
                    <div className={styles.item} key={index}>
                      <div className={styles.icon}>
                        <Icon name={x.icon} size="20" />
                      </div>
                      <div className={styles.text}>{x.title}</div>
                      <Theme className={styles.theme} />
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <WalletMultiButton style={{ marginLeft: "1rem" }} />
      )}
    </OutsideClickHandler>
  );
};

function shortenPublicKey(publicKey) {
  if (!publicKey) return "";
  let publicKeyString = publicKey.toBase58();
  return (
    publicKeyString.substring(0, 6) +
    "..." +
    publicKeyString.substring(publicKeyString.length - 6)
  );
}

export default User;
