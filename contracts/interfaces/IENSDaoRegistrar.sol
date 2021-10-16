pragma solidity >=0.8.4;

import '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import {IENSLabelBooker} from './IENSLabelBooker.sol';

/**
 * @title IEnsDaoRegistrar interface
 * @notice A registrar that allows a first come first served registration in the DAO.
 *         The registrar holds an ENS subdomain of the .eth domain.
 *
 *         A registration allocates one ENS subdomain of the root subdomain and one associated ERC721 token to an address.
 *
 *         A reservation period of one week is considered.
 *         Within the registration period, only the owners of the associated .eth subdomain may register this subdomain.
 *         After the registration period, any subdomain registration is first come first served.
 *
 *         Only one subdomain and one ERC721 token may be possessed by an address with the exception of the owner of the DAO Registrar.
 *
 *         Additionally, the owner has the possibility to book any subdomain, unless it is already owned.
 *         A booked subdomain can not be registered directly.
 *         A booked subdomain can be claimed either by the owner of the DAO Registrar, either by the address registered in the booking.
 *         A claim performs a registration with an arbitrary address, chosen by the claimer.
 *
 *         See IENSLabelBooker interface for further details on the booking management.
 */
interface IENSDaoRegistrar is IERC1155Receiver, IENSLabelBooker {
  /**
   * @dev Emitted when a new name is registered through standard registration or claiming.
   */
  event NameRegistered(uint256 indexed id, address indexed owner);
  /**
   * @dev Emitted when the root node ownership is conceded to the DAO owner.
   */
  event OwnershipConceded(address indexed owner);
  /**
   * @dev Emitted when the max emission number is updated.
   */
  event MaxEmissionNumberUpdated(uint256 maxEmissionNumber);

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

  /**
   * @notice Claim a name, registers it and mints a DAO token.
   * @param label The label to register.
   *
   * Emits a {NameRegistered} and {BookingDeleted} events.
   */
  function claim(string memory label, address account) external;

  /**
   * @notice Update max emission number.
   *
   * Emits a {MaxEmissionNumberUpdated} event.
   */
  function updateMaxEmissionNumber(uint256 emissionNumber) external;
}
