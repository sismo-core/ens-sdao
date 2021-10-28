pragma solidity >=0.8.4;

import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';

/**
 * @title IGenToken interface
 */
interface IGenToken is IERC1155 {
  /**
   * @dev Emitted when a generation is added.
   */
  event GenerationAdded(uint256 gen);

  /**
   * @notice Add a generation.
   *
   * Emits a {GenerationAdded} event.
   */
  function addGen(uint256 gen) external;

  /**
   * @notice Mint one token of the current generation to an address.
   * @param to The recipient address.
   */
  function mintTo(address to) external;

  /**
   * @notice Get the accumulated balance of an account over the generations.
   * @param account The address.
   * @return The sum of the individual balance for the different generations.
   */
  function accumulatedBalanceOf(address account)
    external
    view
    returns (uint256);
}
