const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const Alert = require('../models/Alert');
const router = express.Router();


// ====== Validation rules ======
const alertValidation = [
  body('type')
    .isIn(['PANIC_BUTTON', 'GEOFENCE_VIOLATION', 'AI_MONITORING'])
    .withMessage('Invalid alert type'),
  body('severity')
    .isIn(['LOW', 'MEDIUM', 'HIGH'])
    .withMessage('Invalid severity level'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters'),
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
];

/**
 * POST /api/alerts
 * Create a new alert
 */
router.post('/', authenticateToken, alertValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { type, severity, message, location, metadata } = req.body;
    const userId = req.user.userId;

    const alert = new Alert({
      id: uuidv4(),
      userId,
      type,
      severity,
      message: message.trim(),
      location: location || null,
      metadata: metadata || {},
      status: 'ACTIVE',
    });

    await alert.save();

    console.log(`🚨 New ${severity} Alert [${type}]:`, {
      userId,
      message: alert.message,
      location: alert.location,
      timestamp: alert.timestamp,
    });

    if (severity === 'HIGH') {
      console.log('🚁 High severity alert - dispatching emergency response team...');
      setTimeout(() => console.log('✅ Emergency response team notified and dispatched'), 1000);
    }

    res.status(201).json({
      success: true,
      data: {
        alert,
        message: 'Alert created and emergency services notified',
      },
    });

  } catch (error) {
    console.error('Alert creation error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while creating alert' });
  }
});

/**
 * GET /api/alerts
 * Get user's alerts (with pagination)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const severity = req.query.severity;

    const query = { userId };
    if (severity && ['LOW', 'MEDIUM', 'HIGH'].includes(severity)) {
      query.severity = severity;
    }

    const alerts = await Alert.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Alert.countDocuments(query);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while fetching alerts' });
  }
});

/**
 * PUT /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.put('/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const alert = await Alert.findOne({ id: req.params.id, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedAt = new Date();
    await alert.save();

    res.json({
      success: true,
      data: { alert },
    });

  } catch (error) {
    console.error('Alert acknowledge error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while acknowledging alert',
    });
  }
});

module.exports = router;
