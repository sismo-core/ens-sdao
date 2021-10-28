pragma solidity >=0.8.4;
import '@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol';

contract ERC721Minter is ERC721PresetMinterPauserAutoId {
  constructor(
    string memory name,
    string memory symbol,
    string memory baseTokenUri,
    address owner
  ) ERC721PresetMinterPauserAutoId(name, symbol, baseTokenUri) {
    _setupRole(DEFAULT_ADMIN_ROLE, owner);
  }

  function mint(address to, uint256 tokenId) public {
    require(
      hasRole(MINTER_ROLE, _msgSender()),
      'ERC721PresetMinterPauserAutoId: must have minter role to mint'
    );
    _mint(to, tokenId);
  }
}
