pragma solidity >=0.8.4;

import {IENSDaoRegistrar} from '../../IENSDaoRegistrar.sol';

/**
 * @title IENSDaoRegistrarReserved interface.
 * @notice An optional extension introducing a controlled reservation period.
 *         Within the registration period, only the owners of the associated .eth subdomain may register this subdomain.
 */
interface IENSDaoRegistrarReserved is IENSDaoRegistrar {
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
