pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import './nameWrapper/NameWrapper.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import {ENSDaoToken} from './ENSDaoToken.sol';
import {ENSLabelBooker} from './ENSLabelBooker.sol';
import {IENSDaoRegistrar} from './interfaces/IENSDaoRegistrar.sol';

/**
 * A registrar that allocates subdomains to the first person to claim them.
 */
contract ENSDaoRegistrar is ERC1155Holder, ENSLabelBooker, IENSDaoRegistrar {
  PublicResolver public _resolver;
  NameWrapper public _nameWrapper;
  ENSDaoToken public _daoToken;

  string _name;
  bytes32 public constant ETH_NODE =
    keccak256(abi.encodePacked(bytes32(0), keccak256('eth')));
  uint256 public constant RESERVATION_PERIOD = 1 weeks;
  uint256 public immutable DAO_BIRTH_DATE;
  uint256 public _maxEmissionNumber;

  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolverAddress The address of the Resolver.
   * @param nameWrapper The address of the Name Wrapper.
   * @param daoToken The address of the DAO Token.
   * @param node The node that this registrar administers.
   * @param name The label string of the administered subdomain.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolverAddress,
    NameWrapper nameWrapper,
    ENSDaoToken daoToken,
    bytes32 node,
    string memory name
  ) ENSLabelBooker(ensAddr, node) {
    _resolver = resolverAddress;
    _nameWrapper = nameWrapper;
    _daoToken = daoToken;
    _name = name;
    DAO_BIRTH_DATE = block.timestamp;
    _maxEmissionNumber = 500;
  }

  /**
   * @notice Register a name and mints a DAO token.
   * @dev Can only be called if and only if
   *  - the subdomain of the root node is free
   *  - sender does not already have a DAO token OR sender is the owner
   *  - if still in the reservation period, the associated .eth subdomain is free OR owned by the sender
   * @param label The label to register.
   */
  function register(string memory label) external override {
    bytes32 labelHash = keccak256(bytes(label));

    require(
      _getBooking(labelHash) == address(0),
      'ENS_DAO_REGISTRAR: label booked'
    );

    if (block.timestamp - DAO_BIRTH_DATE <= RESERVATION_PERIOD) {
      address dotEthSubdomainOwner = _ens.owner(
        keccak256(abi.encodePacked(ETH_NODE, labelHash))
      );
      require(
        dotEthSubdomainOwner == address(0x0) ||
          dotEthSubdomainOwner == _msgSender(),
        'ENS_DAO_REGISTRAR: subdomain reserved for .eth holder during reservation period'
      );
    }

    _register(_msgSender(), label, labelHash);
  }

  /**
   * @notice Claim a booked name.
   * @dev Can only be called by owner or registered booking address.
   * @param label The label to claim.
   * @param account The account to which the registration is done.
   */
  function claim(string memory label, address account) external override {
    bytes32 labelHash = keccak256(bytes(label));
    address bookedAddress = _getBooking(labelHash);
    require(bookedAddress != address(0), 'ENS_DAO_REGISTRAR: label not booked');
    require(
      bookedAddress == _msgSender() || owner() == _msgSender(),
      'ENS_DAO_REGISTRAR: sender is neither booked address neither owner'
    );

    bytes32 childNode = keccak256(abi.encodePacked(_rootNode, labelHash));

    _register(account, label, labelHash);

    _deleteBooking(labelHash);
  }

  /**
   * @notice Give back the root domain of the ENS DAO Registrar to DAO owner.
   * @dev Can be called by the owner of the registrar.
   */
  function giveBackDomainOwnership() external override onlyOwner {
    if (address(_nameWrapper) != address(0)) {
      _nameWrapper.unwrapETH2LD(keccak256(bytes(_name)), owner(), owner());
    } else {
      _ens.setOwner(_rootNode, owner());
    }

    emit OwnershipConceded(_msgSender());
  }

  /**
   * @notice Update max emission number.
   * @dev Can only be called by owner.
   */
  function updateMaxEmissionNumber(uint256 emissionNumber)
    external
    override
    onlyOwner
  {
    require(
      emissionNumber >= _daoToken.totalSupply(),
      'ENS_DAO_REGISTRAR: new maximum emission number too low'
    );
    _maxEmissionNumber = emissionNumber;
    emit MaxEmissionNumberUpdated(emissionNumber);
  }

  function _register(
    address account,
    string memory label,
    bytes32 labelHash
  ) internal {
    
    require(
      _daoToken.totalSupply() < _maxEmissionNumber,
      'ENS_DAO_REGISTRAR: too many emissions'
    );

    bytes32 childNode = keccak256(abi.encodePacked(_rootNode, labelHash));
    address subdomainOwner = _ens.owner(
      keccak256(abi.encodePacked(_rootNode, labelHash))
    );
    require(
      subdomainOwner == address(0x0),
      'ENS_DAO_REGISTRAR: subdomain already registered'
    );

    require(
      _daoToken.balanceOf(account) == 0 || _msgSender() == owner(),
      'ENS_DAO_REGISTRAR: too many subdomains'
    );

    if (address(_nameWrapper) != address(0)) {
      _registerWithNameWrapper(account, label, childNode);
    } else {
      _registerWithEnsRegistry(account, labelHash, childNode);
    }

    // Minting the DAO Token
    _daoToken.mintTo(account, uint256(childNode));

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
    _nameWrapper.setSubnodeRecordAndWrap(
      _rootNode,
      label,
      address(this),
      address(_resolver),
      60,
      0
    );
    // Setting the resolver for the user
    _resolver.setAddr(childNode, account);

    // Giving back the ownership to the user
    _nameWrapper.safeTransferFrom(
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
    _ens.setSubnodeRecord(
      _rootNode,
      labelHash,
      address(this),
      address(_resolver),
      60
    );

    // Setting the resolver for the user
    _resolver.setAddr(childNode, account);

    // Giving back the ownership to the user
    _ens.setSubnodeOwner(_rootNode, labelHash, account);
  }
}
