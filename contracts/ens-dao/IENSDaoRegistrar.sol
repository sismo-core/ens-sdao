pragma solidity >=0.8.4;

/**
 * @title IEnsDaoRegistrar interface
 * @notice A registrar that allows registrations in the DAO.
 *         The registrar holds an ENS subdomain of the .eth domain, e.g. 'example.eth'.
 *
 *         A registration allocates one ENS subdomain of the root subdomain, e.g. 'myname.example.eth' to an address.
 */
interface IENSDaoRegistrar {
  /**
   * @dev Emitted when a new name is registered through standard registration or claiming.
   */
  event NameRegistered(
    uint256 indexed id,
    address indexed owner,
    address indexed registrant
  );
  /**
   * @dev Emitted when the root domain ownership is transferred to a new address.
   */
  event DomainOwnershipTransferred(address indexed owner);

  /**
   * @notice Register a name.
   * @param label The label to register.
   *
   * Emits a {NameRegistered} event.
   */
  function register(string memory label) external;

  /**
   * @notice Transfer the root domain ownership of the ENS DAO Registrar to a new owner.
   *
   * Emits a {DomainOwnershipTransfered} event.
   */
  function transferDomainOwnership(address newDomainOwner) external;
}
