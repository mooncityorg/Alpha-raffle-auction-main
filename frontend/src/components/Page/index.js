import React from "react";
import DripPurple from "../DripPurple";
import DripReverse from "../DripReverse";
import Header from "../Header";
import Footer from "../Footer";
import styles from "./Page.module.sass";

const Page = ({ children }) => {
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.inner}>
        <DripPurple />
        {children}
        <DripReverse />
      </div>
      <Footer />
    </div>
  );
};

export default Page;
