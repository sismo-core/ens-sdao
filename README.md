# ENS GATED COMMUNITIES

We set up a goal of enabling every user of Sismo to get a free ENS subdomain `user.sismo.eth`, while simustanously giving them a unique ERC721 NFT so that only `***.sismo.eth` name holders could join our discord.

It is a great Community tool, and a great UX improvement (ENS names >> ethereum addresses!!).

With this repository, we want to share the result of our exploration of the ENS smart contracts as well as its npm library `ensjs`. 

We open-source it: 
  - For teams: any team could use this codebase to offer free ENS and create a ENS Gated Community.
  - For Devs
    - `ENSDeployer.sol` and `deploy-ens-full` hardhat task: Deploy locally a full ENS system with latest contracts (such as NameWrapper) and with a simplified EthRegistrar (no need to go through the 2-phase registration process)
    -  `EthDomainRegistrar.sol` and `deploy-eth-domain-registrar`: deploy a domain registrar that is able to create on the go subdomains + NFTs for your users.
    - `ens-gate-community.spec` was thought as a tutorial to discover all features of the ENS system (contracts and `ensjs` lib).
    
## Contracts

1. `ENSDeployer.sol`

Simple deployer contract, updated with latest ENS smart contracts.

2. `EthRegistrar.sol` 
   
Modified EthRegistrar (`@ensdomains/ens-contracts/contracts/ethregistrar/BaseRegistrarImplementation.sol`) so that we can easily register `.eth` names without going through the controler and 2 step registration process.

3. `EthDomainRegistrar.sol`

FIFS (Fist In First Served) Registrar for your `domain.eth`.
It lets anyone register a `subdomain.domain.eth` for free, wrap it as a ERC1155 (shared with all eth names) and mint a ERC721 (for you subdomain holders only).

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

If you nedd help to deploy this for your community, please join our discord: sismo.io

