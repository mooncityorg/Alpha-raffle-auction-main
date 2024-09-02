import React from "react";

const Image = ({ className, src, srcDark, srcSet, srcSetDark, alt }) => {
    return (
        // eslint-disable-next-line
        <img className={className} srcSet={srcSet} src={src} alt={alt} />
    )
};

export default Image;
