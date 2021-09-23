pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';

/**
 * A registrar that allocates subdomains to the first person to claim them.
 */
contract ERC712FIFSRegistrar is ERC721 {
  ENS ens;
  bytes32 rootNode;

  modifier only_owner(bytes32 label) {
    address currentOwner = ens.owner(
      keccak256(abi.encodePacked(rootNode, label))
    );
    require(currentOwner == address(0x0) || currentOwner == msg.sender);
    _;
  }

  /**
   * Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param node The node that this registrar administers.
   */
  constructor(ENS ensAddr, bytes32 node) ERC721('', '') {
    ens = ensAddr;
    rootNode = node;
  }

  /**
   * Register a name, or change the owner of an existing registration.
   * @param label The hash of the label to register.
   * @param owner The address of the new owner.
   */
  function register(bytes32 label, address owner) public only_owner(label) {
    ens.setSubnodeOwner(rootNode, label, owner);
    _mint(owner, uint256(label));
  }
}
