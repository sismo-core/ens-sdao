pragma solidity >=0.8.4;

import {IENSDaoRegistrarLimited} from './IENSDaoRegistrarLimited.sol';

/**
 * @title IENSDaoRegistrarTicketable interface.
 * @notice An optional extension introducing the registration with named tickets.
 *
 *         This extension is an extension of the IENSDaoRegistrarLimited extension.
 *         The reason is that tickets do not make sense if the number of registration is not limited.
 */
interface IENSDaoRegistrarTicketable is IENSDaoRegistrarLimited {
  /**
   * @dev Emitted when a ticket is consumed.
   */
  event TicketConsumed(uint256 groupId, bytes signedTicket);

  /**
   * @notice Register a name and mints a DAO token using a ticket.
   * @param label The label to register.
   * @param signedTicket The EIP712 signature corresponding to a groupId and the recipient address.
   *
   * Emits a {TicketConsumed} and a {NameRegistered} events.
   */
  function registerWithTicket(string memory label, bytes memory signedTicket)
    external;
}
