pragma solidity >=0.8.4;

import '@openzeppelin/contracts/access/Ownable.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {ENSDaoRegistrarLimited} from '../extensions/ENSDaoRegistrarLimited.sol';
import {ENSDaoRegistrarReserved} from '../extensions/ENSDaoRegistrarReserved.sol';
import {ENSDaoRegistrarERC1155Generator, IERC1155Minter} from '../extensions/ENSDaoRegistrarERC1155Generator.sol';

/**
 * @title ENSDaoRegistrarPresetERC1155.
 * @dev ENS DAO Registrar Preset using the ENSDaoRegistrarLimited, ENSDaoRegistrarReserved and ENSDaoRegistrarERC1155Generator extensions.
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
contract ENSDaoRegistrarPresetERC1155 is
  ENSDaoRegistrar,
  ENSDaoRegistrarLimited,
  ENSDaoRegistrarReserved,
  ENSDaoRegistrarERC1155Generator
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
    ENSDaoRegistrarERC1155Generator(erc1155Token)
    ENSDaoRegistrarLimited(registrationLimit)
    ENSDaoRegistrarReserved(reservationDuration)
    ENSDaoRegistrar(ensAddr, resolver, node, owner)
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
      ENSDaoRegistrar,
      ENSDaoRegistrarReserved,
      ENSDaoRegistrarLimited,
      ENSDaoRegistrarERC1155Generator
    )
  {
    super._beforeRegistration(account, labelHash);
  }

  function _afterRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(
      ENSDaoRegistrar,
      ENSDaoRegistrarLimited,
      ENSDaoRegistrarERC1155Generator
    )
  {
    super._afterRegistration(account, labelHash);
  }
}
