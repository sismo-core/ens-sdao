pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import './nameWrapper/NameWrapper.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import {ENSDaoToken} from './ENSDaoToken.sol';
import {IENSDaoRegistrar} from './interfaces/IENSDaoRegistrar.sol';

/**
 * A registrar that allocates subdomains to the first person to claim them.
 */
<<<<<<< HEAD
contract ENSDaoRegistrar is ERC1155Holder, Ownable, IENSDaoRegistrar {
=======
contract ENSDaoRegistrar is ERC1155Holder, Ownable,  {
>>>>>>> a9d19b2 (--wip-- [skip ci])
  ENS public _ens;
  bytes32 public _rootNode;
  PublicResolver public _resolver;
  NameWrapper public _nameWrapper;
  ENSDaoToken public _daoToken;

  string _name;
  bytes32 public constant ETH_NODE =
    keccak256(abi.encodePacked(bytes32(0), keccak256('eth')));
  uint256 public constant RESERVATION_PERIOD = 1 weeks;
  uint256 public immutable DAO_BIRTH_DATE;
  uint256 public _maxEmissionNumber;

  mapping(bytes32 => address) private bookings;

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
  ) {
    _ens = ensAddr;
    _rootNode = node;
    _resolver = resolverAddress;
    _nameWrapper = nameWrapper;
    _daoToken = daoToken;
    _name = name;
    DAO_BIRTH_DATE = block.timestamp;
    _maxEmissionNumber = 500;
  }

  modifier canRegister(bytes32 labelHash) {
    require(
      _daoToken.totalSupply() < _maxEmissionNumber,
      'ENS_DAO_REGISTRAR: too many emissions'
    );

    address subdomainOwner = _ens.owner(
      keccak256(abi.encodePacked(_rootNode, labelHash))
    );
    require(
      subdomainOwner == address(0x0),
      'ENS_DAO_REGISTRAR: subdomain already registered'
    );

    require(
      _daoToken.balanceOf(_msgSender()) == 0 || _msgSender() == owner(),
      'ENS_DAO_REGISTRAR: too many subdomains'
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
    _;
  }

  /**
   * @notice Register a name and mints a DAO token.
   * @dev Can only be called if and only if
   *  - the subdomain of the root node is free
   *  - sender does not already have a DAO token OR sender is the owner
   *  - if still in the reservation period, the associated .eth subdomain is free OR owned by the sender
   * @param label The label to register.
   */
  function register(string memory label)
    external
    override
    canRegister(keccak256(bytes(label)))
  {
    bytes32 labelHash = keccak256(bytes(label));
    bytes32 childNode = keccak256(abi.encodePacked(_rootNode, labelHash));

    if (address(_nameWrapper) != address(0)) {
      _registerWithNameWrapper(label, childNode);
    } else {
      _registerWithEnsRegistry(labelHash, childNode);
    }

    // Minting the DAO Token
    _daoToken.mintTo(_msgSender(), uint256(childNode));

    emit NameRegistered(uint256(childNode), _msgSender());
  }

  /**
   * @notice Book a label with an address for a later claim.
   * @dev Can only be called by owner of the DAO registrar.
   * @param label The label to book.
   * @param account The address which can claim the label
   */
  function book(string memory label, address account) external override onlyOwner {
    _book(label, account);
  }


  /**
   * @notice Batch book operations given a list of labels and accounts.
   * @dev Can only be called by owner of the DAO registrar.
   * @dev Input lists must have the same length.
   * @param labels The list of label to book.
   * @param account The list of address which can claim the associated label.
   */
  function batchBook(string[] memory labels, address[] memory accounts) external override onlyOwner {
    require(labels.length == accounts.length, 'ENS_DAO_REGISTRAR: invalid labels and accounts arguments');
    for (uint256 i; i < labels.length; i++) {
      _book(labels[i], accounts[i]);
    }
  }

  function updateBook(string memory label, address account) external override onlyOwner {
    _updateBook(label, account);
  }

  function batchUpdateBook(string[] memory labels, address[] memory accounts) external override onlyOwner {
    require(labels.length == accounts.length, 'ENS_DAO_REGISTRAR: invalid labels and accounts arguments');
    for (uint256 i; i < labels.length; i++) {
      _updateBook(labels[i], accounts[i]);
    }
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

  function _updateBook(string memory label, address account) internal {
    bytes32 labelHash = keccak256(bytes(label));
    require(account != address(0), 'ENS_DAO_REGISTRAR: invalid zero address as booking address');
    bookings[labelHash] = account;
  }

  function _book(string memory label, address account) internal {
    bytes32 labelHash = keccak256(bytes(label));
    require(account != address(0), 'ENS_DAO_REGISTRAR: invalid zero address as booking address');
    require(bookings[labelHash] == address(0), 'ENS_DAO_REGISTRAR: label already booked');
    bookings[labelHash] = account;
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

  /**
   * @dev Register a name using the Name Wrapper.
   * @param label The label to register.
   * @param childNode The node to register, given as input because of parent computation.
   */
  function _registerWithNameWrapper(string memory label, bytes32 childNode)
    internal
  {
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
    _resolver.setAddr(childNode, _msgSender());

    // Giving back the ownership to the user
    _nameWrapper.safeTransferFrom(
      address(this),
      _msgSender(),
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
  function _registerWithEnsRegistry(bytes32 labelHash, bytes32 childNode)
    internal
  {
    // Set ownership to ENS DAO, so that the contract can set resolver
    _ens.setSubnodeRecord(
      _rootNode,
      labelHash,
      address(this),
      address(_resolver),
      60
    );

    // Setting the resolver for the user
    _resolver.setAddr(childNode, _msgSender());

    // Giving back the ownership to the user
    _ens.setSubnodeOwner(_rootNode, labelHash, _msgSender());
  }
}
