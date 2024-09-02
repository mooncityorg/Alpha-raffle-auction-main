import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Auction } from '../target/types/auction';

describe('auction', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Auction as Program<Auction>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
