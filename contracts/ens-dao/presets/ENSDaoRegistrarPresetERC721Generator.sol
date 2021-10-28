pragma solidity >=0.8.4;

import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {ENSDaoRegistrarLimited} from '../extensions/ENSDaoRegistrarLimited.sol';
import {ENSDaoRegistrarReserved} from '../extensions/ENSDaoRegistrarReserved.sol';
import {ENSDaoRegistrarERC721Generator, IERC721Minter} from '../extensions/ENSDaoRegistrarERC721Generator.sol';

contract ENSDaoRegistrarPresetERC721Generator is
  ENSDaoRegistrar,
  ENSDaoRegistrarERC721Generator
{
  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param erc721Token The address of the ERC721 Token.
   * @param node The node that this registrar administers.
   * @param name The label string of the administered subdomain.
   * @param owner The owner of the contract.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    IERC721Minter erc721Token,
    bytes32 node,
    string memory name,
    address owner
  )
    ENSDaoRegistrarERC721Generator(erc721Token)
    ENSDaoRegistrar(ensAddr, resolver, node, name, owner)
  {}

  function _beforeRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(ENSDaoRegistrar, ENSDaoRegistrarERC721Generator)
  {
    super._beforeRegistration(account, labelHash);
  }

  function _afterRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(ENSDaoRegistrar, ENSDaoRegistrarERC721Generator)
  {
    super._afterRegistration(account, labelHash);
  }
}
