pragma solidity >=0.8.4;

import {IENSDaoRegistrar} from '../IENSDaoRegistrar.sol';

/**
 * @title IENSDaoRegistrarClaimable interface.
 * @notice An optional extension allowing to interact with an ENSLabelBooker and claim booked subdomains.
 */
interface IENSDaoRegistrarClaimable is IENSDaoRegistrar {
  /**
   * @notice Claim a booked name.
   * @param label The label to register.
   * @param account The address that will receive the subdomain and the DAO token.
   */
  function claim(string memory label, address account) external;
}
