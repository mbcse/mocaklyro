# Simplified Developer Credential Schema - POC Version

## Overview

This is a simplified developer credential schema designed for easy Proof-of-Concept (POC) implementation on the MOCA network. The schema uses only basic data types (string, number, integer) and a flat structure for simple verification and testing.

## Design Principles

### 1. **Simplicity First**
- Only basic data types: `string`, `number`, `integer`
- Flat structure - no nested objects or arrays
- Minimal required fields for quick setup

### 2. **Essential Data Only**
The schema includes only the most important developer metrics:
- **Identity**: Name, GitHub username, email, location
- **GitHub Stats**: Repositories, stars, forks, contributions, followers, PRs, issues
- **Technical Skills**: Total lines of code, Solidity expertise  
- **Web3 Activity**: Smart contracts deployed (mainnet + testnet), TVL, unique users, transactions
- **Achievements**: Hackathon wins and participations
- **Scoring**: Overall score, Web3 score, developer worth
- **Verification**: Data source, last update, verification level

## Schema Structure

### Core Fields (Required):
- `id` - Unique identifier
- `name` - Developer's full name
- `githubUsername` - Primary verification anchor
- `totalRepositories` - Repository count
- `totalContributions` - Total GitHub activity
- `overallScore` - Computed developer score

### Extended Fields (Optional):
- Basic profile info (email, location)
- GitHub metrics (stars, forks, followers, account age, PRs, issues)
- Technical skills (total lines of code, Solidity LOC)
- Web3 activity (mainnet contracts, testnet contracts, TVL, unique users, total transactions)
- Achievements (hackathon wins/participations)
- Scoring metrics (Web3 score, developer worth)
- Verification metadata (source, timestamp, level)

## POC Benefits

### 1. **Easy Implementation**
- Simple JSON structure
- No complex data transformations needed
- Direct mapping from Klyro data

### 2. **Quick Verification**
- All values are easily comparable
- Numbers can be validated with simple checks
- Strings can be cross-referenced directly

### 3. **Minimal Storage**
- Flat structure uses less storage space
- No nested indexing required
- Fast read/write operations

## Example Verification Checks

### Basic Verification:
```
- Check GitHub username exists
- Verify repository count > 0
- Confirm overall score is reasonable (0-100 range)
- Validate PR and issue counts
```

### Advanced Verification:
```
- Cross-check stars/forks with GitHub API
- Validate smart contract addresses on blockchain
- Verify hackathon wins through public records
- Check transaction history on-chain
- Confirm unique users through contract interactions
```

## Usage for POC

This simplified schema is perfect for:
- **Initial testing** of MOCA credential system
- **Demo purposes** with clean, readable data
- **Rapid prototyping** without complex data handling
- **Performance testing** with minimal overhead

## Data Mapping from Klyro

```
Klyro Field → Schema Field
userData.name → name
userData.login → githubUsername
userData.email → email
userData.location → location
userData.public_repos → totalRepositories
userRepoData.totalStars → totalStars
userRepoData.totalForks → totalForks
contributionData.totalContributions → totalContributions
contributionData.totalPRs → totalPullRequests
contributionData.totalIssues → totalIssues
userData.followers → followers
userData.accountAge → accountAge
userRepoData.totalLanguageLinesOfCode.total → totalLinesOfCode
userRepoData.totalLanguageLinesOfCode.Solidity → solidityLinesOfCode
contractsDeployed.mainnet.count → mainnetContracts
contractsDeployed.testnet.count → testnetContracts
contractsDeployed.totalTVL → totalTVL
contractsDeployed.uniqueUsers → uniqueUsers
transactionData.totalTransactions → totalTransactions
hackathonData.totalWins → hackathonWins
hackathonData.totalHackerExperience → hackathonParticipations
score.totalScore → overallScore
score.metrics.web3.total → web3Score
developerWorth.totalWorth → developerWorth
```

## Next Steps

After POC validation, this schema can be extended to:
- Add more complex data structures
- Include additional verification methods
- Support different developer types
- Add more detailed metrics

## Technical Notes

- All numbers should be non-negative
- Strings should be UTF-8 encoded
- Timestamps in ISO 8601 format
- Scores typically range 0-100
- Developer worth in USD
- Lines of code as integers
- Contract counts include both mainnet and testnet deployments
- Transaction counts include all blockchain activities 