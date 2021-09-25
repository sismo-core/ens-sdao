pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import './nameWrapper/NameWrapper.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';

/**
 * A registrar that allocates subdomains to the first person to claim them.
 */
contract EthDomainRegistrar is ERC721, ERC1155Holder {
  ENS public _ens;
  bytes32 public _rootNode;
  PublicResolver public _resolver;
  NameWrapper public _nameWrapper;
  string __baseURI;
  address public _owner;
  string _name;

  modifier only_owner(bytes32 label) {
    address currentOwner = _ens.owner(
      keccak256(abi.encodePacked(_rootNode, label))
    );
    require(currentOwner == address(0x0) || currentOwner == msg.sender);
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
  ) ERC721(_append(name, ' .eth Community Badge'), symbol) {
    _ens = ensAddr;
    _rootNode = node;
    _resolver = resolverAddress;
    _nameWrapper = nameWrapper;
    __baseURI = baseURI;
    _owner = msg.sender;
    _name = name;
    _ens.setApprovalForAll(address(_nameWrapper), true);
  }

  function init() external {
    _nameWrapper.wrapETH2LD(_name, address(this), 0, address(_resolver));
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

  /**
   * Register a name, or change the owner of an existing registration.
   * @param label The hash of the label to register.
   * @param owner The address of the new owner.
   */
  function register(string memory label, address owner)
    public
    only_owner(keccak256(bytes(label)))
  {
    bytes32 labelHash = keccak256(bytes(label));
    bytes32 childNode = keccak256(abi.encodePacked(_rootNode, labelHash));

    // ownership to here, so that the contract can set resolver
    _nameWrapper.setSubnodeRecordAndWrap(
      _rootNode,
      label,
      address(this),
      address(_resolver),
      60,
      0
    );
    // setting the resolver for the user
    _resolver.setAddr(childNode, owner);
    // giving back the ownership to the user
    _nameWrapper.safeTransferFrom(
      address(this),
      owner,
      uint256(childNode),
      1,
      ''
    );
    // minting our community NFT
    _mint(owner, uint256(childNode));
  }

  function abdicate() public {
    require(msg.sender == _owner, 'NOT AUTHORIZED');
    _ens.setOwner(_rootNode, _owner);
  }
}
