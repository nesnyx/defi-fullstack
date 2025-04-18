// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
// import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Scape is ERC20, ERC20Permit, AccessControl,Ownable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant FEE_SETTER_ROLE = keccak256("FEE_SETTER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 1e27; // 1 billion tokens with 18 decimals
    uint256 public constant BURN_FEE_PERCENT = 10; // 10% burn on transfers
    uint256 public constant TAX_FEE_PERCENT = 2; // 2% tax on transfers
    uint256 public FEE_PERCENT = 50;
    address public immutable taxWallet;
    address public feeCollector;
    mapping(address => bool) public isExcludedFromFees;

    event TokensMinted(address indexed minter, address indexed recipient, uint256 amount);
    event TokensBurned(address indexed burner, uint256 amount);
    event FeesDistributed(uint256 burnedAmount, uint256 taxAmount);
    event TransferWithFee(address indexed from, address indexed to, uint256 amount, uint256 fee);
    event FeeUpdated(uint256 newFee, address indexed updatedBy);
    event FeeCollectorUpdated(address indexed newCollector, address indexed updatedBy);

    constructor(
        address initialOwner,
        address _taxWallet,
        address[] memory minters,
        address[] memory burners
    ) ERC20("Scape", "SCPE")  Ownable(initialOwner) ERC20Permit("Scape") {
        require(_taxWallet != address(0), "Invalid tax wallet");
        
        taxWallet = _taxWallet;
        
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
        _grantRole(BURNER_ROLE, initialOwner);
        _grantRole(FEE_SETTER_ROLE,  _taxWallet);
        
        for (uint i = 0; i < minters.length; i++) {
            _grantRole(MINTER_ROLE, minters[i]);
        }
        
        for (uint i = 0; i < burners.length; i++) {
            _grantRole(BURNER_ROLE, burners[i]);
        }
        
        
        // Exclude owner and tax wallet from fees
        isExcludedFromFees[initialOwner] = true;
        isExcludedFromFees[_taxWallet] = true;
        
        _mint(initialOwner, 1e24); // Initial mint
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
        emit TokensMinted(msg.sender, to, amount);
    }

    function burn(uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }


    function transferWithAutoBurn(address to, uint256 amount) public returns (bool)  {
        require(balanceOf(msg.sender) >= amount, "Not enough tokens");
        
        if (isExcludedFromFees[msg.sender] || isExcludedFromFees[to]) {
            _transfer(msg.sender, to, amount);
            return true;
        }
        
        uint256 burnAmount = (amount * BURN_FEE_PERCENT) / 100;
        uint256 taxAmount = (amount * TAX_FEE_PERCENT) / 100;
        uint256 transferAmount = amount - burnAmount - taxAmount;
        
        _burn(msg.sender, burnAmount);
        _transfer(msg.sender, taxWallet, taxAmount);
        _transfer(msg.sender, to, transferAmount);
        
        emit FeesDistributed(burnAmount, taxAmount);
        return true;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        if (isExcludedFromFees[msg.sender] || isExcludedFromFees[to]) {
            return super.transfer(to, amount);
        }   
        
        return transferWithAutoBurn(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        if (isExcludedFromFees[from] || isExcludedFromFees[to]) {
            return super.transferFrom(from, to, amount);
        }
        
        uint256 burnAmount = (amount * BURN_FEE_PERCENT) / 100;
        uint256 taxAmount = (amount * TAX_FEE_PERCENT) / 100;
        uint256 transferAmount = amount - burnAmount - taxAmount;
        
        _spendAllowance(from, msg.sender, amount);
        _burn(from, burnAmount);
        _transfer(from, taxWallet, taxAmount);
        _transfer(from, to, transferAmount);
        
        emit FeesDistributed(burnAmount, taxAmount);
        return true;
    }

    function excludeFromFees(address account, bool excluded) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isExcludedFromFees[account] = excluded;
    }

    function setFeePercent(uint256 newFee) external onlyRole(FEE_SETTER_ROLE) {
        require(newFee <= 250, "Fee too high");
        FEE_PERCENT = newFee;
        emit FeeUpdated(newFee, msg.sender);
    }

    function setFeeCollector(address newCollector) external onlyRole(FEE_SETTER_ROLE) {
        require(newCollector != address(0), "Invalid address");
        feeCollector = newCollector;
        emit FeeCollectorUpdated(newCollector, msg.sender);
    }

    // Multi-signature functionality can be implemented using AccessControl with multiple admins
    // or by integrating with a dedicated multi-sig wallet like Gnosis Safe
}