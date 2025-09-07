const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const storage = require('../storage/memory');

const router = express.Router();

// Validation rules
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
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
    }

    const { type, severity, message, location, metadata } = req.body;
    const userId = req.user.userId;

    // Create alert
    const alert = {
      id: uuidv4(),
      userId,
      type,
      severity,
      message: message.trim(),
      location: location || null,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      status: 'ACTIVE', // ACTIVE, ACKNOWLEDGED, RESOLVED
    };

    storage.alerts.push(alert);

    // Log alert for demonstration
    console.log(`🚨 New ${severity} Alert [${type}]:`, {
      userId,
      message: alert.message,
      location: alert.location,
      timestamp: alert.timestamp,
    });

    // In production, this is where you would:
    // 1. Send push notifications to authorities
    // 2. Trigger automated response workflows
    // 3. Update real-time monitoring dashboards
    // 4. Send SMS/email notifications to emergency contacts

    // Simulate processing time for high-severity alerts
    if (severity === 'HIGH') {
      console.log('🚁 High severity alert - dispatching emergency response team...');
      
      // Mock emergency response
      setTimeout(() => {
        console.log('✅ Emergency response team notified and dispatched');
      }, 1000);
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
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating alert',
    });
  }
});

/**
 * GET /api/alerts
 * Get user's alerts (with pagination)
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const severity = req.query.severity; // Optional filter

    // Filter alerts for the user
    let userAlerts = storage.alerts
      .filter(alert => alert.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply severity filter if provided
    if (severity && ['LOW', 'MEDIUM', 'HIGH'].includes(severity)) {
      userAlerts = userAlerts.filter(alert => alert.severity === severity);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAlerts = userAlerts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        alerts: paginatedAlerts,
        pagination: {
          page,
          limit,
          total: userAlerts.length,
          totalPages: Math.ceil(userAlerts.length / limit),
        },
      },
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching alerts',
    });
  }
});

/**
 * PUT /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.put('/:id/acknowledge', authenticateToken, (req, res) => {
  try {
    const alertId = req.params.id;
    const userId = req.user.userId;

    const alert = storage.alerts.find(a => a.id === alertId && a.userId === userId);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedAt = new Date().toISOString();

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