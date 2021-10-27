pragma solidity >=0.8.4;

import {ENSDaoRegistrarLimited} from './ENSDaoRegistrarLimited.sol';
import {IENSDaoRegistrarTicketable} from './IENSDaoRegistrarTicketable.sol';

import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

abstract contract ENSDaoRegistrarTicketable is
  ENSDaoRegistrarLimited,
  IENSDaoRegistrarTicketable
{
  using ECDSA for bytes32;

  mapping(bytes32 => bool) public _consumed;

  struct EIP712Domain {
    string name;
    string version;
    uint256 chainId;
    address verifyingContract;
  }

  struct Ticket {
    address recipient;
    uint256 groupId;
  }

  bytes32 constant EIP712DOMAIN_TYPEHASH =
    keccak256(
      'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
    );
  bytes32 constant TICKET_TYPEHASH =
    keccak256('Ticket(address recipient,uint256 groupId)');

  bytes32 immutable DOMAIN_SEPARATOR;

  /**
   * @dev Constructor.
   * @param name The name field of the EIP712 Domain.
   * @param version The version field of the EIP712 Domain.
   * @param registrationLimit The limit of registration number.
   */
  constructor(
    string memory name,
    string memory version,
    uint256 registrationLimit
  ) ENSDaoRegistrarLimited(registrationLimit) {
    DOMAIN_SEPARATOR = _hash(
      EIP712Domain({
        name: name,
        version: version,
        chainId: block.chainid,
        verifyingContract: address(this)
      })
    );
  }

  /**
   * @notice Register a name and mints a DAO token using a ticket.
   * @dev Can only be called by the recipient of the ticket signed by the owner.
   * @param label The label to register.
   * @param signedTicket The EIP712 signature corresponding to a groupId and the recipient address.
   */
  function registerWithTicket(string memory label, bytes memory signedTicket)
    external
    override
  {
    uint256 groupId = _getCurrentGroupId();

    Ticket memory ticket = Ticket({recipient: _msgSender(), groupId: groupId});
    bytes32 digest = DOMAIN_SEPARATOR.toTypedDataHash(_hash(ticket));

    require(
      !_consumed[digest],
      'ENS_DAO_REGISTRAR_TICKETABLE: TICKET_ALREADY_CONSUMED'
    );

    require(
      digest.recover(signedTicket) == owner(),
      'ENS_DAO_REGISTRAR_TICKETABLE: INVALID_TICKET OR INVALID_SENDER'
    );

    if (_registrationLimit == _counter) {
      _updateRegistrationLimit(_registrationLimit + 1);
    }

    bytes32 labelHash = keccak256(bytes(label));
    _register(_msgSender(), label, labelHash);

    _consumed[digest] = true;

    emit TicketConsumed(groupId, signedTicket);
  }

  /**
   * @dev Encode and hash an EIP712Domain structure.
   * @return The hash of the encoding of the EIP712Domain structure.
   */
  function _hash(EIP712Domain memory eip712Domain)
    internal
    pure
    returns (bytes32)
  {
    return
      keccak256(
        abi.encode(
          EIP712DOMAIN_TYPEHASH,
          keccak256(bytes(eip712Domain.name)),
          keccak256(bytes(eip712Domain.version)),
          eip712Domain.chainId,
          eip712Domain.verifyingContract
        )
      );
  }

  /**
   * @dev Encode and hash an Ticket structure.
   * @return The hash of the encoding of the Ticket structure.
   */
  function _hash(Ticket memory ticket) internal pure returns (bytes32) {
    return
      keccak256(abi.encode(TICKET_TYPEHASH, ticket.recipient, ticket.groupId));
  }

  /**
   * @dev Get the current group ID.
   * @return The current group ID.
   */
  function _getCurrentGroupId() internal virtual returns (uint256);
}
