# ENS DAOS: 

We set up a goal of enabling every user of Sismo to get a free ENS subdomain `user.sismo.eth`, while simultaneously starting our DAO, giving each DAO member a unique ERC721 NFT. This NFT gates our discord.

It is a great Community tool, and a great UX improvement for our product (We aim to replace in our UX all addresses for ENS names).

You will find in this repository what we built to kickstart our ENS centric DAO as well as the result of our exploration of the ENS smart contracts and its npm library `ensjs`. 

We open-source it: 
  - For teams: Use this codebase to offer free ENS and kickstart your ENS Powered DAO.
  - For Devs
    - `ENSDeployer.sol` and `deploy-ens-full` hardhat task: Deploy locally a full ENS system with latest contracts (such as NameWrapper) and with a simplified EthRegistrar (no need to go through the 2-phase registration process)
    -  `ENSDaoRegistrar.sol`, `ENSDaoToken.sol` and `deploy-ens-dao`: deploy a domain registrar that is able to create on the go subdomains + NFTs for your users.
    - `ens-dao.spec.ts` was thought as a tutorial to discover all features of the ENS system (contracts and `ensjs` lib).
    
## Contracts

1. `ENSDaoRegistrar.sol` and `EnsDaoToken.sol`

FIFS (Fist In First Served) Registrar for your `domain.eth`.
It lets anyone register a `subdomain.domain.eth` for free, wrap it as a ERC1155 (shared with all eth names) and mint a DAO Token (ERC721) (for you subdomain holders only).

Note: For 1 week, only `vitalik.eth` will be able to register `vitalik.domain.eth`

2. `ENSDeployer.sol`

Simple deployer contract, updated with latest ENS smart contracts.

3. `EthRegistrar.sol` 
   
Modified EthRegistrar (`@ensdomains/ens-contracts/contracts/ethregistrar/BaseRegistrarImplementation.sol`) so that we can easily register `.eth` names without going through the controler and 2 step registration process.

## Hardhat tasks:

Do no forget to set up a $MNEMONIC environment variable, trough .env file or `$ export MNEMONIC= 'fox sight canyon orphan hotel grow hedgehog build bless august weather swarm'`

1. `deploy-name-wrapper-and-resolver`: (for networks where ens and ethRegistrar already deployed)
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
`npx hardhat deploy-name-wrapper-and-resolver --ens $ENS_ADDR --ethRegistrar $ETH_REGISTRAR_ADDRESS --network $NETWORK`

<br />

2.  `deploy-ens-dao`: deploy the ENS DAO (FirstInFirstServed), which enable users to register subdomain and mint DAO Token

```typescript
      const {
        ensDaoRegistrar,
        ensDaoToken,
      }: { ensDaoRegistrar: ENSDaoRegistrar; ensDaoToken: ENSDaoToken } =
        await HRE.run('deploy-ens-dao', {
        // This is the owned domain. Here sismo.eth
        name: 'sismo',
        // Symbol for the ERC721 Token that will gate your community
        symbol: 'SISMO',
        // ENS registry address
        ens: registry.address,
        // ENS public resolver
        resolver: publicResolver.address,
        // ENS nameWrapper 
        nameWrapper: nameWrapper.address,
      });
```
or inline
`npx hardhat deploy-ens-dao --ens $ENS_ADDR --resolver $ETH_RESOLVER_ADDRESS --network main`
<br />

3. `deploy-ens-full`: (for local env or private network) 
Deploys the full ENS system: the registry, a modified ethRegistrar (behaves similar as testnets but no controller in front), a reverse Registrar, a nameWrapper, a publicResolver and a ENS DAO.

```typescript
const deployedENS: {
      ensDeployer: ENSDeployer;
      registry: ENSRegistry;
      registrar: EthRegistrar;
      reverseRegistrar: ReverseRegistrar;
      publicResolver: PublicResolver;
      nameWrapper: NameWrapper;
      ensDaoRegistrar: ENSDaoRegistrar,
      ensDaoToken: ENSDaoToken,
    } = await HRE.run('deploy-ens-full');
```
or inline
`npx hardhat deploy-ens-full --ens-dao`
or without the `--ens-dao`flag if you don't want to deploy the ensDAO

If you need help to deploy this for your community, please join our discord: sismo.io

