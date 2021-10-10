pragma solidity >=0.8.4;
import '@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol';

contract ENSDaoToken is ERC721PresetMinterPauserAutoId {
  constructor(
    string memory name,
    string memory symbol,
    string memory baseTokenUri,
    address owner
  ) ERC721PresetMinterPauserAutoId(name, symbol, baseTokenUri) {
    _setupRole(DEFAULT_ADMIN_ROLE, owner);
  }

  function setMinter(address minter) public {
    // only default admin role can call
    grantRole(MINTER_ROLE, minter);
  }

  function mintTo(address to, uint256 tokenId) public {
    require(
      hasRole(MINTER_ROLE, _msgSender()),
      'ERC721PresetMinterPauserAutoId: must have minter role to mint'
    );
    // We cannot just use balanceOf to create the new tokenId because tokens
    // can be burned (destroyed), so we need a separate counter.
    _mint(to, tokenId);
  }
}
