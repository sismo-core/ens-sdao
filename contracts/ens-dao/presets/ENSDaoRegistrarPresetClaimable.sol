pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {ENSDaoRegistrarClaimable} from '../extensions/ENSDaoRegistrarClaimable.sol';
import {ENSLabelBooker} from '../../ens-label-booker/ENSLabelBooker.sol';

contract ENSDaoRegistrarPresetClaimable is
  ENSDaoRegistrar,
  ENSDaoRegistrarClaimable
{
  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param node The node that this registrar administers.
   * @param name The label string of the administered subdomain.
   * @param owner The owner of the contract.
   * @param ensLabelBooker The address of the ENS Label Booker.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    bytes32 node,
    string memory name,
    address owner,
    ENSLabelBooker ensLabelBooker
  )
    ENSDaoRegistrarClaimable(ensLabelBooker, address(ensAddr), node)
    ENSDaoRegistrar(ensAddr, resolver, node, name, owner)
  {}

  function register(string memory label)
    public
    override(ENSDaoRegistrar, ENSDaoRegistrarClaimable)
  {
    ENSDaoRegistrarClaimable.register(label);
  }
}
