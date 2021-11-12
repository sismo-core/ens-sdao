// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import {ISDaoRegistrar} from './ISDaoRegistrar.sol';

/**
 * @title SDaoRegistrar contract.
 * @dev Implementation of the {ISDaoRegistrar}.
 */
contract SDaoRegistrar is Ownable, ISDaoRegistrar {
  PublicResolver public immutable RESOLVER;
  ENS public immutable ENS_REGISTRY;
  bytes32 public immutable ROOT_NODE;

  bool public _restricted = false;

  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param node The node that this registrar administers.
   * @param owner The owner of the contract.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    bytes32 node,
    address owner
  ) {
    ENS_REGISTRY = ensAddr;
    RESOLVER = resolver;
    ROOT_NODE = node;

    transferOwnership(owner);
  }

  modifier onlyUnrestricted() {
    require(!_restricted, 'SDAO_REGISTRAR: RESTRICTED_REGISTRATION');
    _;
  }

  /**
   * @notice Register a name.
   * @dev Can only be called if and only if the subdomain of the root node is free
   * @param label The label to register.
   */
  function register(string memory label)
    public
    virtual
    override
    onlyUnrestricted
  {
    _register(_msgSender(), label);
  }

  /**
   * @notice Transfer the root domain ownership of the SDAO Registrar to a new owner.
   * @dev Can be called by the owner of the registrar.
   */
  function transferDomainOwnership(address newDomainOwner)
    public
    override
    onlyOwner
  {
    ENS_REGISTRY.setOwner(ROOT_NODE, newDomainOwner);

    emit DomainOwnershipTransferred(newDomainOwner);
  }

  /**
   * @notice Restrict registration.
   * @dev Can only be called by the owner.
   */
  function restrictRegistration() public override onlyOwner {
    _restricted = true;
    emit Restricted();
  }

  /**
   * @notice Open registration.
   * @dev Can only be called by the owner.
   */
  function openRegistration() public override onlyOwner {
    _restricted = false;
    emit Unrestricted();
  }

  /**
   * @dev Register a name and mint a DAO token.
   *      Can only be called if and only if the subdomain is free to be registered.
   * @param account The address that will receive the subdomain.
   * @param label The label to register.
   */
  function _register(address account, string memory label) internal {
    bytes32 labelHash = keccak256(bytes(label));

    _beforeRegistration(account, labelHash);

    bytes32 childNode = keccak256(abi.encodePacked(ROOT_NODE, labelHash));
    address subdomainOwner = ENS_REGISTRY.owner(
      keccak256(abi.encodePacked(ROOT_NODE, labelHash))
    );
    require(
      subdomainOwner == address(0x0),
      'SDAO_REGISTRAR: SUBDOMAIN_ALREADY_REGISTERED'
    );

    // Set ownership to SDAO, so that the contract can set resolver
    ENS_REGISTRY.setSubnodeRecord(
      ROOT_NODE,
      labelHash,
      address(this),
      address(RESOLVER),
      0
    );

    // Setting the resolver for the user
    RESOLVER.setAddr(childNode, account);

    // Giving back the ownership to the user
    ENS_REGISTRY.setSubnodeOwner(ROOT_NODE, labelHash, account);

    _afterRegistration(account, labelHash);

    emit NameRegistered(uint256(childNode), label, account, _msgSender());
  }

  /**
   * @dev Hook that is called before any registration.
   *
   * @param account The address for which the registration is made.
   * @param labelHash The hash of the label to register.
   */
  function _beforeRegistration(address account, bytes32 labelHash)
    internal
    virtual
  {}

  /**
   * @dev Hook that is called after any registration.
   *
   * @param account The address for which the registration is made.
   * @param labelHash The hash of the label to register.
   */
  function _afterRegistration(address account, bytes32 labelHash)
    internal
    virtual
  {}
}
