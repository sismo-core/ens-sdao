pragma solidity >=0.8.4;

import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '../../name-wrapper/NameWrapper.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import {ENSDaoToken} from '../ENSDaoToken.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
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
  function claim(string memory label, address account) external override {
    bytes32 labelHash = keccak256(bytes(label));
    require(
      ENS_LABEL_BOOKER.getBooking(labelHash) != address(0),
      'ENS_DAO_REGISTRAR: LABEL_NOT_BOOKED'
    );

    _register(account, label, labelHash);

    ENS_LABEL_BOOKER.deleteBooking(labelHash);
  }

  /**
   * @dev Hook that is called before any registration.
   *      It will pass if and only if one of the two following conditions is met:
   *        - the label is not booked,
   *        - the label is booked AND (the sender is the booking address OR the owner).
   *
   * @param account The address for which the reservation is made.
   * @param labelHash The hash of the label to register.
   */
  function _beforeRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override
  {
    super._beforeRegistration(account, labelHash);

    address bookingAddress = ENS_LABEL_BOOKER.getBooking(labelHash);
    if (bookingAddress != address(0)) {
      require(
        bookingAddress == _msgSender() || owner() == _msgSender(),
        'ENS_DAO_REGISTRAR_CLAIMABLE: SENDER_NOT_ALLOWED'
      );
    }
  }
}
