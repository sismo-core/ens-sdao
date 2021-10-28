pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import {GenToken} from '../GenToken.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {ENSDaoRegistrarClaimable} from '../extensions/ENSDaoRegistrarClaimable.sol';
import {ENSLabelBooker} from '../../ens-label-booker/ENSLabelBooker.sol';
import {NameWrapper} from '../../name-wrapper/NameWrapper.sol';

contract ENSDaoRegistrarPresetClaimable is ENSDaoRegistrarClaimable {
  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param nameWrapper The address of the Name Wrapper. can be 0x00
   * @param genToken The address of the DAO Token.
   * @param node The node that this registrar administers.
   * @param name The label string of the administered subdomain.
   * @param owner The owner of the contract.
   * @param ensLabelBooker The address of the ENS Label Booker.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    NameWrapper nameWrapper,
    GenToken genToken,
    bytes32 node,
    string memory name,
    address owner,
    ENSLabelBooker ensLabelBooker
  )
    ENSDaoRegistrarClaimable(ensLabelBooker, address(ensAddr), node)
    ENSDaoRegistrar(ensAddr, resolver, nameWrapper, genToken, node, name, owner)
  {}

  function _beforeRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(ENSDaoRegistrar)
  {
    super._beforeRegistration(account, labelHash);
  }

  function _afterRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(ENSDaoRegistrar)
  {
    super._afterRegistration(account, labelHash);
  }
}
