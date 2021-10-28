pragma solidity >=0.8.4;
import '@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol';
import {IGenToken} from './IGenToken.sol';

/**
 * @title GenToken contract.
 * @dev Implementation of the {IGenToken}.
 */
contract GenToken is ERC1155PresetMinterPauser, IGenToken {
  uint256[] public _gens;

  /**
   * @dev Constructor.
   * @param baseTokenUri Token URI.
   * @param initialGen The initial generation.
   * @param owner The owner of the contract.
   */
  constructor(
    string memory baseTokenUri,
    uint256 initialGen,
    address owner
  ) ERC1155PresetMinterPauser(baseTokenUri) {
    _setupRole(DEFAULT_ADMIN_ROLE, owner);
    uint256[] memory gens = new uint256[](1);
    gens[0] = initialGen;
    _gens = gens;
  }

  /**
   * @notice Grant minter role to an address.
   * @dev Can only be called by default admin.
   * @param minter The address of be granted the minter role.
   */
  function setMinter(address minter) public {
    // only default admin role can call
    grantRole(MINTER_ROLE, minter);
  }

  /**
   * @notice Mint one token of the current generation to an address.
   * @dev Can only be called by owner.
   * @param to The recipient address.
   */
  function mintTo(address to) public override {
    require(hasRole(MINTER_ROLE, _msgSender()), 'GEN_TOKEN: SENDER_NOT_MINTER');

    uint256 currentGen = _gens[_gens.length - 1];

    bytes memory data;
    _mint(to, currentGen, 1, data);
  }

  /**
   * @notice Get the accumulated balance of an account over the generations.
   * @param account The address.
   * @return The sum of the individual balance for the different generations.
   */
  function accumulatedBalanceOf(address account)
    public
    view
    override
    returns (uint256)
  {
    uint256 sum;
    for (uint256 i = 0; i < _gens.length; i++) {
      sum += balanceOf(account, _gens[i]);
    }
    return sum;
  }

  /**
   * @notice Add a generation.
   * @dev Can be called by the owner.
   * @param gen The generation to add.
   */
  function addGen(uint256 gen) public override {
    require(
      hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
      'GEN_TOKEN: SENDER_NOT_ADMIN'
    );
    for (uint256 i = 0; i < _gens.length; i++) {
      require(_gens[i] != gen, 'GEN_TOKEN: ALREADY_EXISTING_GEN');
    }
    _gens.push(gen);
    emit GenerationAdded(gen);
  }
}
