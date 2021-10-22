pragma solidity >=0.8.4;

import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '../../name-wrapper/NameWrapper.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import {PublicResolver} from '@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol';
import {ENSDaoToken} from '../ENSDaoToken.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {ENSDaoRegistrarLimited} from '../extensions/ENSDaoRegistrarLimited.sol';
import {ENSDaoRegistrarReserved} from '../extensions/ENSDaoRegistrarReserved.sol';

contract ENSDaoRegistrarPresetReservedLimited is
  ENSDaoRegistrarLimited,
  ENSDaoRegistrarReserved
{
  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param resolver The address of the Resolver.
   * @param nameWrapper The address of the Name Wrapper. can be 0x00
   * @param daoToken The address of the DAO Token.
   * @param node The node that this registrar administers.
   * @param name The label string of the administered subdomain.
   * @param owner The owner of the contract.
   * @param reservationDuration The duration of the reservation period.
   * @param registrationLimit The limit of registration number.
   */
  constructor(
    ENS ensAddr,
    PublicResolver resolver,
    NameWrapper nameWrapper,
    ENSDaoToken daoToken,
    bytes32 node,
    string memory name,
    address owner,
    uint256 reservationDuration,
    uint256 registrationLimit
  )
    ENSDaoRegistrarLimited(registrationLimit)
    ENSDaoRegistrarReserved(reservationDuration)
    ENSDaoRegistrar(ensAddr, resolver, nameWrapper, daoToken, node, name, owner)
  {}

  function _beforeRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(ENSDaoRegistrar, ENSDaoRegistrarLimited, ENSDaoRegistrarReserved)
  {
    super._beforeRegistration(account, labelHash);
  }

  function _afterRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override(ENSDaoRegistrar, ENSDaoRegistrarLimited)
  {
    super._afterRegistration(account, labelHash);
  }
}
