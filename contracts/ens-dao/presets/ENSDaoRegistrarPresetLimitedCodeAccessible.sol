pragma solidity >=0.8.4;

import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {ENSDaoToken} from '../ENSDaoToken.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {ENSDaoRegistrarLimited} from '../extensions/ENSDaoRegistrarLimited.sol';
import {ENSDaoRegistrarLimitedCodeAccessible} from '../extensions/ENSDaoRegistrarLimitedCodeAccessible.sol';

contract ENSDaoRegistrarPresetLimitedCodeAccessible is
  ENSDaoRegistrar,
  ENSDaoRegistrarLimited,
  ENSDaoRegistrarLimitedCodeAccessible
{
  uint256 public _groupId;

  event GroupIdUpdated(uint256 groupId);

  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param daoToken The address of the DAO Token.
   * @param node The node that this registrar administers.
   * @param name The label string of the administered subdomain.
   * @param owner The owner of the contract.
   * @param domainName The name field of the EIP712 Domain.
   * @param domainVersion The version field of the EIP712 Domain.
   * @param registrationLimit The limit of registration number.
   * @param groupId The initial group ID.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    ENSDaoToken daoToken,
    bytes32 node,
    string memory name,
    address owner,
    string memory domainName,
    string memory domainVersion,
    uint256 registrationLimit,
    uint256 groupId
  )
    ENSDaoRegistrarLimitedCodeAccessible(domainName, domainVersion)
    ENSDaoRegistrarLimited(registrationLimit)
    ENSDaoRegistrar(ensAddr, resolver, daoToken, node, name, owner)
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

  function _beforeRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(ENSDaoRegistrar, ENSDaoRegistrarLimited)
  {
    super._beforeRegistration(account, labelHash);
  }

  function _afterRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(ENSDaoRegistrar, ENSDaoRegistrarLimited)
  {
    super._afterRegistration(account, labelHash);
  }
}
