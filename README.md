# Quick Review (10-15 min max!)

Thanks a lot for your time. This Readme to help you save some.

## Context

This is a ENS centric framework which allows a project (e.g Sismo), that own an ENS name (e.g `sismo.eth`) to give subdomains (e.g `user1.sismo.eth`) and create a DAO of all subdomains owners.

This is what we called an ENS DAO: a DAO which is organized with:
- ENS gated tools (discord w/ collab.land)
- [Snapshot](https://snapshot.org/#/sismo.eth) subdomain votes.


## Code to check 🙏

We took inspiration from openzepellin's contracts packages. We would like to have your feedback on the `contracts/ens-dao` contracts (to be packaged and open sourced).

We, of course, are not asking for free audit. We are mainly asking wether we correctly used the concept of extensions and presets.

A DAO is mainly two contracts: the ENSRegistrar (which gives subdomains) and an optional NFT given to subdomain owners (when ENS's official nameWrapper will be deployed, we will update)

- `ens-dao/ENSDaoRegistrar.sol`: core contract. This is the contract that owns `domain.eth` and distribute `username.domain.eth`. The registration through the public `register` can be paused.
- `ens-dao/extensions` extensions on the ENSDaoRegistrar
  - `ENSDaoRegistrarClaimable.sol`: the owner can prebook some subdomains (via an external LabelBooker Contract) that can be claimed.
  - `ENSDaoRegistrarCodeAccessible.sol`: registrants must have a accessCode to register. This access code has been signed and given offchain by the        `codeSigner` address
  - `ENSDaoRegistrarLimited.sol`: Only a max number of subdomains are distributed
  - `ENSDaoRegistrarReserved.sol`: For a duration, only the owner of `user.eth` can register `user.domain.eth`
  - `ENSDaoRegistrarLimitedERC721Generator.sol`: Each subdomain owner gets a ERC721. One token allowed per address. (Note they are not tied to ownership, ERC721 is independent)
  - `ENSDaoRegistrarLimitedERC1155Generator.sol`: Each subdomain owner gets a ERC1155. One token allowed per address. (Note they are not tied to ownership, ERC1155 is independent))
- `ens-dao/presets`  some presets easy to read.


Thanks a lot!