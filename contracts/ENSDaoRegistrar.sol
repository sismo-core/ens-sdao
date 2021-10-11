pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import './nameWrapper/NameWrapper.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import {ENSDaoToken} from './ENSDaoToken.sol';

/**
 * A registrar that allocates subdomains to the first person to claim them.
 */
contract ENSDaoRegistrar is ERC1155Holder, Ownable {
  ENS public _ens;
  bytes32 public _rootNode;
  PublicResolver public _resolver;
  NameWrapper public _nameWrapper;
  ENSDaoToken public _daoToken;

  string _name;
  bytes32 public constant ETHNODE =
    keccak256(abi.encodePacked(bytes32(0), keccak256('eth')));
  uint256 public constant RESERVATION_PERIOD = 1 weeks;
  uint256 public immutable DAO_BIRTH_DATE;

  modifier only_owner(bytes32 label) {
    address currentOwner = _ens.owner(
      keccak256(abi.encodePacked(_rootNode, label))
    );
    address dotethOwner = _ens.owner(
      keccak256(abi.encodePacked(ETHNODE, label))
    );
    require(
      currentOwner == address(0x0),
      'ENS_DAO: subdomain already registered'
    );
    require(
      dotethOwner == address(0x0) ||
        dotethOwner == _msgSender() ||
        _msgSender() == owner() ||
        block.timestamp - DAO_BIRTH_DATE > RESERVATION_PERIOD,
      'ENS_DAO: subdomain reserved for .eth holder'
    );
    _;
  }

  /**
   * Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param node The node that this registrar administers.
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
  }

  /**
   * Register a name, or change the owner of an existing registration.
   * @param label The the label to register.
   */
  function register(string memory label)
    public
    only_owner(keccak256(bytes(label)))
  {
    require(
      _daoToken.balanceOf(msg.sender) == 0,
      'ENSDAO: TOO_MANY_SUBDOMAINS'
    );
    bytes32 labelHash = keccak256(bytes(label));
    bytes32 childNode = keccak256(abi.encodePacked(_rootNode, labelHash));

    // Set ownership to ENSDAO, so that the contract can set resolver
    _nameWrapper.setSubnodeRecordAndWrap(
      _rootNode,
      label,
      address(this),
      address(_resolver),
      60,
      0
    );
    // Setting the resolver for the user
    _resolver.setAddr(childNode, msg.sender);

    // Giving back the ownership to the user
    _nameWrapper.safeTransferFrom(
      address(this),
      msg.sender,
      uint256(childNode),
      1,
      ''
    );
    // Minting the DAO Token
    _daoToken.mintTo(msg.sender, uint256(childNode));
  }

  function unwrapToDaoOwner() public onlyOwner {
    _nameWrapper.unwrapETH2LD(keccak256(bytes(_name)), owner(), owner());
  }
}
