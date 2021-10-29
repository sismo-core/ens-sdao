pragma solidity >=0.8.4;

import {IENSDaoRegistrar} from '../../IENSDaoRegistrar.sol';

/**
 * @title IENSDaoRegistrarLimited interface.
 * @notice An optional extension introducing a controlled limit on the number of registrations.
 */
interface IENSDaoRegistrarLimited is IENSDaoRegistrar {
  /**
   * @dev Emitted when the registration limit is updated.
   */
  event RegistrationLimitUpdated(uint256 registrationLimit);

  /**
   * @notice Update registration limit.
   * @param registrationLimit The new registration limit.
   *
   * Emits a {RegistrationLimitUpdated} event.
   */
  function updateRegistrationLimit(uint256 registrationLimit) external;
}
