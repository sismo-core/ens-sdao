// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {SDaoRegistrar} from '../SDaoRegistrar.sol';
import {SDaoRegistrarLimited} from '../extensions/SDaoRegistrarLimited.sol';
import {SDaoRegistrarReserved} from '../extensions/SDaoRegistrarReserved.sol';
import {SDaoRegistrarERC721Generator, IERC721Minter} from '../extensions/SDaoRegistrarERC721Generator.sol';

/**
 * @title SDaoRegistrarPresetERC721.
 * @dev Subdomain DAO Registrar Preset using the SDaoRegistrarLimited, SDaoRegistrarReserved and SDaoRegistrarERC721Generator extensions.
 *
 *      This preset allows to register and mint for each registration an associated ERC721 token.
 *      Only one ERC721 token is allowed by address.
 *
 *      Additionally, this preset allows to limit the number of possible registrations.
 *      This limit is controlled by the owner of the contract.
 *
 *      Finally, this preset allows to reserve <subdomain>.<domain>.eth for owner of <subdomain>.eth during a specific duration.
 *      This duration is controlled by the owner.
 *
 */
contract SDaoRegistrarPresetERC721 is
  SDaoRegistrar,
  SDaoRegistrarLimited,
  SDaoRegistrarReserved,
  SDaoRegistrarERC721Generator
{
  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param erc721Token The address of the ERC721 Token.
   * @param node The node that this registrar administers.
   * @param owner The owner of the contract.
   * @param reservationDuration The duration of the reservation period.
   * @param registrationLimit The limit of registration number.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    IERC721Minter erc721Token,
    bytes32 node,
    address owner,
    uint256 reservationDuration,
    uint256 registrationLimit
  )
    SDaoRegistrarERC721Generator(erc721Token)
    SDaoRegistrarLimited(registrationLimit)
    SDaoRegistrarReserved(reservationDuration)
    SDaoRegistrar(ensAddr, resolver, node, owner)
  {}

  function _beforeRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(
      SDaoRegistrar,
      SDaoRegistrarReserved,
      SDaoRegistrarLimited,
      SDaoRegistrarERC721Generator
    )
  {
    super._beforeRegistration(account, labelHash);
  }

  function _afterRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(SDaoRegistrar, SDaoRegistrarLimited, SDaoRegistrarERC721Generator)
  {
    super._afterRegistration(account, labelHash);
  }
}
