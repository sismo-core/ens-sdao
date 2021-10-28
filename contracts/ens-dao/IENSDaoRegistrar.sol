pragma solidity >=0.8.4;

/**
 * @title IEnsDaoRegistrar interface
 * @notice A registrar that allows registrations in the DAO.
 *         The registrar holds an ENS subdomain of the .eth domain, e.g. 'example.eth'.
 *
 *         A registration allocates one ENS subdomain of the root subdomain, e.g. 'myname.example.eth' and one associated ERC721 token to an address.
 *
 *         Only one subdomain and one ERC721 token may be possessed by an address with the exception of the owner of the DAO Registrar.
 */
interface IENSDaoRegistrar {
  /**
   * @dev Emitted when a new name is registered through standard registration or claiming.
   */
  event NameRegistered(uint256 indexed id, address indexed owner);
  /**
   * @dev Emitted when the root node ownership is conceded to the DAO owner.
   */
  event OwnershipConceded(address indexed owner);

  /**
   * @notice Register a name and mints a DAO token.
   * @param label The label to register.
   *
   * Emits a {NameRegistered} event.
   */
  function register(string memory label) external;

  /**
   * @notice Give back the root domain of the ENS DAO Registrar to DAO owner.
   *
   * Emits a {OwnershipConceded} event.
   */
  function giveBackDomainOwnership() external;
}
