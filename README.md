# ENS DAOS: 

We set up a goal of enabling every user of Sismo to get a free ENS subdomain `user.sismo.eth`, while simultaneously starting our DAO, giving each DAO member a unique ERC721 NFT. This NFT gates our discord.

It is a great Community tool, and a great UX improvement for our product. We aim to replace in our UX all addresses for ENS names.

You will find in this repository what we built to kickstart our ENS centric DAO as well as the result of our exploration of the ENS smart contracts and its npm library `ensjs`. 

Use this codebase to offer free ENS and kickstart your ENS Powered DAO.

## Contracts

1. `ENSDaoRegistrar.sol`

First in first served Registrar for your `domain.eth`.

It lets anyone register a `subdomain.domain.eth` for free and mint an ERC721 DAO Token.

An address can not register if already owns an ERC721 DAO token.

A reservation period, set and starting at the deploiement of the contract, is preventing the registration of `lando.domain.eth` if `lando.eth` is owned by a different address than the transaction sender.

A booking mechanism, managed by the DAO owner, has been introduced in order to prevent indefinitely the registration of selected subdomains.

A booked subdomain can be claimed, hence registering the subdomain and minting the ERC721 DAO Token for an arbitrary beneficiary.

Internally, registration of the subdomain is handled in two flavors. The first possibility is through the usual ENS Registry contract, we consider this approach as the safest for now. The second approach relies on the [Name Wrapper contract](https://github.com/ensdomains/name-wrapper), the subdomain in this case is wrapped as a ERC1155 token shared with all `.eth` name. Our goal is to invest time into the second flavor.

2. `EnsDaoToken.sol`

An ERC721 contract based on the `ERC721PresetMinterPauserAutoId` preset of [OpenZeppelin](https://openzeppelin.com/).


3. `ENSLabelBooker.sol`

A managed booking of ENS subdomains.

The owner can book a subdomain by linking it to a particular address.

A booking can then be updated or deleted by the owner.


4. `EthRegistrar.sol` 
   
Modified `EthRegistrar` based on the [ENS Base Registrar](https://github.com/ensdomains/ens-contracts/blob/master/contracts/ethregistrar/BaseRegistrarImplementation.sol) for testing purposes. The registration process is simplified in order to be able to register `.eth` subdomains in a single transaction.

5. `ENSDeployer.sol`

Deployer contract used for testing purposes. It deploys a full set of ENS smart contracts.

## Hardhat tasks:

A `MNEMONIC` environment variable may be configured. If not specified, it will fallback to `'fox sight canyon orphan hotel grow hedgehog build bless august weather swarm'`, **do not use this default mnemonic in production or any other personal use**.

1. `deploy-name-wrapper-and-resolver`: deploys a nameWrapper. The addresses of the Eth Registrar and ENS Registry are needed as inputs.

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

2.  `deploy-ens-dao`: deploys the ENS DAO Registrar, ENS DAO Token and a ENS Label Booker. The addresses of the ENS Registry, Public Resolver and Name Wrapper are needed as inputs. If the zero address is given for the Name Wrapper, the ENS DAO Registrar will use the ENS Registry only, otherwise it will use the provided Name Wrapper.

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
        // Reservation duration, fallback to 4 weeks if not specified
        reservationDuration,
        // Owner of the contracts, fallback to deployer address if not specified
        owner
      });
```
or inline
`npx hardhat deploy-ens-dao --ens $ENS_ADDR --resolver $ETH_RESOLVER_ADDRESS --nameWrapper $NAME_WRAPPER_ADDRESS --network main`
<br />

3. `deploy-ens-full`: deploys the full ENS system: the registry, a modified ethRegistrar, a reverse Registrar, a nameWrapper, a publicResolver and optionally an ENS DAO Registrar with its associated ENS DAO Token and ENS Label Booker.

```typescript
const deployedENS: {
      ensDeployer: ENSDeployer;
      registry: ENSRegistry;
      registrar: EthRegistrar;
      reverseRegistrar: ReverseRegistrar;
      publicResolver: PublicResolver;
      nameWrapper: NameWrapper;
      ensDaoRegistrar?: ENSDaoRegistrar,
      ensDaoToken?: ENSDaoToken,
      ensDaoLabelBooker?: ENSLabelBooker,
    } = await HRE.run('deploy-ens-full', {
      // Boolean value in order to choose to additionally deploy ENS DAO related contracts
      ensDao: true
    });
```
or inline
`npx hardhat deploy-ens-full --ens-dao`
or without the `--ens-dao`flag if you don't want to deploy the ensDAO

## Development

### Installation and setup

```bash
npm install
```

### Testing

```bash
npm run test
```

## Contact

If you need help to deploy this for your community, please contact us at sismo.io.

