pragma solidity >=0.8.4;

import {IENSDaoRegistrar} from '../../IENSDaoRegistrar.sol';

/**
 * @title IENSDaoRegistrarCodeAccessible interface.
 * @notice An optional extension introducing the registration with named access code.
 */
interface IENSDaoRegistrarCodeAccessible is IENSDaoRegistrar {
  /**
   * @dev Emitted when an access code is consumed.
   */
  event AccessCodeConsumed(uint256 groupId, bytes accessCode);

  /**
   * @notice Register a name and mints.
   * @param label The label to register.
   * @param accessCode The EIP712 signature corresponding to a groupId and the recipient address.
   *
   * Emits a {AccessCodeConsumed} and a {NameRegistered} events.
   */
  function registerWithAccessCode(string memory label, bytes memory accessCode)
    external;
}
