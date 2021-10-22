pragma solidity >=0.8.4;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import {ITicketManager} from './interfaces/ITicketManager.sol';

/**
 * @title TicketManager.
 * @dev Implementation of the {ITicketManager}.
 */
contract TicketManager is Ownable, ITicketManager {
  using ECDSA for bytes32;

  mapping(uint256 => uint256) private _counters;
  mapping(bytes32 => bool) private _consumedTickets;

  uint256 public _ticketGroupLimit;
  address public _auxiliary;

  modifier onlyOwnerOrAuxiliary() {
    require(
      owner() == _msgSender() || _auxiliary == _msgSender(),
      'TICKET_MANAGER: CALL_NOT_AUTHORIZED'
    );
    _;
  }

  /**
   * @dev Constructor.
   * @param ticketGroupLimit The max ticket group consumption.
   * @param owner The owner of the contract.
   */
  constructor(uint256 ticketGroupLimit, address owner) {
    _ticketGroupLimit = ticketGroupLimit;

    transferOwnership(owner);
  }

  /**
   * @notice Get if a ticket has been consumed.
   * @param data The data field of the ticket.
   * @return True if the ticket is consumed, false otherwise.
   */
  function isTicketConsumed(bytes32 data)
    external
    view
    override
    returns (bool)
  {
    return _consumedTickets[data];
  }

  /**
   * @notice Get the amount of consumed tickets for a particular nonce.
   * @param groupNonce Nonce of the group the ticket belongs too.
   * @return The amount of consumed tickets for the nonce parameter.
   */
  function consumedNumber(uint256 groupNonce)
    external
    view
    override
    returns (uint256)
  {
    return _counters[groupNonce];
  }

  /**
   * @notice Consume a ticket after validating it.
   * @dev Can only be called by the owner or the auxiliary.
   * @param groupNonce Nonce of the group the ticket belongs too.
   * @param data The data field of the ticket.
   * @param signature The signature of the data field of the ticket.
   */
  function consumeTicket(
    uint256 groupNonce,
    bytes32 data,
    bytes memory signature
  ) external override onlyOwnerOrAuxiliary {
    require(!_consumedTickets[data], 'TICKET_MANAGER: TICKET_ALREADY_CONSUMED');
    require(
      _counters[groupNonce] < _ticketGroupLimit,
      'TICKET_MANAGER: TICKET_GROUP_LIMIT_REACHED'
    );
    require(
      data.toEthSignedMessageHash().recover(signature) == owner(),
      'TICKET_MANAGER: INVALID_TICKET'
    );

    _counters[groupNonce] += 1;
    _consumedTickets[data] = true;

    emit TicketConsumed(groupNonce, data);
  }

  /**
   * @notice Update the ticket group limit.
   * @dev Can only be called by the owner.
   * @param newTicketGroupLimit The new ticket group limit.
   */
  function updateTicketGroupLimit(uint256 newTicketGroupLimit)
    external
    override
    onlyOwner
  {
    _ticketGroupLimit = newTicketGroupLimit;
    emit TicketGroupLimitUpdated(newTicketGroupLimit);
  }

  /**
   * @notice Set the auxiliary address.
   * @dev Can only be called by the owner
   * @param auxiliary The new auxiliary address.
   */
  function setAuxiliary(address auxiliary) external override onlyOwner {
    _auxiliary = auxiliary;
    emit AuxiliarySet(auxiliary);
  }
}
