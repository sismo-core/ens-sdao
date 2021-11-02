pragma solidity >=0.8.4;

import {ISDaoRegistrar} from '../../ISDaoRegistrar.sol';

/**
 * @title ISDaoRegistrarCodeAccessible interface.
 * @notice An optional extension introducing the registration with named access code.
 */
interface ISDaoRegistrarCodeAccessible is ISDaoRegistrar {
  /**
   * @dev Emitted when an access code is consumed.
   */
  event AccessCodeConsumed(uint256 groupId, bytes accessCode);

  /**
   * @dev Emitted when the code signer is updated.
   */
  event CodeSignerUpdated(address codeSigner);

  /**
   * @notice Register a name and mints.
   * @param label The label to register.
   * @param recipient Address of the recipient of the registration.
   * @param accessCode The EIP712 signature corresponding to a groupId and the recipient address.
   *
   * Emits a {AccessCodeConsumed} and a {NameRegistered} events.
   */
  function registerWithAccessCode(
    string memory label,
    address recipient,
    bytes memory accessCode
  ) external;

  /**
   * @notice Update the code signer.
   * @param codeSigner The address of the code signer.
   *
   * Emits a {CodeSignerUpdated} event.
   */
  function updateCodeSigner(address codeSigner) external;
}
