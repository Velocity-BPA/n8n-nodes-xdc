/**
 * XDC Network Standard Contract ABIs
 * 
 * Common interfaces for XRC-20, XRC-721, and protocol contracts
 */

/**
 * XRC-20 Token Standard ABI
 * Compatible with ERC-20 standard
 */
export const XRC20_ABI = [
	// Read Functions
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address owner) view returns (uint256)',
	'function allowance(address owner, address spender) view returns (uint256)',
	
	// Write Functions
	'function transfer(address to, uint256 amount) returns (bool)',
	'function approve(address spender, uint256 amount) returns (bool)',
	'function transferFrom(address from, address to, uint256 amount) returns (bool)',
	
	// Events
	'event Transfer(address indexed from, address indexed to, uint256 value)',
	'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

/**
 * Full XRC-20 ABI with extended functions
 */
export const XRC20_FULL_ABI = [
	...XRC20_ABI,
	'function increaseAllowance(address spender, uint256 addedValue) returns (bool)',
	'function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)',
	'function burn(uint256 amount)',
	'function burnFrom(address account, uint256 amount)',
	'function mint(address to, uint256 amount)',
];

/**
 * XRC-721 NFT Standard ABI
 * Compatible with ERC-721 standard
 */
export const XRC721_ABI = [
	// Read Functions
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function tokenURI(uint256 tokenId) view returns (string)',
	'function balanceOf(address owner) view returns (uint256)',
	'function ownerOf(uint256 tokenId) view returns (address)',
	'function getApproved(uint256 tokenId) view returns (address)',
	'function isApprovedForAll(address owner, address operator) view returns (bool)',
	'function supportsInterface(bytes4 interfaceId) view returns (bool)',
	
	// Write Functions
	'function approve(address to, uint256 tokenId)',
	'function setApprovalForAll(address operator, bool approved)',
	'function transferFrom(address from, address to, uint256 tokenId)',
	'function safeTransferFrom(address from, address to, uint256 tokenId)',
	'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
	
	// Events
	'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
	'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
	'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
];

/**
 * XRC-721 Enumerable Extension ABI
 */
export const XRC721_ENUMERABLE_ABI = [
	...XRC721_ABI,
	'function totalSupply() view returns (uint256)',
	'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
	'function tokenByIndex(uint256 index) view returns (uint256)',
];

/**
 * XDPoS Validator Contract ABI
 */
export const VALIDATOR_ABI = [
	// Read Functions
	'function getCandidates() view returns (address[])',
	'function getCandidateCap(address candidate) view returns (uint256)',
	'function getCandidateOwner(address candidate) view returns (address)',
	'function getVoterCap(address candidate, address voter) view returns (uint256)',
	'function getVoters(address candidate) view returns (address[])',
	'function isCandidate(address candidate) view returns (bool)',
	'function getWithdrawBlockNumbers() view returns (uint256[])',
	'function getWithdrawCap(uint256 blockNumber) view returns (uint256)',
	'function candidateCount() view returns (uint256)',
	'function maxValidatorNumber() view returns (uint256)',
	'function candidateWithdrawDelay() view returns (uint256)',
	'function voterWithdrawDelay() view returns (uint256)',
	'function minCandidateCap() view returns (uint256)',
	'function minVoterCap() view returns (uint256)',
	
	// Write Functions
	'function propose(address candidate) payable',
	'function vote(address candidate) payable',
	'function unvote(address candidate, uint256 cap)',
	'function resign(address candidate)',
	'function withdraw(uint256 blockNumber, uint256 index)',
	
	// Events
	'event Propose(address indexed owner, address indexed candidate, uint256 cap)',
	'event Vote(address indexed voter, address indexed candidate, uint256 cap)',
	'event Unvote(address indexed voter, address indexed candidate, uint256 cap)',
	'event Resign(address indexed owner, address indexed candidate)',
	'event Withdraw(address indexed owner, uint256 blockNumber, uint256 cap)',
];

/**
 * Plugin Oracle ABI (Chainlink-compatible)
 */
export const PLUGIN_ORACLE_ABI = [
	// Read Functions
	'function latestAnswer() view returns (int256)',
	'function latestTimestamp() view returns (uint256)',
	'function latestRound() view returns (uint256)',
	'function getAnswer(uint256 roundId) view returns (int256)',
	'function getTimestamp(uint256 roundId) view returns (uint256)',
	'function decimals() view returns (uint8)',
	'function description() view returns (string)',
	'function version() view returns (uint256)',
	
	// Aggregator V3 Interface
	'function getRoundData(uint80 _roundId) view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
	'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
	
	// Events
	'event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt)',
	'event NewRound(uint256 indexed roundId, address indexed startedBy, uint256 startedAt)',
];

/**
 * Fathom Protocol Position Manager ABI
 */
export const FATHOM_POSITION_MANAGER_ABI = [
	// Read Functions
	'function positions(uint256 positionId) view returns (uint256 collateral, uint256 debt, address owner)',
	'function getPositionIds(address owner) view returns (uint256[])',
	'function getCollateralRatio(uint256 positionId) view returns (uint256)',
	'function getLiquidationPrice(uint256 positionId) view returns (uint256)',
	'function getTotalDebt() view returns (uint256)',
	'function getTotalCollateral() view returns (uint256)',
	
	// Write Functions
	'function openPosition(address collateralType, uint256 collateralAmount, uint256 debtAmount)',
	'function closePosition(uint256 positionId)',
	'function depositCollateral(uint256 positionId, uint256 amount)',
	'function withdrawCollateral(uint256 positionId, uint256 amount)',
	'function borrowFXD(uint256 positionId, uint256 amount)',
	'function repayFXD(uint256 positionId, uint256 amount)',
	
	// Events
	'event PositionOpened(uint256 indexed positionId, address indexed owner, address collateralType)',
	'event PositionClosed(uint256 indexed positionId)',
	'event CollateralDeposited(uint256 indexed positionId, uint256 amount)',
	'event CollateralWithdrawn(uint256 indexed positionId, uint256 amount)',
	'event DebtIncreased(uint256 indexed positionId, uint256 amount)',
	'event DebtDecreased(uint256 indexed positionId, uint256 amount)',
];

/**
 * DEX Router ABI (Uniswap V2 compatible)
 */
export const DEX_ROUTER_ABI = [
	// Read Functions
	'function factory() view returns (address)',
	'function WETH() view returns (address)',
	'function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)',
	'function getAmountsIn(uint256 amountOut, address[] path) view returns (uint256[] amounts)',
	'function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) pure returns (uint256 amountB)',
	
	// Write Functions
	'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
	'function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
	'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)',
	'function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
	'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
	'function swapETHForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)',
	
	// Liquidity Functions
	'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
	'function addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)',
	'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB)',
	'function removeLiquidityETH(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) returns (uint256 amountToken, uint256 amountETH)',
];

/**
 * DEX Factory ABI
 */
export const DEX_FACTORY_ABI = [
	'function getPair(address tokenA, address tokenB) view returns (address pair)',
	'function allPairs(uint256 index) view returns (address pair)',
	'function allPairsLength() view returns (uint256)',
	'function feeTo() view returns (address)',
	'function feeToSetter() view returns (address)',
	'function createPair(address tokenA, address tokenB) returns (address pair)',
	
	'event PairCreated(address indexed token0, address indexed token1, address pair, uint256)',
];

/**
 * DEX Pair ABI
 */
export const DEX_PAIR_ABI = [
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address owner) view returns (uint256)',
	'function token0() view returns (address)',
	'function token1() view returns (address)',
	'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
	'function price0CumulativeLast() view returns (uint256)',
	'function price1CumulativeLast() view returns (uint256)',
	'function kLast() view returns (uint256)',
	
	'event Sync(uint112 reserve0, uint112 reserve1)',
	'event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)',
];

/**
 * Trade Finance Document Registry ABI
 */
export const TRADE_DOCUMENT_ABI = [
	// Read Functions
	'function getDocument(bytes32 documentHash) view returns (address issuer, uint256 timestamp, string documentType, bool verified)',
	'function getDocumentHistory(bytes32 documentHash) view returns (tuple(address actor, string action, uint256 timestamp)[])',
	'function isDocumentVerified(bytes32 documentHash) view returns (bool)',
	'function getDocumentsByIssuer(address issuer) view returns (bytes32[])',
	
	// Write Functions
	'function registerDocument(bytes32 documentHash, string documentType, string metadata)',
	'function verifyDocument(bytes32 documentHash)',
	'function revokeDocument(bytes32 documentHash)',
	'function updateDocumentStatus(bytes32 documentHash, string status)',
	
	// Events
	'event DocumentRegistered(bytes32 indexed documentHash, address indexed issuer, string documentType)',
	'event DocumentVerified(bytes32 indexed documentHash, address indexed verifier)',
	'event DocumentRevoked(bytes32 indexed documentHash, address indexed revoker)',
	'event DocumentStatusUpdated(bytes32 indexed documentHash, string status)',
];

/**
 * Subnet Bridge ABI
 */
export const SUBNET_BRIDGE_ABI = [
	// Read Functions
	'function getDepositStatus(bytes32 depositId) view returns (bool completed, uint256 amount, address recipient)',
	'function getWithdrawalStatus(bytes32 withdrawalId) view returns (bool completed, uint256 amount, address recipient)',
	'function pendingDeposits(address account) view returns (uint256)',
	'function pendingWithdrawals(address account) view returns (uint256)',
	
	// Write Functions
	'function deposit(uint256 amount, bytes32 subnetRecipient) payable',
	'function withdraw(uint256 amount, address mainnetRecipient)',
	'function claimDeposit(bytes32 depositId, bytes proof)',
	'function claimWithdrawal(bytes32 withdrawalId, bytes proof)',
	
	// Events
	'event Deposit(bytes32 indexed depositId, address indexed sender, uint256 amount, bytes32 subnetRecipient)',
	'event Withdrawal(bytes32 indexed withdrawalId, address indexed recipient, uint256 amount)',
	'event DepositClaimed(bytes32 indexed depositId)',
	'event WithdrawalClaimed(bytes32 indexed withdrawalId)',
];

/**
 * Multicall ABI for batch calls
 */
export const MULTICALL_ABI = [
	'function aggregate(tuple(address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)',
	'function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[] returnData)',
	'function getBlockHash(uint256 blockNumber) view returns (bytes32 blockHash)',
	'function getBlockNumber() view returns (uint256 blockNumber)',
	'function getCurrentBlockCoinbase() view returns (address coinbase)',
	'function getCurrentBlockDifficulty() view returns (uint256 difficulty)',
	'function getCurrentBlockGasLimit() view returns (uint256 gaslimit)',
	'function getCurrentBlockTimestamp() view returns (uint256 timestamp)',
	'function getEthBalance(address addr) view returns (uint256 balance)',
	'function getLastBlockHash() view returns (bytes32 blockHash)',
];

/**
 * ABI map for easy access
 */
export const ABIS = {
	XRC20: XRC20_ABI,
	XRC20_FULL: XRC20_FULL_ABI,
	XRC721: XRC721_ABI,
	XRC721_ENUMERABLE: XRC721_ENUMERABLE_ABI,
	VALIDATOR: VALIDATOR_ABI,
	PLUGIN_ORACLE: PLUGIN_ORACLE_ABI,
	FATHOM_POSITION: FATHOM_POSITION_MANAGER_ABI,
	DEX_ROUTER: DEX_ROUTER_ABI,
	DEX_FACTORY: DEX_FACTORY_ABI,
	DEX_PAIR: DEX_PAIR_ABI,
	TRADE_DOCUMENT: TRADE_DOCUMENT_ABI,
	SUBNET_BRIDGE: SUBNET_BRIDGE_ABI,
	MULTICALL: MULTICALL_ABI,
};
