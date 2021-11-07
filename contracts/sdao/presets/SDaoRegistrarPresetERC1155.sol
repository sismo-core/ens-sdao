// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import '@openzeppelin/contracts/access/Ownable.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {SDaoRegistrar} from '../SDaoRegistrar.sol';
import {SDaoRegistrarLimited} from '../extensions/SDaoRegistrarLimited.sol';
import {SDaoRegistrarReserved} from '../extensions/SDaoRegistrarReserved.sol';
import {SDaoRegistrarERC1155Generator, IERC1155Minter} from '../extensions/SDaoRegistrarERC1155Generator.sol';

/**
 * @title SDaoRegistrarPresetERC1155.
 * @dev Subdomain DAO Registrar Preset using the SDaoRegistrarLimited, SDaoRegistrarReserved and SDaoRegistrarERC1155Generator extensions.
 *
 *      This preset allows to register and mint for each registration an associated ERC1155 token.
 *      Only one ERC1155 token is allowed by address.
 *      The token ID is hardcoded to 0 in this implementation.
 *      One may implement different solutions in order to have a dynamic token ID.
 *
 *      Additionally, this preset allows to limit the number of possible registrations.
 *      This limit is controlled by the owner of the contract.
 *
 *      Finally, this preset allows to reserve <subdomain>.<domain>.eth for owner of <subdomain>.eth during a specific duration.
 *      This duration is controlled by the owner.
 *
 */
contract SDaoRegistrarPresetERC1155 is
  SDaoRegistrar,
  SDaoRegistrarLimited,
  SDaoRegistrarReserved,
  SDaoRegistrarERC1155Generator
{
  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param erc1155Token The address of the ERC1155 Token.
   * @param node The node that this registrar administers.
   * @param owner The owner of the contract.
   * @param reservationDuration The duration of the reservation period.
   * @param registrationLimit The limit of registration number.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    IERC1155Minter erc1155Token,
    bytes32 node,
    address owner,
    uint256 reservationDuration,
    uint256 registrationLimit
  )
    SDaoRegistrarERC1155Generator(erc1155Token)
    SDaoRegistrarLimited(registrationLimit)
    SDaoRegistrarReserved(reservationDuration)
    SDaoRegistrar(ensAddr, resolver, node, owner)
  {}

  function _balanceOf(address account)
    internal
    view
    override
    returns (uint256)
  {
    return ERC1155_MINTER.balanceOf(account, 0);
  }

  function _getToken(address account, bytes32 labelHash)
    internal
    view
    override
    returns (uint256, bytes memory)
  {
    bytes memory data;
    return (0, data);
  }

  function _beforeRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(
      SDaoRegistrar,
      SDaoRegistrarReserved,
      SDaoRegistrarLimited,
      SDaoRegistrarERC1155Generator
    )
  {
    super._beforeRegistration(account, labelHash);
  }

  function _afterRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(SDaoRegistrar, SDaoRegistrarLimited, SDaoRegistrarERC1155Generator)
  {
    super._afterRegistration(account, labelHash);
  }
}
