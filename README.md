# n8n-nodes-xdc

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for **XDC Network** - an enterprise-grade hybrid blockchain optimized for trade finance, international payments, and tokenized assets. Provides 10 resource categories and 50+ operations for complete blockchain integration.

![n8n](https://img.shields.io/badge/n8n-community--node-blue)
![XDC Network](https://img.shields.io/badge/XDC-Network-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)

---

## Features

### Resources
- **Account** - Balance queries, transaction history, token holdings, address validation
- **Transaction** - Send XDC, monitor transactions, estimate gas, get receipts
- **XRC-20 Token** - Token transfers, approvals, balances, allowances
- **XRC-721 NFT** - NFT metadata, transfers, collections, ownership
- **Smart Contract** - Read/write contract calls, ABI encoding, event logs
- **Trade Finance** - Document hashing, LC references, ISO 20022 validation
- **Masternode** - XDPoS staking, voting, rewards, epoch info
- **DeFi** - DEX swaps, liquidity pools, token prices
- **Block** - Block data, rewards, timestamps, epoch calculation
- **Utility** - Address conversion, unit conversion, hashing, signing

### Trigger Events
- New blocks
- New epochs (every 900 blocks)
- Address transactions
- Token transfers

---

## Installation

### Community Nodes (Recommended)

1. Go to **Settings** → **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-xdc`
4. Accept the risks and install

### Manual Installation

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-xdc
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-xdc.git
cd n8n-nodes-xdc

# Install dependencies
npm install

# Build
npm run build

# Link to n8n custom directory
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-xdc

# Restart n8n
n8n start
```

---

## Credentials Setup

### XDC Network Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Network | Mainnet (Chain 50) or Apothem Testnet (Chain 51) | Yes |
| RPC URL | Custom RPC endpoint (auto-filled based on network) | No |
| Private Key | Required for write operations (sending transactions) | No |

### XdcScan Credentials (Optional)

| Field | Description | Required |
|-------|-------------|----------|
| Network | Mainnet or Apothem | Yes |
| API Key | BlocksScan API key for explorer data | Yes |

---

## Resources & Operations

### Account
| Operation | Description |
|-----------|-------------|
| Get Balance | Get XDC balance for an address |
| Get Token Balances | Get all token balances for an address |
| Get Transactions | Get transaction history for an address |
| Validate Address | Check if an address is valid |

### Transaction
| Operation | Description |
|-----------|-------------|
| Send XDC | Send XDC to another address |
| Get History | Get transaction history |
| Get Receipt | Get transaction receipt by hash |
| Estimate Gas | Estimate gas for a transaction |
| Get Status | Check transaction status |

### Token (XRC-20)
| Operation | Description |
|-----------|-------------|
| Get Balance | Get token balance for an address |
| Transfer | Transfer tokens to another address |
| Get Info | Get token metadata (name, symbol, decimals) |
| Approve | Approve spending allowance |
| Get Allowance | Check spending allowance |

### NFT (XRC-721)
| Operation | Description |
|-----------|-------------|
| Get Metadata | Get NFT metadata and attributes |
| Get Owner | Get current owner of an NFT |
| Transfer | Transfer NFT to another address |
| Get Balance | Get NFT balance for an address |
| Get Tokens Owned | List all NFTs owned by an address |

### Smart Contract
| Operation | Description |
|-----------|-------------|
| Call | Read data from a contract (no gas) |
| Execute | Write data to a contract (requires gas) |
| Get Events | Get contract event logs |
| Get ABI | Fetch contract ABI from explorer |
| Deploy | Deploy a new contract |

### Trade Finance
| Operation | Description |
|-----------|-------------|
| Generate Hash | Create SHA256/Keccak256 hash of documents |
| Verify Hash | Verify document hash matches |
| Generate LC Reference | Generate Letter of Credit reference |
| Validate ISO 20022 | Validate ISO 20022 message format |

### Masternode
| Operation | Description |
|-----------|-------------|
| Get Candidates | List all masternode candidates |
| Get Masternode Info | Get details about a specific masternode |
| Get Epoch Info | Get current epoch information |
| Get Voter Info | Get voting information for an address |
| Calculate Rewards | Estimate staking rewards |
| Vote | Stake XDC with a masternode |
| Unvote | Withdraw stake from a masternode |
| Withdraw | Withdraw available rewards |

### DeFi
| Operation | Description |
|-----------|-------------|
| Get XDC Price | Get current XDC/USD price |
| Get Token Price | Get token price in XDC or USD |
| Get Swap Quote | Get quote for token swap |
| Execute Swap | Execute token swap on DEX |
| Get Liquidity Pool | Get liquidity pool information |

### Block
| Operation | Description |
|-----------|-------------|
| Get Block | Get block by number or hash |
| Get Latest Block | Get the most recent block |
| Get Block Transactions | Get all transactions in a block |
| Get Block Reward | Get mining reward for a block |
| Get Block By Timestamp | Find block closest to a timestamp |

### Utility
| Operation | Description |
|-----------|-------------|
| Convert Units | Convert between wei, gwei, and XDC |
| Convert Address | Convert between xdc and 0x formats |
| Validate Address | Check if address is valid |
| Keccak256 | Compute Keccak256 hash |
| Encode ABI | ABI encode function call |
| Decode ABI | ABI decode return data |
| Sign Message | Sign a message with private key |
| Verify Signature | Verify message signature |
| Get Network Status | Get network status and gas prices |
| Generate Wallet | Generate new wallet address |

---

## Trigger Node

The XDC Trigger node monitors blockchain events and triggers workflows.

### Events

| Event | Description |
|-------|-------------|
| New Block | Triggers when a new block is mined |
| New Epoch | Triggers when a new epoch starts (every 900 blocks) |
| New Transaction | Triggers when a watched address receives a transaction |
| Token Transfer | Triggers when a token transfer occurs |

### Configuration

| Parameter | Description |
|-----------|-------------|
| Event | The event type to monitor |
| Address | (Optional) Address to watch for transactions |
| Token Contract | (Optional) Token contract to monitor for transfers |
| Polling Interval | How often to check for new events (default: 30s) |

---

## Usage Examples

### Get Account Balance

```json
{
  "resource": "account",
  "operation": "getBalance",
  "address": "xdc1234567890abcdef1234567890abcdef12345678"
}
```

### Send XDC

```json
{
  "resource": "transaction",
  "operation": "sendXdc",
  "toAddress": "xdc1234567890abcdef1234567890abcdef12345678",
  "amount": "100"
}
```

### Check Token Balance

```json
{
  "resource": "token",
  "operation": "getBalance",
  "tokenAddress": "xdcTokenContractAddress...",
  "walletAddress": "xdcWalletAddress..."
}
```

### Generate Trade Document Hash

```json
{
  "resource": "tradeFinance",
  "operation": "generateHash",
  "documentContent": "Bill of Lading content...",
  "hashAlgorithm": "SHA256"
}
```

### Vote for Masternode

```json
{
  "resource": "masternode",
  "operation": "vote",
  "masternodeAddress": "xdcMasternodeAddress...",
  "stakeAmount": "10000"
}
```

---

## XDC Network Concepts

### Network Overview
- **Consensus**: XDPoS (Delegated Proof of Stake)
- **Block Time**: ~2 seconds
- **Epoch Length**: 900 blocks (~30 minutes)
- **Masternodes**: 108 validators
- **Native Token**: XDC
- **Token Standards**: XRC-20, XRC-721

### Key Ecosystem Protocols
- **Fathom Protocol** - CDP/stablecoin (FXD)
- **Plugin Oracle** - Decentralized data feeds (PLI)
- **XSwap/Globiance** - DEX platforms
- **XDC Subnet** - Layer 2 scaling

### Address Formats
XDC Network uses two address formats:
- **xdc format**: `xdc1234567890abcdef1234567890abcdef12345678`
- **0x format**: `0x1234567890abcdef1234567890abcdef12345678`

Both formats are interchangeable and represent the same address.

---

## Networks

| Network | Chain ID | RPC Endpoint | Explorer |
|---------|----------|--------------|----------|
| Mainnet | 50 | https://rpc.xinfin.network | https://xdc.blocksscan.io |
| Apothem | 51 | https://rpc.apothem.network | https://apothem.blocksscan.io |

---

## Error Handling

The node includes comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **Invalid Address**: Clear error message with address format guidance
- **Insufficient Funds**: Detailed balance information
- **Gas Estimation Failed**: Suggested gas limit values
- **Contract Errors**: Decoded revert reasons when available

---

## Security Best Practices

1. **Private Key Storage**: Never hardcode private keys. Use n8n credentials.
2. **Testnet First**: Always test workflows on Apothem testnet before mainnet.
3. **Gas Limits**: Set appropriate gas limits to prevent unexpected costs.
4. **Address Validation**: Always validate addresses before transactions.
5. **Amount Verification**: Double-check amounts before sending transactions.

---

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

---

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

---

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

---

## Contributing

Contributions are welcome! Please ensure:

1. All code follows the existing style
2. Tests are added for new features
3. Documentation is updated
4. Licensing headers are included in new files

---

## Support

- [XDC Network](https://xinfin.org)
- [XDC Documentation](https://docs.xdc.org)
- [BlocksScan Explorer](https://xdc.blocksscan.io)
- [XDC Faucet (Testnet)](https://faucet.apothem.network)

---

## Acknowledgments

- [XDC Network](https://xinfin.org) for the enterprise blockchain platform
- [n8n](https://n8n.io) for the workflow automation platform
- [ethers.js](https://ethers.org) for Ethereum/XDC library

---

Built with ❤️ for the XDC Network community
