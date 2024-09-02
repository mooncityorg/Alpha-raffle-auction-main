import HashLoader from "react-spinners/HashLoader";

export default function PageLoading(props: { loading?: boolean }) {
    return (
        <>
            {props.loading &&
                <div className="page-loading">
                    <div className="loading-box">
                        <HashLoader size={32} color="#c300ff" />
                    </div>
                </div>
            }
        </>
    )
}