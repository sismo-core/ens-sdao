# Subdomain DAOS

The goal a Subdomain DAO (SDAO) is to expose a first in first served Registrar for a `domain.eth` where anyone can register a `subdomain.domain.eth` for free and owns it.

This repository presents a set of tools in order to kickstart a SDAO.

The core contract `SDaoRegistrar` contains the registration logic with the minimal restrictions and logic.

A set of extensions is available in order to let the developer chooses what additional features or restrictions should be applied.

As ready to use examples, a list of presets has been made. Each preset uses a different set of extensions that may fit common use cases.

The organisation of the code is heavily inspired from the [OpenZeppelin](https://openzeppelin.com/) contracts, in particular their extensions and presets for the various token standards, see related pages for [extending contracts](https://docs.openzeppelin.com/contracts/3.x/extending-contracts) and the [ERC20 approach](https://docs.openzeppelin.com/contracts/3.x/erc20).

The code of this repository resolves around ENS, it is advised for the developer to be familiar with [Ethereum Name Service](https://ens.domains/) notions.

## Core contract

### First in first served registration

The contract allows first in first served registration of a subdomain, e.g. `subdomain.domain.eth` through the `register` method. A registration consists of a creation of a subdomain owned by and which resolves to the registrant address.

The first in first served registration may be blocked and unblocked by the owner of the contract.

### Internal registration

The internal registration method `_register` is exposed internally for extensions of the `SDaoRegistrar`. The only blocking condition of the internal registration is registration of an already registered subdomain.

Additionally, two hooks are run in the `_register` method:
- `beforeRegistration`: this hook is called at the beginning of the method, before any registration. The hook does nothing in the core implementation but allows extensions to execute any logic before a subdomain is registered,
- `afterRegistration`: this hook is called at the end of the method, after any registration. The hook does nothing in the core implementation but allows extensions to execute any logic after a subdomain is registered.

### Constructor

The `SDaoRegistrar` is constructed from the address of the ENS Registry, the address of the Public Resolver, the node that this registrar administers and the address of the owner of the contract.

The node corresponds to the [namehash](https://docs.ens.domains/contract-api-reference/name-processing) of the domain of the SDAO, e.g. `domain.eth`.

### Interface and Implementation

See `contracts/subdomain-dao/ISDaoRegistrar.sol` and `contracts/subdomain-dao/SDaoRegistrar.sol` for the exact interface and implementation.

## Extensions

An extension is an abstract contract which inherits the `SDaoRegistrar` core contract.

It may add other public methods for registration using the internal registration method or implements the `beforeRegistration` and `afterRegistration` hooks.

### Reserved Extension

A reservation period is introduced during which registration of a subdomain `subdomain.domain.eth` is blocked if the related `subdomain.eth` is owned by someone else than the registrant.

If the related `subdomain.eth` is free or owned by the registrant, the registration is allowed.

The reservation period can be updated by the owner of the contract.

See `contracts/subdomain-dao/extensions/SDaoRegistrarReserved.sol` for the implementation.

### Limited Extension

A counter for the number of registered subdomains and a registration limit number are added. If the counter reached the registration limit, registration is blocked.

The registration limit can be updated by the owner of the contract.

See `contracts/subdomain-dao/extensions/SDaoRegistrarLimited.sol` for the implementation.

### ERC1155 Generator Extension

An address of an ERC1155 is added, the ERC1155 contract must allow the minting by the SDAO contract.

An ERC1155 token is minted for the registrant after each registration. The ERC1155 token ID and data are left free to be implemented by the developer.

The registration is blocked if the balance of the registrant is not zero based on a `balanceOf` method to be implemented by the developer.

See `contracts/subdomain-dao/extensions/SDaoRegistrarERC1155Generator.sol` for the implementation.

### ERC721 Generator Extension

An address of an ERC721 is added, the ERC721 contract must allow the minting by the SDAO contract.

An ERC721 token is minted for the registrant after each registration.

The registration is blocked if the balance of the registrant is not zero.

See `contracts/subdomain-dao/extensions/SDaoRegistrarERC721Generator.sol` for the implementation.

### Code Accessible Extension

A new public method of registration `registerWithAccessCode` is added. It allows to register a subdomain if a valid access code is given.

An access code is a signed message according to the [EIP712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) specification. The message contains domain specific information set at the deployment of the contract and the data of the message. The data contains the recipient address, which will receive the subdomain, and a number called `group ID`.

The message must be signed by a specific `code signer` address in order to be valid.

The `code signer` value is managed by the owner of the contract.

The `group ID` is retrieved using an internal method that needs to be implemented in the final contract.

An access code can only be consumed once.

See `contracts/subdomain-dao/extensions/SDaoRegistrarCodeAccessible.sol` for the implementation.

### Claimable Extension

An address of an ENS Label Booker is added. The latter manages a mapping of booking formed by a link between a subdomain and a booking address.

A new public method of registration `claim` is added. It allows to register a subdomain if the sender of the message is the booking address associated to the subdomain.

The first in first served registration is blocked if the subdomain is already booked.

See `contracts/subdomain-dao/extensions/SDaoRegistrarClaimable.sol` and `contracts/ens-label-booker/ENSLabelBooker.sol` for the implementation of the extension and the Label Booker contracts.

## Presets

A preset is an SDAO Registrar contract extended with a set of extensions. It may be considered as ready to use contracts or examples of the extensions usage.

### Limited Reserved ERC1155 Preset

This preset uses the `SDaoRegistrarLimited`, `SDaoRegistrarReserved` and `SDaoRegistrarERC1155Generator` extensions.

The ERC1155 token ID is here chosen at 0 and cannot be updated.

See `contracts/subdomain-dao/presets/SDaoRegistrarERC1155.sol` for the implementation.

### Limited Reserved ERC721 Preset

This preset uses the `SDaoRegistrarLimited`, `SDaoRegistrarReserved` and `SDaoRegistrarERC721Generator` extensions.

See `contracts/subdomain-dao/presets/SDaoRegistrarERC721.sol` for the implementation.

### Code Accessible Preset

This preset uses only the `SDaoRegistrarCodeAccessible` extension.

The `group ID` value is managed by the owner of the contract.

See `contracts/subdomain-dao/presets/SDaoRegistrarCodeAccessible.sol` for the implementation.

### Claimable Preset

This preset uses only the `SDaoRegistrarClaimable` extension.

See `contracts/subdomain-dao/presets/SDaoRegistrarPresetClaimable.sol` for the implementation.

## Development

### NPM scripts
#### `npm install`

Install the dependencies.

#### `npm compile`

Compile the smart contracts and generate the associated TypeScript types.

#### `npm test`

Launch all the tests.

Individual scripts are available for each test suite.

The `contracts/test-utils` repository contains various helpful contracts for the tests, in particular the `ENSDeployer` that can be used in order to redeploy a suite of ENS contracts with a modified Registrar.

### Hardhat scripts

**Note:** Most of the scripts are used for development purposes. Deployment scripts for the various presets are available but it is strongly advised to understand them before using them.

#### `deploy-sdao-preset-claimable`

Deploys the SDAO Registrar Preset Claimable contract.

See `tasks/deploy-subdomain-dao/deploy-sdao-preset-claimable.ts` for the script and the full list of parameters.

#### `deploy-sdao-preset-code-accessible`

Deploys the SDAO Registrar Preset Code Accessible.

See `tasks/deploy-subdomain-dao/deploy-sdao-preset-code-accessible.ts` for the script and the full list of parameters.

#### `deploy-sdao-preset-erc721`

Deploys the SDAO Registrar Preset Limited Reserved ERC721 **and** an ERC721 Minter contracts.

See `tasks/deploy-subdomain-dao/deploy-sdao-preset-erc721.ts` for the script and the full list of parameters.

#### `deploy-sdao-preset-erc1155`

Deploys the SDAO Registrar Preset Limited Reserved ERC1155 **and** an ERC1155 Minter contracts.

See `tasks/deploy-subdomain-dao/deploy-sdao-preset-erc1155.ts` for the script and the full list of parameters.

#### `deploy-ens-full`

Deploys a suite of ENS contracts. The deployed Registrar is simplified in order to allow direct registration instead of the usual two steps registration process.

The boolean flag `sDao` allows to additionally deploy a SDAO Registrar.

See `tasks/deploy-ens-full.ts` for the script and the full list of parameters.

#### `deploy-label-booker`

Deploys a Label Booker contract.

The `name` of the targeted domain is given as parameter, i.e. `<name>.eth`.

See `tasks/deploy-label-booker.ts` for the script and the full list of parameters.

## License

The code of this repository is released under the [MIT License](LICENSE).