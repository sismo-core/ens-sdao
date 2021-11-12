// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {SDaoRegistrar} from '../SDaoRegistrar.sol';
import {ISDaoRegistrar} from '../ISDaoRegistrar.sol';
import {ISDaoRegistrarClaimable} from './interfaces/ISDaoRegistrarClaimable.sol';
import {ENSLabelBooker} from '../../ens-label-booker/ENSLabelBooker.sol';

/**
 * @title SDaoRegistrarClaimable contract.
 * @dev Implementation of the {ISDaoRegistrarClaimable}.
 */
abstract contract SDaoRegistrarClaimable is
  SDaoRegistrar,
  ISDaoRegistrarClaimable
{
  ENSLabelBooker public immutable ENS_LABEL_BOOKER;

  /**
   * @dev Constructor.
   * @param ensLabelBooker The address of the ENS Label Booker.
   * @param ensRegistryAddress The address of the ENS registry.
   * @param rootNode The node that the registrar administers.
   */
  constructor(
    ENSLabelBooker ensLabelBooker,
    address ensRegistryAddress,
    bytes32 rootNode
  ) {
    require(
      address(ensLabelBooker) != address(0),
      'SDAO_REGISTRAR_CLAIMABLE: INVALID_ENS_LABEL_BOOKER_ADDRESS'
    );
    require(
      ensRegistryAddress == address(ensLabelBooker.ENS_REGISTRY()),
      'SDAO_REGISTRAR_CLAIMABLE: REGISTRY_MISMATCH'
    );
    require(
      rootNode == ensLabelBooker.ROOT_NODE(),
      'SDAO_REGISTRAR_CLAIMABLE: NODE_MISMATCH'
    );
    ENS_LABEL_BOOKER = ensLabelBooker;
  }

  /**
   * @notice Claim a booked name.
   * @dev Can only be called if and only if
   *  - the subdomain is booked,
   *  - the sender is either the booked address, either the owner.
   * @param label The label to claim.
   * @param account The account to which the registration is done.
   */
  function claim(string memory label, address account) public override {
    bytes32 labelHash = keccak256(bytes(label));
    address bookingAddress = ENS_LABEL_BOOKER.getBooking(labelHash);
    require(
      bookingAddress != address(0),
      'SDAO_REGISTRAR_CLAIMABLE: LABEL_NOT_BOOKED'
    );
    require(
      bookingAddress == _msgSender() || owner() == _msgSender(),
      'SDAO_REGISTRAR_CLAIMABLE: SENDER_NOT_ALLOWED'
    );

    _register(account, label);

    ENS_LABEL_BOOKER.deleteBooking(labelHash);
  }

  /**
   * @notice Register a name.
   * @dev Can only be called if label is not booked.
   */
  function register(string memory label)
    public
    virtual
    override(SDaoRegistrar, ISDaoRegistrar)
  {
    bytes32 labelHash = keccak256(bytes(label));
    require(
      ENS_LABEL_BOOKER.getBooking(labelHash) == address(0),
      'SDAO_REGISTRAR_CLAIMABLE: LABEL_BOOKED'
    );
    super.register(label);
  }
}
