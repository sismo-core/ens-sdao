pragma solidity >=0.8.4;

import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '../../name-wrapper/NameWrapper.sol';
import {ENSDaoToken} from '../ENSDaoToken.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {ENSDaoRegistrarLimited} from '../extensions/ENSDaoRegistrarLimited.sol';
import {ENSDaoRegistrarTicketable} from '../extensions/ENSDaoRegistrarTicketable.sol';

contract ENSDaoRegistrarPresetLimitedTicketable is ENSDaoRegistrarTicketable {
  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param nameWrapper The address of the Name Wrapper. can be 0x00
   * @param daoToken The address of the DAO Token.
   * @param node The node that this registrar administers.
   * @param name The label string of the administered subdomain.
   * @param owner The owner of the contract.
   * @param registrationLimit The limit of registration number.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    NameWrapper nameWrapper,
    ENSDaoToken daoToken,
    bytes32 node,
    string memory name,
    address owner,
    string memory domainName,
    string memory domainVersion,
    uint256 chainId,
    uint256 registrationLimit
  )
    ENSDaoRegistrarTicketable(
      domainName,
      domainVersion,
      chainId,
      registrationLimit
    )
    ENSDaoRegistrar(ensAddr, resolver, nameWrapper, daoToken, node, name, owner)
  {}

  function _getCurrentGroupId() internal view override returns (uint256) {
    return block.timestamp / 604800;
  }

  function _beforeRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(ENSDaoRegistrarLimited)
  {
    super._beforeRegistration(account, labelHash);
  }

  function _afterRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(ENSDaoRegistrarLimited)
  {
    super._afterRegistration(account, labelHash);
  }
}
