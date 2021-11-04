// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {SDaoRegistrar} from '../SDaoRegistrar.sol';
import {SDaoRegistrarCodeAccessible} from '../extensions/SDaoRegistrarCodeAccessible.sol';

/**
 * @title SDaoRegistrarPresetCodeAccessible.
 * @dev Subdomain DAO Registrar Preset using the SDaoRegistrarCodeAccessible extension.
 *
 *      This preset allows to register using access code.
 *      An access code is created for one specific address. Only this specific address can use it.
 *      An access code can only be used once.
 *      An access code is linked to a group ID.
 *      The current group ID is controlled by the owner of the contract.
 *
 */
contract SDaoRegistrarPresetCodeAccessible is
  SDaoRegistrar,
  SDaoRegistrarCodeAccessible
{
  uint256 public _groupId;

  event GroupIdUpdated(uint256 groupId);

  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param node The node that this registrar administers.
   * @param owner The owner of the contract.
   * @param domainName The name field of the EIP712 Domain.
   * @param domainVersion The version field of the EIP712 Domain.
   * @param codeSigner The address of the code signer.
   * @param groupId The initial group ID.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    bytes32 node,
    address owner,
    string memory domainName,
    string memory domainVersion,
    address codeSigner,
    uint256 groupId
  )
    SDaoRegistrarCodeAccessible(domainName, domainVersion, codeSigner)
    SDaoRegistrar(ensAddr, resolver, node, owner)
  {
    _groupId = groupId;
  }

  function updateGroupId(uint256 groupId) external onlyOwner {
    _groupId = groupId;
    emit GroupIdUpdated(groupId);
  }

  function _getCurrentGroupId() internal view override returns (uint256) {
    return _groupId;
  }
}
