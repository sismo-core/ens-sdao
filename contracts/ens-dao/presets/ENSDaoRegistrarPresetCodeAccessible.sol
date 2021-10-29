pragma solidity >=0.8.4;

import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {ENSDaoRegistrarLimited} from '../extensions/ENSDaoRegistrarLimited.sol';
import {ENSDaoRegistrarCodeAccessible} from '../extensions/ENSDaoRegistrarCodeAccessible.sol';

contract ENSDaoRegistrarPresetCodeAccessible is
  ENSDaoRegistrar,
  ENSDaoRegistrarCodeAccessible
{
  uint256 public _groupId;

  event GroupIdUpdated(uint256 groupId);

  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param node The node that this registrar administers.
   * @param name The label string of the administered subdomain.
   * @param owner The owner of the contract.
   * @param domainName The name field of the EIP712 Domain.
   * @param domainVersion The version field of the EIP712 Domain.
   * @param groupId The initial group ID.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    bytes32 node,
    string memory name,
    address owner,
    string memory domainName,
    string memory domainVersion,
    uint256 groupId
  )
    ENSDaoRegistrarCodeAccessible(domainName, domainVersion)
    ENSDaoRegistrar(ensAddr, resolver, node, name, owner)
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
