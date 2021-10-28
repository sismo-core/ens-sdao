pragma solidity >=0.8.4;

import {IENSDaoRegistrarLimited} from './IENSDaoRegistrarLimited.sol';

/**
 * @title IENSDaoRegistrarLimitedCodeAccessible interface.
 * @notice An optional extension introducing the registration with named access code.
 *
 *         An access code can be used to register even if the registration limit is reached.
 *
 *         This extension is an extension of the IENSDaoRegistrarLimited extension.
 *         The reason is that access codes do not make sense if the number of registration is not limited.
 */
interface IENSDaoRegistrarLimitedCodeAccessible is IENSDaoRegistrarLimited {
  /**
   * @dev Emitted when an access code is consumed.
   */
  event AccessCodeConsumed(uint256 groupId, bytes accessCode);

  /**
   * @notice Register a name and mints a DAO token using an access code.
   * @param label The label to register.
   * @param accessCode The EIP712 signature corresponding to a groupId and the recipient address.
   *
   * Emits a {AccessCodeConsumed} and a {NameRegistered} events.
   */
  function registerWithAccessCode(string memory label, bytes memory accessCode)
    external;
}
