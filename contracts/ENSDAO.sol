pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import './nameWrapper/NameWrapper.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';

/**
 * A registrar that allocates subdomains to the first person to claim them.
 */
contract ENSDAO is ERC721, ERC1155Holder {
  ENS public _ens;
  bytes32 public _rootNode;
  PublicResolver public _resolver;
  NameWrapper public _nameWrapper;
  string __baseURI;
  address public _owner;
  string _name;
  bytes32 constant ETHNODE =
    keccak256(abi.encodePacked(bytes32(0), keccak256('eth')));

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
      dotethOwner == address(0x0) || dotethOwner == msg.sender,
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
    bytes32 node,
    string memory baseURI,
    string memory name,
    string memory symbol
  ) ERC721(_append(name, ' .eth DAO TOKEN'), symbol) {
    _ens = ensAddr;
    _rootNode = node;
    _resolver = resolverAddress;
    _nameWrapper = nameWrapper;
    __baseURI = baseURI;
    _owner = msg.sender;
    _name = name;
  }

  /**
   * Register a name, or change the owner of an existing registration.
   * @param label The the label to register.
   */
  function register(string memory label)
    public
    only_owner(keccak256(bytes(label)))
  {
    require(balanceOf(msg.sender) == 0, 'ENSDAO: TOO_MANY_SUBDOMAINS');
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
    _mint(msg.sender, uint256(childNode));
  }

  function unwrapToDaoOwner() public {
    require(msg.sender == _owner, 'ENS_DAO: NOT OWNER');
    _nameWrapper.unwrapETH2LD(keccak256(bytes(_name)), _owner, _owner);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC721, ERC1155Receiver)
    returns (bool)
  {
    return
      interfaceId == type(IERC721).interfaceId ||
      interfaceId == type(IERC721Metadata).interfaceId ||
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IERC1155Receiver).interfaceId ||
      super.supportsInterface(interfaceId);
  }

  function _baseURI() internal view override returns (string memory) {
    return __baseURI;
  }

  function _append(string memory a, string memory b)
    internal
    pure
    returns (string memory)
  {
    return string(abi.encodePacked(a, b));
  }
}
