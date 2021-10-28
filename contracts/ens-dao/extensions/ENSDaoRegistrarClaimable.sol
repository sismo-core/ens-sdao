pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {IENSDaoRegistrar} from '../IENSDaoRegistrar.sol';
import {IENSDaoRegistrarClaimable} from './IENSDaoRegistrarClaimable.sol';
import {ENSLabelBooker} from '../../ens-label-booker/ENSLabelBooker.sol';

/**
 * @title ENSDaoRegistrarClaimable contract.
 * @dev Implementation of the {IENSDaoRegistrarClaimable}.
 */
abstract contract ENSDaoRegistrarClaimable is
  ENSDaoRegistrar,
  IENSDaoRegistrarClaimable
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
      'ENS_DAO_REGISTRAR_CLAIMABLE: INVALID_ENS_LABEL_BOOKER_ADDRESS'
    );
    require(
      ensRegistryAddress == address(ensLabelBooker.ENS_REGISTRY()),
      'ENS_DAO_REGISTRAR_CLAIMABLE: REGISTRY_MISMATCH'
    );
    require(
      rootNode == ensLabelBooker.ROOT_NODE(),
      'ENS_DAO_REGISTRAR_CLAIMABLE: NODE_MISMATCH'
    );
    ENS_LABEL_BOOKER = ensLabelBooker;
  }

  /**
   * @notice Claim a booked name.
   * @dev Can only be called if and only if
   *  - the subdomain is booked,
   *  - the sender is either the booked address, either the owner,
   *  - the subdomain of the root node is free,
   *  - sender does not already have a DAO token OR sender is the owner.
   * @param label The label to claim.
   * @param account The account to which the registration is done.
   */
  function claim(string memory label, address account) public override {
    bytes32 labelHash = keccak256(bytes(label));
    address bookingAddress = ENS_LABEL_BOOKER.getBooking(labelHash);
    require(
      bookingAddress != address(0),
      'ENS_DAO_REGISTRAR_CLAIMABLE: LABEL_NOT_BOOKED'
    );
    require(
      bookingAddress == _msgSender() || owner() == _msgSender(),
      'ENS_DAO_REGISTRAR_CLAIMABLE: SENDER_NOT_ALLOWED'
    );

    _register(account, label, labelHash);

    ENS_LABEL_BOOKER.deleteBooking(labelHash);
  }

  /**
   * @notice Register a name and mints a DAO token.
   * @dev Can only be called with labels that are not booked.
   *      Uses the `register` method of the EnsDaoRegistrar.
   */
  function register(string memory label)
    public
    virtual
    override(ENSDaoRegistrar, IENSDaoRegistrar)
  {
    bytes32 labelHash = keccak256(bytes(label));
    require(
      ENS_LABEL_BOOKER.getBooking(labelHash) == address(0),
      'ENS_DAO_REGISTRAR_CLAIMABLE: LABEL_BOOKED'
    );
    super.register(label);
  }
}
