pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {ENSDaoRegistrarClaimable} from '../extensions/ENSDaoRegistrarClaimable.sol';
import {ENSLabelBooker} from '../../ens-label-booker/ENSLabelBooker.sol';

/**
 * @title ENSDaoRegistrarPresetClaimable.
 * @dev ENS DAO Registrar Preset using the ENSDaoRegistrarClaimable extension.
 *
 *      This preset interacts with an ENS Label Booker contract.
 *      It allows an owner to book various labels on the ENS Label Booker.
 *
 */
contract ENSDaoRegistrarPresetClaimable is
  ENSDaoRegistrar,
  ENSDaoRegistrarClaimable
{
  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param node The node that this registrar administers.
   * @param owner The owner of the contract.
   * @param ensLabelBooker The address of the ENS Label Booker.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    bytes32 node,
    address owner,
    ENSLabelBooker ensLabelBooker
  )
    ENSDaoRegistrarClaimable(ensLabelBooker, address(ensAddr), node)
    ENSDaoRegistrar(ensAddr, resolver, node, owner)
  {}

  function register(string memory label)
    public
    override(ENSDaoRegistrar, ENSDaoRegistrarClaimable)
  {
    ENSDaoRegistrarClaimable.register(label);
  }
}
