pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '../name-wrapper/NameWrapper.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import {ENSDaoToken} from './ENSDaoToken.sol';
import {IENSDaoRegistrar} from './IENSDaoRegistrar.sol';

/**
 * @title EnsDaoRegistrar contract.
 * @dev Implementation of the {IENSDaoRegistrar}.
 *
 *      An arbitrary reservation period is considered.
 *      Within the registration period, only the owners of the associated .eth subdomain may register this subdomain.
 *      After the registration period, any subdomain registration is first come first served.
 */
contract ENSDaoRegistrar is ERC1155Holder, Ownable, IENSDaoRegistrar {
  PublicResolver public immutable RESOLVER;
  NameWrapper public immutable NAME_WRAPPER;
  ENSDaoToken public immutable DAO_TOKEN;
  ENS public immutable ENS_REGISTRY;
  bytes32 public immutable ROOT_NODE;

  string NAME;
  bytes32 public constant ETH_NODE =
    keccak256(abi.encodePacked(bytes32(0), keccak256('eth')));

  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param nameWrapper The address of the Name Wrapper. can be 0x00
   * @param daoToken The address of the DAO Token.
   * @param node The node that this registrar administers.
   * @param name The label string of the administered subdomain.
   * @param owner The owner of the contract.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    NameWrapper nameWrapper,
    ENSDaoToken daoToken,
    bytes32 node,
    string memory name,
    address owner
  ) {
    ENS_REGISTRY = ensAddr;
    RESOLVER = resolver;
    NAME_WRAPPER = nameWrapper;
    DAO_TOKEN = daoToken;
    NAME = name;
    ROOT_NODE = node;

    transferOwnership(owner);
  }

  /**
   * @notice Register a name and mints a DAO token.
   * @dev Can only be called if and only if
   *  - the subdomain of the root node is free,
   *  - sender does not already have a DAO token OR sender is the owner,
   *  - still in the reservation period, the associated .eth subdomain is free OR owned by the sender,
   *  - the maximum number of emissions has not been reached.
   * @param label The label to register.
   */
  function register(string memory label) public virtual override {
    bytes32 labelHash = keccak256(bytes(label));

    _register(_msgSender(), label, labelHash);
  }

  /**
   * @notice Give back the root domain of the ENS DAO Registrar to DAO owner.
   * @dev Can be called by the owner of the registrar.
   */
  function giveBackDomainOwnership() public override onlyOwner {
    if (address(NAME_WRAPPER) != address(0)) {
      NAME_WRAPPER.unwrapETH2LD(keccak256(bytes(NAME)), owner(), owner());
    } else {
      ENS_REGISTRY.setOwner(ROOT_NODE, owner());
    }

    emit OwnershipConceded(_msgSender());
  }

  /**
   * @dev Register a name and mint a DAO token.
   *      Can only be called if and only if
   *        - the maximum number of emissions has not been reached,
   *        - the subdomain is free to be registered,
   *        - the destination address does not alreay own a subdomain or the sender is the owner
   * @param account The address that will receive the subdomain and the DAO token.
   * @param label The label to register.
   * @param labelHash The hash of the label to register, given as input because of parent computation.
   */
  function _register(
    address account,
    string memory label,
    bytes32 labelHash
  ) internal {
    _beforeRegistration(account, labelHash);

    bytes32 childNode = keccak256(abi.encodePacked(ROOT_NODE, labelHash));
    address subdomainOwner = ENS_REGISTRY.owner(
      keccak256(abi.encodePacked(ROOT_NODE, labelHash))
    );
    require(
      subdomainOwner == address(0x0),
      'ENS_DAO_REGISTRAR: SUBDOMAIN_ALREADY_REGISTERED'
    );

    require(
      DAO_TOKEN.balanceOf(account) == 0 || _msgSender() == owner(),
      'ENS_DAO_REGISTRAR: TOO_MANY_SUBDOMAINS'
    );

    if (address(NAME_WRAPPER) != address(0)) {
      _registerWithNameWrapper(account, label, childNode);
    } else {
      _registerWithEnsRegistry(account, labelHash, childNode);
    }

    // Minting the DAO Token
    DAO_TOKEN.mintTo(account, uint256(childNode));

    _afterRegistration(account, labelHash);

    emit NameRegistered(uint256(childNode), _msgSender());
  }

  /**
   * @dev Register a name using the Name Wrapper.
   * @param label The label to register.
   * @param childNode The node to register, given as input because of parent computation.
   */
  function _registerWithNameWrapper(
    address account,
    string memory label,
    bytes32 childNode
  ) internal {
    // Set ownership to ENS DAO, so that the contract can set resolver
    NAME_WRAPPER.setSubnodeRecordAndWrap(
      ROOT_NODE,
      label,
      address(this),
      address(RESOLVER),
      60,
      0
    );
    // Setting the resolver for the user
    RESOLVER.setAddr(childNode, account);

    // Giving back the ownership to the user
    NAME_WRAPPER.safeTransferFrom(
      address(this),
      account,
      uint256(childNode),
      1,
      ''
    );
  }

  /**
   * @dev Register a name using the ENS Registry.
   * @param labelHash The hash of the label to register.
   * @param childNode The node to register, given as input because of parent computation.
   */
  function _registerWithEnsRegistry(
    address account,
    bytes32 labelHash,
    bytes32 childNode
  ) internal {
    // Set ownership to ENS DAO, so that the contract can set resolver
    ENS_REGISTRY.setSubnodeRecord(
      ROOT_NODE,
      labelHash,
      address(this),
      address(RESOLVER),
      60
    );

    // Setting the resolver for the user
    RESOLVER.setAddr(childNode, account);

    // Giving back the ownership to the user
    ENS_REGISTRY.setSubnodeOwner(ROOT_NODE, labelHash, account);
  }

  /**
   * @dev Hook that is called before any registration.
   *
   * @param account The address for which the reservation is made.
   * @param labelHash The hash of the label to register.
   */
  function _beforeRegistration(address account, bytes32 labelHash)
    internal
    virtual
  {}

  /**
   * @dev Hook that is called after any registration.
   *
   * @param account The address for which the reservation is made.
   * @param labelHash The hash of the label to register.
   */
  function _afterRegistration(address account, bytes32 labelHash)
    internal
    virtual
  {}
}
