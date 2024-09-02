import { useState } from 'react'
import '../styles/helper.sass'
import '../styles/style.scss'
import Wallet from '../components/wallet/Wallet'
import { ToastContainer } from 'react-toastify'
import PageLoading from '../components/PageLoading'
import Page from '../components/Page'

function RaffleApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(false);
  return (
    <Wallet>
      <Page>
        <Component
          {...pageProps}
          startLoading={() => setLoading(true)}
          closeLoading={() => setLoading(false)}
        />
      </Page>
      <ToastContainer style={{ fontSize: 14 }} />
      <PageLoading loading={loading} />
    </Wallet>
  )
}

export default RaffleApp
