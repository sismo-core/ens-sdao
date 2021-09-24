pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import './nameWrapper/NameWrapper.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';

/**
 * A registrar that allocates subdomains to the first person to claim them.
 */
contract ERC721FIFSRegistrar is ERC721 {
  ENS public _ens;
  bytes32 public _rootNode;
  PublicResolver public _resolver;
  NameWrapper public _nameWrapper;
  string __baseURI;
  address public _owner;

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
  ) ERC721(name, symbol) {
    _ens = ensAddr;
    _rootNode = node;
    _resolver = resolverAddress;
    _nameWrapper = nameWrapper;
    __baseURI = baseURI;
    _owner = msg.sender;
  }

  function _baseURI() internal view override returns (string memory) {
    return __baseURI;
  }

  /**
   * Register a name, or change the owner of an existing registration.
   * @param label The hash of the label to register.
   * @param owner The address of the new owner.
   */
  function register(bytes32 label, address owner) public only_owner(label) {
    bytes32 childNode = keccak256(abi.encodePacked(_rootNode, label));
    _ens.setSubnodeRecord(
      _rootNode,
      label,
      address(this),
      address(_resolver),
      60
    );
    _resolver.setAddr(childNode, owner);
    _ens.setOwner(childNode, owner);
    _mint(owner, uint256(label));
  }

  function abdicate() public {
    require(msg.sender == _owner, 'NOT AUTHORIZED');
    _ens.setOwner(_rootNode, _owner);
  }
}
