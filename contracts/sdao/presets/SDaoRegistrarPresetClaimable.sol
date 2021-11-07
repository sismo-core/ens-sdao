// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import {SDaoRegistrar} from '../SDaoRegistrar.sol';
import {SDaoRegistrarClaimable} from '../extensions/SDaoRegistrarClaimable.sol';
import {ENSLabelBooker} from '../../ens-label-booker/ENSLabelBooker.sol';

/**
 * @title SDaoRegistrarPresetClaimable.
 * @dev Subdomain DAO Registrar Preset using the SDaoRegistrarClaimable extension.
 *
 *      This preset interacts with an ENS Label Booker contract.
 *      It allows an owner to book various labels on the ENS Label Booker.
 *      The address associated to a booking is then able to claim the label.
 *      The booked label can not be registered using the public `register` method.
 *
 */
contract SDaoRegistrarPresetClaimable is SDaoRegistrar, SDaoRegistrarClaimable {
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
    SDaoRegistrarClaimable(ensLabelBooker, address(ensAddr), node)
    SDaoRegistrar(ensAddr, resolver, node, owner)
  {}

  function register(string memory label)
    public
    override(SDaoRegistrar, SDaoRegistrarClaimable)
  {
    SDaoRegistrarClaimable.register(label);
  }
}
