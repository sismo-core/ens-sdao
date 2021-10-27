pragma solidity >=0.8.4;

import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

contract SecretVerifierV2 {
  using ECDSA for bytes32;

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

  bytes32 public constant EIP712DOMAIN_TYPEHASH =
    keccak256(
      'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
    );
  bytes32 public constant TICKET_TYPEHASH =
    keccak256('Ticket(address recipient,uint256 groupId)');

  bytes32 public immutable DOMAIN_SEPARATOR;

  constructor() {
    DOMAIN_SEPARATOR = _hash(
      EIP712Domain({
        name: 'Sismo App',
        version: '1.0',
        chainId: 1,
        verifyingContract: address(this)
      })
    );
  }

  function _hash(EIP712Domain memory eip720Domain)
    internal
    pure
    returns (bytes32)
  {
    return
      keccak256(
        abi.encode(
          EIP712DOMAIN_TYPEHASH,
          keccak256(bytes(eip720Domain.name)),
          keccak256(bytes(eip720Domain.version)),
          eip720Domain.chainId,
          eip720Domain.verifyingContract
        )
      );
  }

  function _hash(Ticket memory ticket) internal pure returns (bytes32) {
    return
      keccak256(abi.encode(TICKET_TYPEHASH, ticket.recipient, ticket.groupId));
  }

  function verify(
    Ticket memory ticket,
    bytes memory signature,
    address signer
  ) internal view returns (bool) {
    bytes32 digest = DOMAIN_SEPARATOR.toTypedDataHash(_hash(ticket));
    return digest.recover(signature) == signer;
  }

  function getDigest(address recipient, uint256 groupId)
    public
    view
    returns (bytes32)
  {
    Ticket memory ticket = Ticket({recipient: recipient, groupId: groupId});
    return DOMAIN_SEPARATOR.toTypedDataHash(_hash(ticket));
  }

  function getTicketHash(address recipient, uint256 groupId)
    public
    pure
    returns (bytes32)
  {
    Ticket memory ticket = Ticket({recipient: recipient, groupId: groupId});
    return _hash(ticket);
  }

  function test(
    bytes memory signature,
    address signer,
    address recipient,
    uint256 groupId
  ) public view returns (bool) {
    Ticket memory ticket = Ticket({recipient: recipient, groupId: groupId});

    assert(verify(ticket, signature, signer));
    return true;
  }
}
