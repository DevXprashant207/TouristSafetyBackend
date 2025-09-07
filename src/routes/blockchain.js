const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const storage = require('../storage/memory');

const router = express.Router();

// Validation rules
const issueValidation = [
  body('blockchainId')
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Invalid blockchain ID'),
  body('userInfo.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Invalid user name'),
  body('userInfo.email')
    .isEmail()
    .withMessage('Invalid email address'),
  body('userInfo.phone')
    .isMobilePhone()
    .withMessage('Invalid phone number'),
];

/**
 * POST /api/blockchain/issue
 * Issue a blockchain identity
 * 
 * In production, this endpoint would:
 * 1. Connect to Ethereum/Polygon network via Web3 provider
 * 2. Call smart contract function to mint identity NFT
 * 3. Store transaction hash and block number
 * 4. Return real transaction details
 */
router.post('/issue', authenticateToken, issueValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
    }

    const { blockchainId, userInfo, metadata } = req.body;
    const userId = req.user.userId;

    // Check if this blockchain ID has already been issued
    const existingIssuance = storage.blockchainIssuances.find(
      issue => issue.blockchainId === blockchainId
    );

    if (existingIssuance) {
      return res.status(409).json({
        success: false,
        error: 'This blockchain ID has already been issued',
      });
    }

    // Generate mock transaction hash (in production, this would come from blockchain)
    const transactionHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    
    // Mock blockchain issuance (simulate network delay)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create blockchain issuance record
    const issuance = {
      id: uuidv4(),
      userId,
      blockchainId,
      userInfo,
      metadata: {
        ...metadata,
        issuedAt: new Date().toISOString(),
      },
      transactionHash,
      blockNumber: Math.floor(Math.random() * 1000000) + 18500000, // Mock block number
      networkId: 137, // Polygon mainnet
      contractAddress: '0x1234567890123456789012345678901234567890', // Mock contract
      tokenId: storage.blockchainIssuances.length + 1,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    storage.blockchainIssuances.push(issuance);

    console.log('🔗 Blockchain Identity Issued:', {
      userId,
      blockchainId,
      transactionHash,
      blockNumber: issuance.blockNumber,
    });

    /*
     * PRODUCTION INTEGRATION EXAMPLE:
     * 
     * // Using ethers.js with Ethereum/Polygon
     * const { ethers } = require('ethers');
     * 
     * const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
     * const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
     * const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
     * 
     * try {
     *   const tx = await contract.issueTouristId(
     *     blockchainId,
     *     userInfo.name,
     *     userInfo.email,
     *     JSON.stringify(metadata)
     *   );
     *   
     *   const receipt = await tx.wait();
     *   
     *   const issuance = {
     *     // ... other fields
     *     transactionHash: receipt.transactionHash,
     *     blockNumber: receipt.blockNumber,
     *     gasUsed: receipt.gasUsed.toString(),
     *   };
     * } catch (blockchainError) {
     *   return res.status(500).json({
     *     success: false,
     *     error: 'Blockchain transaction failed',
     *   });
     * }
     * 
     * // Using Hyperledger Fabric SDK
     * const FabricCAServices = require('fabric-ca-client');
     * const { Wallets, Gateway } = require('fabric-network');
     * 
     * const gateway = new Gateway();
     * await gateway.connect(connectionProfile, {
     *   wallet,
     *   identity: 'user1',
     *   discovery: { enabled: true, asLocalhost: true }
     * });
     * 
     * const network = await gateway.getNetwork('mychannel');
     * const contract = network.getContract('tourist-safety');
     * 
     * const result = await contract.submitTransaction(
     *   'issueTouristId',
     *   blockchainId,
     *   JSON.stringify(userInfo),
     *   JSON.stringify(metadata)
     * );
     */

    res.status(201).json({
      success: true,
      data: {
        transactionHash: issuance.transactionHash,
        blockNumber: issuance.blockNumber,
        networkId: issuance.networkId,
        contractAddress: issuance.contractAddress,
        tokenId: issuance.tokenId,
        explorerUrl: `https://polygonscan.com/tx/${issuance.transactionHash}`,
        message: 'Identity successfully issued to blockchain',
      },
    });

  } catch (error) {
    console.error('Blockchain issuance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during blockchain issuance',
    });
  }
});

/**
 * GET /api/blockchain/verify/:blockchainId
 * Verify a blockchain identity
 */
router.get('/verify/:blockchainId', (req, res) => {
  try {
    const { blockchainId } = req.params;

    const issuance = storage.blockchainIssuances.find(
      issue => issue.blockchainId === blockchainId
    );

    if (!issuance) {
      return res.status(404).json({
        success: false,
        error: 'Blockchain identity not found',
      });
    }

    // Return verification info (without sensitive data)
    res.json({
      success: true,
      data: {
        blockchainId: issuance.blockchainId,
        transactionHash: issuance.transactionHash,
        blockNumber: issuance.blockNumber,
        networkId: issuance.networkId,
        issuedAt: issuance.metadata.issuedAt,
        status: issuance.status,
        verified: true,
      },
    });

  } catch (error) {
    console.error('Blockchain verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during verification',
    });
  }
});

/**
 * GET /api/blockchain/issuances
 * Get user's blockchain issuances
 */
router.get('/issuances', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    const userIssuances = storage.blockchainIssuances
      .filter(issue => issue.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: { issuances: userIssuances },
    });

  } catch (error) {
    console.error('Get issuances error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching issuances',
    });
  }
});

module.exports = router;