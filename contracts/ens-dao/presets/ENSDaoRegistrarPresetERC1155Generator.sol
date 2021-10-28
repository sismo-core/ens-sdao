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
  uint256[] public _groupIds;

  event GroupIdAdded(uint256 groupId);

  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param erc1155Token The address of the ERC1155 Token.
   * @param node The node that this registrar administers.
   * @param name The label string of the administered subdomain.
   * @param initialGroupId The first group ID
   * @param owner The owner of the contract.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    IERC1155Minter erc1155Token,
    bytes32 node,
    string memory name,
    uint256 initialGroupId,
    address owner
  )
    ENSDaoRegistrarERC1155Generator(erc1155Token)
    ENSDaoRegistrar(ensAddr, resolver, node, name, owner)
  {
    uint256[] memory groupIds = new uint256[](1);
    groupIds[0] = initialGroupId;

    _groupIds = groupIds;
  }

  function _balanceOf(address account)
    internal
    view
    override
    returns (uint256)
  {
    uint256 sum;
    for (uint256 i = 0; i < _groupIds.length; i++) {
      sum += ERC1155_MINTER.balanceOf(account, _groupIds[i]);
    }
    return sum;
  }

  function addGroupId(uint256 groupId) public onlyOwner {
    for (uint256 i = 0; i < _groupIds.length; i++) {
      require(
        _groupIds[i] != groupId,
        'ENS_DAO_REGISTRAR_PRESET_ERC1155_GENERATOR: ALREADY_EXISTING_GROUP_ID'
      );
    }
    _groupIds.push(groupId);
    emit GroupIdAdded(groupId);
  }

  function _getToken(address account, bytes32 labelHash)
    internal
    view
    override
    returns (uint256, bytes memory)
  {
    bytes memory data;
    return (_groupIds[_groupIds.length - 1], data);
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
