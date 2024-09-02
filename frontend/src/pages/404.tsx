import { Container } from "@mui/material"

export default function NoMachedPage(props: { startLoading: Function, closeLoading: Function }) {

  return (
    <main>
      <Container>
        <h1 style={{ textAlign: "center" }}>404 Error</h1>
      </Container>
    </main>
  )
}
