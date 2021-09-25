### ENS GATED COMMUNITIES

We set up a goal of enabling any user of sismo to get a free ens ens subdomain `user.sismo.eth`, while simustanously giving them a common NFT so that only `***.sismo.eth` name holders could join our discord.

We think of it as a great Community tool, and a great UX tool.

This repository is the result of our exploration of most parts of the ENS smart contracts as well as its npm library `ensjs`

We open-source it: 
  - For teams: any team could use this codebase to offer free ENS and create a ENS Gated Community.
  - For Devs
    - `ENSDeployer.sol` enables you to deploy locally ENS with latest contracts (such as NameWrapper) and with a simplified EthRegistrar (no need to go through the 2-phase registration process)
    - `test/ens.spec.ts` was thought as a tutorial to discover all features of the ENS system (contracts and `ensjs` lib)

We hope that you will enjoy it!

If you want to deploy this for your community, please join our discord: sismo.io

