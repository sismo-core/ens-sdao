pragma solidity >=0.8.4;

import '@openzeppelin/contracts/access/Ownable.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {ENSDaoRegistrarLimited} from '../extensions/ENSDaoRegistrarLimited.sol';
import {ENSDaoRegistrarReserved} from '../extensions/ENSDaoRegistrarReserved.sol';
import {ENSDaoRegistrarERC1155Generator, IERC1155Minter} from '../extensions/ENSDaoRegistrarERC1155Generator.sol';

contract ENSDaoRegistrarPresetERC1155Generator is
  Ownable,
  ENSDaoRegistrar,
  ENSDaoRegistrarERC1155Generator
{
  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param erc1155Token The address of the ERC1155 Token.
   * @param node The node that this registrar administers.
   * @param name The label string of the administered subdomain.
   * @param owner The owner of the contract.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    IERC1155Minter erc1155Token,
    bytes32 node,
    string memory name,
    address owner
  )
    ENSDaoRegistrarERC1155Generator(erc1155Token)
    ENSDaoRegistrar(ensAddr, resolver, node, name, owner)
  {}

  function _balanceOf(address account)
    internal
    view
    override
    returns (uint256)
  {
    return ERC1155_MINTER.balanceOf(account, 0);
  }

  function _getToken(address account, bytes32 labelHash)
    internal
    view
    override
    returns (uint256, bytes memory)
  {
    bytes memory data;
    return (0, data);
  }

  function _beforeRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(ENSDaoRegistrar, ENSDaoRegistrarERC1155Generator)
  {
    super._beforeRegistration(account, labelHash);
  }

  function _afterRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(ENSDaoRegistrar, ENSDaoRegistrarERC1155Generator)
  {
    super._afterRegistration(account, labelHash);
  }
}
