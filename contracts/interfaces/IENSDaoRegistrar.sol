pragma solidity >=0.8.4;

import '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import {IENSLabelBooker} from './IENSLabelBooker.sol';

interface IENSDaoRegistrar is IERC1155Receiver, IENSLabelBooker {
  // Logged when a new name is registered.
  event NameRegistered(uint256 indexed id, address indexed owner);
  // Logged when the root node ownership is conceded to the DAO owner.
  event OwnershipConceded(address indexed owner);
  // Logged when the max emission number is updated
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
   * Emits a {NameRegistered} and {BookingBurned} events.
   */
  function claim(string memory label, address account) external;

  /**
   * @notice Update max emission number.
   *
   * Emits a {MaxEmissionNumberUpdated} event.
   */
  function updateMaxEmissionNumber(uint256 emissionNumber) external;
}
