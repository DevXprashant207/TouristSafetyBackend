const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const Blockchain = require('../models/Blockchain');
const router = express.Router();

// ----------------------
// Validation
// ----------------------
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

// ----------------------
// Routes
// ----------------------

// Issue blockchain identity
router.post('/issue', authenticateToken, issueValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { blockchainId, userInfo, metadata } = req.body;
    const userId = req.user.userId;

    // Check if already issued
    const existing = await BlockchainIssuance.findOne({ blockchainId });
    if (existing) {
      return res.status(409).json({ success: false, error: 'This blockchain ID has already been issued' });
    }

    // Mock blockchain transaction
    const transactionHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    const blockNumber = Math.floor(Math.random() * 1000000) + 18500000;
    const networkId = 137; // Polygon mainnet
    const contractAddress = '0x1234567890123456789012345678901234567890';

    // Count for tokenId
    const tokenId = (await BlockchainIssuance.countDocuments()) + 1;

    const issuance = new BlockchainIssuance({
      userId,
      blockchainId,
      userInfo,
      metadata: { ...metadata, issuedAt: new Date().toISOString() },
      transactionHash,
      blockNumber,
      networkId,
      contractAddress,
      tokenId,
      status: 'CONFIRMED',
    });

    await issuance.save();

    res.status(201).json({
      success: true,
      data: {
        transactionHash,
        blockNumber,
        networkId,
        contractAddress,
        tokenId,
        explorerUrl: `https://polygonscan.com/tx/${transactionHash}`,
        message: 'Identity successfully issued to blockchain',
      },
    });

  } catch (error) {
    console.error('Blockchain issuance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during blockchain issuance' });
  }
});

// Verify blockchain identity
router.get('/verify/:blockchainId', async (req, res) => {
  try {
    const { blockchainId } = req.params;

    const issuance = await BlockchainIssuance.findOne({ blockchainId });
    if (!issuance) {
      return res.status(404).json({ success: false, error: 'Blockchain identity not found' });
    }

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
    res.status(500).json({ success: false, error: 'Internal server error during verification' });
  }
});

// Get all user's blockchain issuances
router.get('/issuances', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const issuances = await BlockchainIssuance.find({ userId }).sort({ createdAt: -1 });

    res.json({ success: true, data: { issuances } });

  } catch (error) {
    console.error('Get issuances error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while fetching issuances' });
  }
});

module.exports = router;
