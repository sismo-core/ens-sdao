pragma solidity >=0.8.4;
import {INameWrapper, PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENSRegistry.sol';
import {EthRegistrar} from './EthRegistrar.sol';
import {NameResolver, ReverseRegistrar} from '@ensdomains/ens-contracts/contracts/registry/ReverseRegistrar.sol';
import {NameWrapper, IMetadataService, BaseRegistrar} from '../name-wrapper/NameWrapper.sol';

// Construct a set of test ENS contracts.
contract ENSDeployer {
  bytes32 public constant TLD_LABEL = keccak256('eth');
  bytes32 public constant RESOLVER_LABEL = keccak256('resolver');
  bytes32 public constant REVERSE_REGISTRAR_LABEL = keccak256('reverse');
  bytes32 public constant ADDR_LABEL = keccak256('addr');

  ENSRegistry public ens;
  EthRegistrar public ethRegistrar;
  ReverseRegistrar public reverseRegistrar;
  PublicResolver public publicResolver;
  NameWrapper public nameWrapper;

  function namehash(bytes32 node, bytes32 label) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(node, label));
  }

  constructor() public {
    ens = new ENSRegistry();

    // Create a FIFS registrar for the TLD
    ethRegistrar = new EthRegistrar(ens, namehash(bytes32(0), TLD_LABEL));

    ens.setSubnodeOwner(bytes32(0), TLD_LABEL, address(ethRegistrar));

    nameWrapper = new NameWrapper(
      ens,
      BaseRegistrar(address(ethRegistrar)),
      IMetadataService(address(0))
    );

    publicResolver = new PublicResolver(
      ens,
      INameWrapper(address(nameWrapper))
    );

    // Set up the resolver
    bytes32 resolverNode = namehash(bytes32(0), RESOLVER_LABEL);

    ens.setSubnodeOwner(bytes32(0), RESOLVER_LABEL, address(this));
    ens.setResolver(resolverNode, address(publicResolver));
    publicResolver.setAddr(resolverNode, address(publicResolver));

    // Construct a new reverse registrar and point it at the public resolver
    reverseRegistrar = new ReverseRegistrar(
      ens,
      NameResolver(address(publicResolver))
    );

    // Set up the reverse registrar
    ens.setSubnodeOwner(bytes32(0), REVERSE_REGISTRAR_LABEL, address(this));
    ens.setSubnodeOwner(
      namehash(bytes32(0), REVERSE_REGISTRAR_LABEL),
      ADDR_LABEL,
      address(reverseRegistrar)
    );
  }
}
