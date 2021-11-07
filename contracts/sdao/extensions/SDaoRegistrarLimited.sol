// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {SDaoRegistrar} from '../SDaoRegistrar.sol';
import {ISDaoRegistrarLimited} from './interfaces/ISDaoRegistrarLimited.sol';

/**
 * @title SDaoRegistrarLimited contract.
 * @dev Implementation of the {ISDaoRegistrarLimited}.
 */
abstract contract SDaoRegistrarLimited is SDaoRegistrar, ISDaoRegistrarLimited {
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
    _updateRegistrationLimit(registrationLimit);
  }

  /**
   * @dev Update limit registration number.
   * @param registrationLimit The limit of registration number.
   */
  function _updateRegistrationLimit(uint256 registrationLimit) internal {
    require(
      registrationLimit >= _counter,
      'SDAO_REGISTRAR_LIMITED: NEW_REGISTRATION_LIMIT_TOO_LOW'
    );
    _registrationLimit = registrationLimit;
    emit RegistrationLimitUpdated(registrationLimit);
  }

  /**
   * @dev Hook that is called before any registration.
   *
   *      It will pass if and only if the number of registration is lower than the limit.
   *
   * @param account The address for which the registration is made.
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
      'SDAO_REGISTRAR_LIMITED: REGISTRATION_LIMIT_REACHED'
    );
  }

  /**
   * @dev Hook that is called after any registration.
   *
   *      Counter of registration is increased by 1.
   *
   * @param account The address for which the registration is made.
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
