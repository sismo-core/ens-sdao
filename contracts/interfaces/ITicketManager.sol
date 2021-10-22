pragma solidity >=0.8.4;

/**
 * @title ITicketManager interface
 * @notice An owned contract that allows the owner and an auxiliary to manage ticket consumption.
 *
 *         A ticket is defined by a bytes32 data and its signature by the owner.
 *
 *         A ticket can only be consumed.
 */
interface ITicketManager {
  /**
   * @dev Emitted when a booking is deleted.
   */
  event TicketConsumed(uint256 indexed groupNonce, bytes32 indexed data);
  /**
   * @dev Emitted when a new auxiliary has been set.
   */
  event AuxiliarySet(address indexed auxiliary);

  /**
   * @dev Emitted when a new ticket group limit has been set.
   */
  event TicketGroupLimitUpdated(uint256 newTicketGroupLimit);

  /**
   * @notice Get if a ticket has been consumed.
   * @param data The data field of the ticket.
   * @return True if the ticket is consumed, false otherwise.
   */
  function isTicketConsumed(bytes32 data) external view returns (bool);

  /**
   * @notice Get the amount of consumed tickets for a particular nonce.
   * @param groupNonce Nonce of the group the ticket belongs too.
   * @return The amount of consumed tickets for the nonce parameter.
   */
  function consumedNumber(uint256 groupNonce) external view returns (uint256);

  /**
   * @notice Consume a ticket after validating it.
   * @param groupNonce Nonce of the group the ticket belongs too.
   * @param data The data field of the ticket.
   * @param signature The signature of the data field of the ticket.
   *
   * Emits a {TicketConsumed} event.
   */
  function consumeTicket(
    uint256 groupNonce,
    bytes32 data,
    bytes memory signature
  ) external;

  /**
   * @notice Update the ticket group limit number.
   * @param newTicketGroupLimit The new ticket group limit.
   *
   * Emits a {TicketGroupLimitUpdated} event.
   */
  function updateTicketGroupLimit(uint256 newTicketGroupLimit) external;

  /**
   * @notice Set the auxiliary.
   * @param auxiliary the new auxiliary.
   *
   * Emits a {NewAuxiliary} event.
   */
  function setAuxiliary(address auxiliary) external;
}
