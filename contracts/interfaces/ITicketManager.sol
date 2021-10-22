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
}
