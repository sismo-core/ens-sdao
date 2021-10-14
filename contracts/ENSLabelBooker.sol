pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import {IENSLabelBooker} from './interfaces/IENSLabelBooker.sol';

contract ENSLabelBooker is Ownable, IENSLabelBooker {
  ENS public _ens;
  bytes32 public _rootNode;

  mapping(bytes32 => address) private bookings;

  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param node The node that this registrar administers.
   */
  constructor(ENS ensAddr, bytes32 node) {
    _ens = ensAddr;
    _rootNode = node;
  }

  function getBooking(bytes32 labelHash) public view returns (address) {
    return bookings[labelHash];
  }

  function _burnBooking(bytes32 labelHash) internal {
    bookings[labelHash] = address(0);
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
    bytes32 childNode = keccak256(abi.encodePacked(_rootNode, labelHash));
    _book(labelHash, bookingAddress);
    emit NameBooked(uint256(childNode), bookingAddress);
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
      bytes32 childNode = keccak256(abi.encodePacked(_rootNode, labelHash));
      _book(labelHash, bookingAddresses[i]);
      emit NameBooked(uint256(childNode), bookingAddresses[i]);
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
    bytes32 childNode = keccak256(abi.encodePacked(_rootNode, labelHash));
    _updateBook(labelHash, bookingAddress);
    emit BookingUpdated(uint256(childNode), bookingAddress);
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
      bytes32 childNode = keccak256(abi.encodePacked(_rootNode, labelHash));
      _updateBook(labelHash, bookingAddresses[i]);
      emit BookingUpdated(uint256(childNode), bookingAddresses[i]);
    }
  }

  function _book(bytes32 labelHash, address bookingAddress) internal {
    require(
      bookingAddress != address(0),
      'ENS_DAO_REGISTRAR: invalid booking address'
    );
    require(
      bookings[labelHash] == address(0),
      'ENS_DAO_REGISTRAR: label already booked'
    );
    address subdomainOwner = _ens.owner(
      keccak256(abi.encodePacked(_rootNode, labelHash))
    );
    require(
      subdomainOwner == address(0x0),
      'ENS_DAO_REGISTRAR: subdomain already registered'
    );
    bookings[labelHash] = bookingAddress;
  }

  function _updateBook(bytes32 labelHash, address bookingAddress) internal {
    require(
      bookingAddress != address(0),
      'ENS_DAO_REGISTRAR: invalid zero address as booking address'
    );
    require(
      bookings[labelHash] != address(0),
      'ENS_DAO_REGISTRAR: label not booked'
    );
    bookings[labelHash] = bookingAddress;
  }
}
