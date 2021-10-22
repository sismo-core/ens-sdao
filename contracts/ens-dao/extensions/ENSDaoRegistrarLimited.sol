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
import {IENSDaoRegistrarLimited} from './IENSDaoRegistrarLimited.sol';

/**
 * @title ENSDaoRegistrarLimited contract.
 * @dev Implementation of the {IENSDaoRegistrarLimited}.
 */
abstract contract ENSDaoRegistrarLimited is
  ENSDaoRegistrar,
  IENSDaoRegistrarLimited
{
  uint256 public _registrationLimit;
  uint256 public _counter;

  /**
   * @dev Constructor.
   * @param registrationLimit The limit of registration number.
   */
  constructor(uint256 registrationLimit) {
    _registrationLimit = registrationLimit;
  }

  /**
   * @notice Update limit registration number.
   * @dev Can only be called by owner.
   * @param registrationLimit The limit of registration number.
   */
  function updateRegistrationLimit(uint256 registrationLimit)
    public
    override
    onlyOwner
  {
    require(
      registrationLimit >= _counter,
      'ENS_DAO_REGISTRAR_LIMITED: NEW_REGISTRATION_LIMIT_TOO_LOW'
    );
    _registrationLimit = registrationLimit;
    emit RegistrationLimitUpdated(registrationLimit);
  }

  /**
   * @dev Hook that is called before any registration.
   *
   *      It will pass if and only if the number of registration is lower than the limit.
   *
   * @param account The address for which the reservation is made.
   * @param labelHash The hash of the label to register.
   */
  function _beforeRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override
  {
    super._beforeRegistration(account, labelHash);

    require(
      _counter < _registrationLimit,
      'ENS_DAO_REGISTRAR_LIMITED: REGISTRATION_LIMIT_REACHED'
    );
  }

  /**
   * @dev Hook that is called after any registration.
   *
   *      Counter of registration is increased by 1.
   *
   * @param account The address for which the reservation is made.
   * @param labelHash The hash of the label to register.
   */
  function _afterRegistration(address account, bytes32 labelHash)
    internal
    virtual
    override
  {
    super._afterRegistration(account, labelHash);

    _counter += 1;
  }
}
