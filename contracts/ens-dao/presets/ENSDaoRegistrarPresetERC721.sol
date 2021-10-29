pragma solidity >=0.8.4;

import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {ENSDaoRegistrarLimited} from '../extensions/ENSDaoRegistrarLimited.sol';
import {ENSDaoRegistrarReserved} from '../extensions/ENSDaoRegistrarReserved.sol';
import {ENSDaoRegistrarERC721Generator, IERC721Minter} from '../extensions/ENSDaoRegistrarERC721Generator.sol';

contract ENSDaoRegistrarPresetERC721 is
  ENSDaoRegistrar,
  ENSDaoRegistrarLimited,
  ENSDaoRegistrarReserved,
  ENSDaoRegistrarERC721Generator
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
    ENSDaoRegistrarERC721Generator(erc721Token)
    ENSDaoRegistrarLimited(registrationLimit)
    ENSDaoRegistrarReserved(reservationDuration)
    ENSDaoRegistrar(ensAddr, resolver, node, owner)
  {}

  function _beforeRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(
      ENSDaoRegistrar,
      ENSDaoRegistrarReserved,
      ENSDaoRegistrarLimited,
      ENSDaoRegistrarERC721Generator
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
      ENSDaoRegistrarERC721Generator
    )
  {
    super._afterRegistration(account, labelHash);
  }
}
