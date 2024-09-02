import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Raffle } from '../target/types/raffle';

describe('raffle', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Raffle as Program<Raffle>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
