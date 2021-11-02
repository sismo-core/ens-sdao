pragma solidity >=0.8.4;

import {ISDaoRegistrar} from '../../ISDaoRegistrar.sol';

/**
 * @title ISDaoRegistrarReserved interface.
 * @notice An optional extension introducing a controlled reservation period.
 *         Within the registration period, only the owners of the associated .eth subdomain may register this subdomain.
 */
interface ISDaoRegistrarReserved is ISDaoRegistrar {
  /**
   * @dev Emitted when the reservation duration is updated.
   */
  event ReservationDurationUpdated(uint256 reservationDuration);

  /**
   * @notice Update reservation duration.
   *
   * Emits a {ReservationDurationUpdated} event.
   */
  function updateReservationDuration(uint256 reservationDuration) external;
}
