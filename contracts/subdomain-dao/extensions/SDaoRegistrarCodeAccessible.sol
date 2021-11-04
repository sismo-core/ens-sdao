// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {SDaoRegistrar} from '../SDaoRegistrar.sol';
import {ISDaoRegistrarCodeAccessible} from './interfaces/ISDaoRegistrarCodeAccessible.sol';

import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

/**
 * @title SDaoRegistrarCodeAccessible contract.
 * @dev Implementation of the {ISDaoRegistrarCodeAccessible}.
 */
abstract contract SDaoRegistrarCodeAccessible is
  SDaoRegistrar,
  ISDaoRegistrarCodeAccessible
{
  using ECDSA for bytes32;

  mapping(bytes32 => bool) public _consumed;
  address public _codeSigner;

  struct EIP712Domain {
    string name;
    string version;
    uint256 chainId;
    address verifyingContract;
  }

  struct CodeOrigin {
    address recipient;
    uint256 groupId;
  }

  bytes32 constant EIP712DOMAIN_TYPEHASH =
    keccak256(
      'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
    );
  bytes32 constant CODE_ORIGIN_TYPEHASH =
    keccak256('CodeOrigin(address recipient,uint256 groupId)');

  bytes32 immutable DOMAIN_SEPARATOR;

  /**
   * @dev Constructor.
   * @param name The name field of the EIP712 Domain.
   * @param version The version field of the EIP712 Domain.
   * @param codeSigner The address of the code signer.
   */
  constructor(
    string memory name,
    string memory version,
    address codeSigner
  ) {
    DOMAIN_SEPARATOR = _hash(
      EIP712Domain({
        name: name,
        version: version,
        chainId: block.chainid,
        verifyingContract: address(this)
      })
    );
    _restricted = true;
    _codeSigner = codeSigner;
  }

  /**
   * @notice Register a name and mints a DAO token using an access code.
   * @dev Can only be called by the recipient of the access code generated by the code signer.
   * @param label The label to register.
   * @param label Address of the recipient of the registration.
   * @param accessCode The EIP712 signature corresponding to a groupId and the recipient address.
   */
  function registerWithAccessCode(
    string memory label,
    address recipient,
    bytes memory accessCode
  ) external override {
    uint256 groupId = _getCurrentGroupId();

    CodeOrigin memory codeOrigin = CodeOrigin({
      recipient: recipient,
      groupId: groupId
    });
    bytes32 digest = DOMAIN_SEPARATOR.toTypedDataHash(_hash(codeOrigin));

    require(
      !_consumed[digest],
      'SDAO_REGISTRAR_LIMITED_CODE_ACCESSIBLE: ACCESS_CODE_ALREADY_CONSUMED'
    );

    require(
      digest.recover(accessCode) == _codeSigner,
      'SDAO_REGISTRAR_LIMITED_CODE_ACCESSIBLE: INVALID_ACCESS_CODE OR INVALID_SENDER'
    );

    bytes32 labelHash = keccak256(bytes(label));
    _register(recipient, labelHash);

    _consumed[digest] = true;

    emit AccessCodeConsumed(groupId, accessCode);
  }

  /**
   * @notice Update the code signer.
   * @dev Can only be called by the owner.
   * @param codeSigner The address of the code signer.
   */
  function updateCodeSigner(address codeSigner) public override onlyOwner {
    _codeSigner = codeSigner;
    emit CodeSignerUpdated(codeSigner);
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
   * @dev Encode and hash an CodeOrigin structure.
   * @return The hash of the encoding of the CodeOrigin structure.
   */
  function _hash(CodeOrigin memory codeOrigin) internal pure returns (bytes32) {
    return
      keccak256(
        abi.encode(
          CODE_ORIGIN_TYPEHASH,
          codeOrigin.recipient,
          codeOrigin.groupId
        )
      );
  }

  /**
   * @dev Get the current group ID.
   * @return The current group ID.
   */
  function _getCurrentGroupId() internal virtual returns (uint256);
}
