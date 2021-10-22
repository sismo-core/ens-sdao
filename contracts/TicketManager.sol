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

  struct TicketGroup {
    uint256 counter;
    mapping(bytes32 => bool) consumed;
  }

  mapping(uint256 => TicketGroup) private _ticketGroups;

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
    require(
      !_ticketGroups[groupNonce].consumed[data],
      'TICKET_MANAGER: TICKET_ALREADY_CONSUMED'
    );
    require(
      _ticketGroups[groupNonce].counter < _ticketGroupLimit,
      'TICKET_MANAGER: TICKET_GROUP_LIMIT_REACHED'
    );
    require(
      data.toEthSignedMessageHash().recover(signature) == owner(),
      'TICKET_MANAGER: INVALID_TICKET'
    );

    TicketGroup storage ticketGroup = _ticketGroups[groupNonce];
    ticketGroup.consumed[data] = true;
    ticketGroup.counter += 1;

    emit TicketConsumed(groupNonce, data);
  }
}
