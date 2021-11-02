pragma solidity >=0.8.4;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {SDaoRegistrar} from '../SDaoRegistrar.sol';

interface IERC721Minter is IERC721 {
  function mintTo(address to, uint256 tokenId) external;
}

/**
 * @title SDaoRegistrarERC721Generator contract.
 * @dev Implementation of the {ISDaoRegistrarERC721Generator}.
 *      A token is minted for each registration.
 *      Only one token is allowed by account.
 */
abstract contract SDaoRegistrarERC721Generator is SDaoRegistrar {
  IERC721Minter public immutable ERC721_TOKEN;

  /**
   * @dev Constructor.
   * @param erc721Minter The address of the ERC721 Minter.
   */
  constructor(IERC721Minter erc721Minter) {
    require(
      address(erc721Minter) != address(0),
      'SDAO_REGISTRAR_ERC721_GENERATOR: INVALID_ERC721_ADDRESS'
    );
    ERC721_TOKEN = erc721Minter;
  }

  /**
   * @dev Hook that is called before any registration.
   *
   *      It will pass if and only if the balance of the account is zero or the account is the owner.
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
      ERC721_TOKEN.balanceOf(account) == 0 || account == owner(),
      'SDAO_REGISTRAR_ERC721_GENERATOR: ALREADY_TOKEN_OWNER'
    );
  }

  /**
   * @dev Hook that is called after any registration.
   *
   *      The associated ERC721 is minted and given to the account.
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

    bytes32 childNode = keccak256(abi.encodePacked(ROOT_NODE, labelHash));
    ERC721_TOKEN.mintTo(account, uint256(childNode));
  }
}
