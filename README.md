# ENS GATED COMMUNITIES

We set up a goal of enabling any user of sismo to get a free ens ens subdomain `user.sismo.eth`, while simustanously giving them a common NFT so that only `***.sismo.eth` name holders could join our discord.

We think of it as a great Community tool, and a great UX tool.

This repository is the result of our exploration of most parts of the ENS smart contracts as well as its npm library `ensjs`

We open-source it: 
  - For teams: any team could use this codebase to offer free ENS and create a ENS Gated Community.
  - For Devs
    - `ENSDeployer.sol` enables you to deploy locally ENS with latest contracts (such as NameWrapper) and with a simplified EthRegistrar (no need to go through the 2-phase registration process)
    - `test/ens.spec.ts` was thought as a tutorial to discover all features of the ENS system (contracts and `ensjs` lib)

We hope that you will enjoy it!


## Hardhat tasks:

1. `deploy-ens-full`: (for local env or private network) 
Deploys the full ENS system: the registry, a modified ethRegistrar (behaves similar as testnets but no controller infront), a reverse Registrar, a nameWrapper and a publicResolver.

```typescript
const deployedENS: {
      ensDeployer: ENSDeployer;
      registry: ENSRegistry;
      registrar: EthRegistrar;
      reverseRegistrar: ReverseRegistrar;
      publicResolver: PublicResolver;
      nameWrapper: NameWrapper;
    } = await HRE.run('deploy-ens-full');
```
or inline
`npx hardhat deploy-ens-full`

<br />
<br />

2. `deploy-name-wraper-and-resolver`: (for networks where ens and ethRegistrar already deployed)
Deploys a nameWrapper linked to the ethRegistrar

```typescript
const deployedENS: {
      publicResolver: PublicResolver;
      nameWrapper: NameWrapper;
    } = await HRE.run('deploy-name-wrapper-and-resolver', {
      ens: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
      ethRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85'
    });
```
or inline
`npx hardhat deploy-name-wrapper-and-resolver --ens 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e --ethRegistrar 0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85 --network rinkeby`

<br />
<br />


3.  `deploy-eth-domain-registrar`: deploy the domain registrar (FirstInFirstServed), which mints ERC721 for subdomain registrers.

```typescript
sismoRegistrar = await HRE.run('deploy-eth-domain-registrar', {
        // This is the owned domain. Here sismo.eth
        name: 'sismo',
        // Symbol for the ERC721 Token that will gate your community
        symbol: 'SISMO',
        ens: registry.address,
        resolver: publicResolver.address,
        nameWrapper: nameWrapper.address,
      });
```

If you want to deploy this for your community, please join our discord: sismo.io

