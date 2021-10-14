pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import {IENSLabelBooker} from './interfaces/IENSLabelBooker.sol';

contract ENSLabelBooker is Ownable, IENSLabelBooker {
  ENS public _ens;
  bytes32 public _rootNode;

  mapping(bytes32 => address) private _bookings;

  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param node The node that this registrar administers.
   */
  constructor(ENS ensAddr, bytes32 node) {
    _ens = ensAddr;
    _rootNode = node;
  }

  /**
   * @notice Get the address of a booking.
   *         The zero address means the booking does not exist.
   * @param label The booked label.
   * @return The address associated to the booking.
   */
  function getBooking(string memory label) external view returns (address) {
    bytes32 labelHash = keccak256(bytes(label));
    return _getBooking(labelHash);
  }

  /**
   * @notice Book a label with an address for a later claim.
   * @dev Can only be called by owner of the DAO registrar.
   * @param label The label to book.
   * @param bookingAddress The address which can claim the label.
   */
  function book(string memory label, address bookingAddress)
    external
    override
    onlyOwner
  {
    bytes32 labelHash = keccak256(bytes(label));
    _book(labelHash, bookingAddress);
  }

  /**
   * @notice Batch book operations given a list of labels and bookingAddresses.
   * @dev Can only be called by owner of the DAO registrar.
   *      Input lists must have the same length.
   * @param labels The list of label to book.
   * @param bookingAddresses The list of address which can claim the associated label.
   */
  function batchBook(string[] memory labels, address[] memory bookingAddresses)
    external
    override
    onlyOwner
  {
    require(
      labels.length == bookingAddresses.length,
      'ENS_DAO_REGISTRAR: invalid labels and bookingAddresses arguments'
    );
    for (uint256 i; i < labels.length; i++) {
      bytes32 labelHash = keccak256(bytes(labels[i]));
      _book(labelHash, bookingAddresses[i]);
    }
  }

  /**
   * @notice Update the address of a book address.
   * @dev Can only be called by owner of the DAO registrar.
   * @param label The label of the book.
   * @param bookingAddress The address which can claim the label.
   */
  function updateBook(string memory label, address bookingAddress)
    external
    override
    onlyOwner
  {
    bytes32 labelHash = keccak256(bytes(label));
    _updateBook(labelHash, bookingAddress);
  }

  /**
   * @notice Update the addresses of books.
   * @dev Can only be called by owner of the DAO registrar.
   *      Input lists must have the same length.
   * @param labels The list of label to book.
   * @param bookingAddresses The list of address which can claim the associated label.
   */
  function batchUpdateBook(
    string[] memory labels,
    address[] memory bookingAddresses
  ) external override onlyOwner {
    require(
      labels.length == bookingAddresses.length,
      'ENS_DAO_REGISTRAR: invalid labels and bookingAddresses arguments'
    );
    for (uint256 i; i < labels.length; i++) {
      bytes32 labelHash = keccak256(bytes(labels[i]));
      _updateBook(labelHash, bookingAddresses[i]);
    }
  }

  /**
   * @dev Get the address of a booking.
   * @param labelHash The hash of the label associated to the booking.
   * @return The address associated to the booking.
   */
  function _getBooking(bytes32 labelHash) internal view returns (address) {
    return _bookings[labelHash];
  }

  /**
   * @dev Delete a booking
   * @param labelHash The hash of the label associated to the booking.
   */
  function _burnBooking(bytes32 labelHash) internal {
    bytes32 childNode = keccak256(abi.encodePacked(_rootNode, labelHash));
    _bookings[labelHash] = address(0);
    emit BookingBurned(childNode);
  }

  /**
   * @dev Create a booking
   * @param labelHash The hash of the label associated to the booking.
   * @param bookingAddress The address associated to the booking.
   */
  function _book(bytes32 labelHash, address bookingAddress) internal {
    require(
      bookingAddress != address(0),
      'ENS_DAO_REGISTRAR: invalid booking address'
    );
    require(
      _bookings[labelHash] == address(0),
      'ENS_DAO_REGISTRAR: label already booked'
    );
    address subdomainOwner = _ens.owner(
      keccak256(abi.encodePacked(_rootNode, labelHash))
    );
    require(
      subdomainOwner == address(0x0),
      'ENS_DAO_REGISTRAR: subdomain already registered'
    );
    bytes32 childNode = keccak256(abi.encodePacked(_rootNode, labelHash));
    _bookings[labelHash] = bookingAddress;
    emit NameBooked(uint256(childNode), bookingAddress);
  }

  /**
   * @dev Update the address of a booking
   * @param labelHash The hash of the label associated to the booking.
   * @param bookingAddress The new address associated to the booking.
   */
  function _updateBook(bytes32 labelHash, address bookingAddress) internal {
    require(
      bookingAddress != address(0),
      'ENS_DAO_REGISTRAR: invalid zero address as booking address'
    );
    require(
      _bookings[labelHash] != address(0),
      'ENS_DAO_REGISTRAR: label not booked'
    );
    bytes32 childNode = keccak256(abi.encodePacked(_rootNode, labelHash));
    _bookings[labelHash] = bookingAddress;
    emit BookingUpdated(uint256(childNode), bookingAddress);
  }
}
