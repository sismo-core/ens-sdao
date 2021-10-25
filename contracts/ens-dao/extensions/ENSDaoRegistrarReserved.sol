pragma solidity >=0.8.4;

import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {ENSDaoToken} from '../ENSDaoToken.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {IENSDaoRegistrarReserved} from './IENSDaoRegistrarReserved.sol';

/**
 * @title ENSDaoRegistrarReserved contract.
 * @dev Implementation of the {IENSDaoRegistrarReserved}.
 */
abstract contract ENSDaoRegistrarReserved is
  ENSDaoRegistrar,
  IENSDaoRegistrarReserved
{
  uint256 public immutable DAO_BIRTH_DATE;
  uint256 public _reservationDuration;

  /**
   * @dev Constructor.
   * @param reservationDuration The duration of the reservation period.
   */
  constructor(uint256 reservationDuration) {
    DAO_BIRTH_DATE = block.timestamp;
    _reservationDuration = reservationDuration;
  }

  /**
   * @notice Update reservation period duration.
   * @dev Can only be called by owner.
   * @param reservationDuration The new reservation duration.
   */
  function updateReservationDuration(uint256 reservationDuration)
    public
    override
    onlyOwner
  {
    require(
      block.timestamp - DAO_BIRTH_DATE >= reservationDuration,
      'ENS_DAO_REGISTRAR_RESERVED: NEW_RESERVATION_DURATION_TOO_SHORT'
    );
    _reservationDuration = reservationDuration;
    emit ReservationDurationUpdated(reservationDuration);
  }

  /**
   * @dev Hook that is called before any registration.
   *
   *      It will pass if and only if one of the two following conditions is met:
   *        - the reservation period is not over AND (the associated .eth subdomain is free OR owned by the sender),
   *        - the reservation period is over.
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

    if (block.timestamp - DAO_BIRTH_DATE <= _reservationDuration) {
      address dotEthSubdomainOwner = ENS_REGISTRY.owner(
        keccak256(abi.encodePacked(ETH_NODE, labelHash))
      );
      require(
        dotEthSubdomainOwner == address(0x0) ||
          dotEthSubdomainOwner == _msgSender(),
        'ENS_DAO_REGISTRAR_RESERVED: SUBDOMAIN_RESERVED'
      );
    }
  }
}
