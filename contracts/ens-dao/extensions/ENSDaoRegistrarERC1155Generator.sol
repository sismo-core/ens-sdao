pragma solidity >=0.8.4;

import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import {ENSDaoRegistrar} from '../ENSDaoRegistrar.sol';
import {IENSDaoRegistrar} from '../IENSDaoRegistrar.sol';
import {IENSDaoRegistrarERC1155Generator} from './IENSDaoRegistrarERC1155Generator.sol';

interface IERC1155Minter is IERC1155 {
  function mint(
    address to,
    uint256 id,
    uint256 amount,
    bytes memory data
  ) external;
}

/**
 * @title ENSDaoRegistrarERC1155Generator contract.
 * @dev Implementation of the {IENSDaoRegistrarERC1155Generator}.
 *      A token is minted for each registration.
 *      Only one token is allowed by account.
 */
abstract contract ENSDaoRegistrarERC1155Generator is
  ENSDaoRegistrar,
  IENSDaoRegistrarERC1155Generator
{
  IERC1155Minter public immutable ERC1155_MINTER;

  /**
   * @dev Constructor.
   * @param erc1155Minter The address of the ERC1155 Minter.
   */
  constructor(IERC1155Minter erc1155Minter) {
    require(
      address(erc1155Minter) != address(0),
      'ENS_DAO_REGISTRAR_ERC1155_GENERATOR: INVALID_ERC721_ADDRESS'
    );
    ERC1155_MINTER = erc1155Minter;
  }

  /**
   * @dev Hook that is called before any registration.
   *
   *      It will pass if and only if the balance of the account is zero or the account is the owner.
   *      Balance is computed based on a function which is implemented in the implementation contract.
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
      _balanceOf(account) == 0 || account == owner(),
      'ENS_DAO_REGISTRAR_ERC1155_GENERATOR: ALREADY_TOKEN_OWNER'
    );
  }

  /**
   * @dev Hook that is called after any registration.
   *
   *      One ERC1155 token is minted and given to the account.
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

    (uint256 id, bytes memory data) = _getToken(account, labelHash);

    ERC1155_MINTER.mint(account, id, 1, data);
  }

  /**
   * @dev Get token ID and token data.
   * @param account The address for which the registration is made.
   * @param labelHash The hash of the label to register.
   * @return The ID and the data of the token.
   */
  function _getToken(address account, bytes32 labelHash)
    internal
    view
    virtual
    returns (uint256, bytes memory);

  /**
   * @dev Get balance of an address.
   * @param account The address for which the registration is made.
   * @return The ID and the data of the token.
   */
  function _balanceOf(address account) internal virtual returns (uint256);
}
