const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const storage = require('../storage/memory');

const router = express.Router();

/**
 * GET /aapi/dashboard
 * Get dashboard statistics and data
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    // In production, these would be real-time queries to your database
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate today's alerts
    const todayAlerts = storage.alerts.filter(
      alert => new Date(alert.timestamp) >= todayStart
    );

    const highAlerts = todayAlerts.filter(a => a.severity === 'HIGH').length;
    const mediumAlerts = todayAlerts.filter(a => a.severity === 'MEDIUM').length;
    const lowAlerts = todayAlerts.filter(a => a.severity === 'LOW').length;

    // Mock data for demonstration (in production, fetch from database)
    const dashboardData = {
      activeTourists: Math.floor(Math.random() * 500) + 200, // 200-700 tourists
      alertsToday: todayAlerts.length,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      pendingIncidents: Math.floor(Math.random() * 20) + 5, // 5-25 incidents
      resolvedIncidents: Math.floor(Math.random() * 100) + 150, // 150-250 resolved
      safetyScore: Math.floor(Math.random() * 20) + 80, // 80-100%
      avgSafetyScore: Math.floor(Math.random() * 15) + 75, // 75-90%
      avgResponseTime: Math.floor(Math.random() * 10) + 8, // 8-18 minutes
      mostVisitedRegion: 'City Center',
      
      // Chart data for active tourists over time (last 6 months)
      activeTouristsChart: [
        Math.floor(Math.random() * 50) + 120, // Jan
        Math.floor(Math.random() * 50) + 140, // Feb
        Math.floor(Math.random() * 50) + 160, // Mar
        Math.floor(Math.random() * 50) + 200, // Apr
        Math.floor(Math.random() * 50) + 250, // May
        Math.floor(Math.random() * 50) + 280, // Jun
      ],
    };

    console.log('📊 Dashboard data requested:', {
      userId: req.user.userId,
      activeTourists: dashboardData.activeTourists,
      alertsToday: dashboardData.alertsToday,
      safetyScore: dashboardData.safetyScore,
    });

    res.json({
      success: true,
      data: dashboardData,
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching dashboard data',
    });
  }
});

/**
 * GET /api/dashboard/analytics
 * Get detailed analytics data
 */
router.get('/analytics', authenticateToken, (req, res) => {
  try {
    const { period = '7d' } = req.query; // 7d, 30d, 90d

    // Mock analytics data
    const analyticsData = {
      period,
      totalAlerts: storage.alerts.length,
      alertsByType: {
        PANIC_BUTTON: storage.alerts.filter(a => a.type === 'PANIC_BUTTON').length,
        GEOFENCE_VIOLATION: storage.alerts.filter(a => a.type === 'GEOFENCE_VIOLATION').length,
        AI_MONITORING: storage.alerts.filter(a => a.type === 'AI_MONITORING').length,
      },
      alertsBySeverity: {
        HIGH: storage.alerts.filter(a => a.severity === 'HIGH').length,
        MEDIUM: storage.alerts.filter(a => a.severity === 'MEDIUM').length,
        LOW: storage.alerts.filter(a => a.severity === 'LOW').length,
      },
      responseTimeStats: {
        average: 12.5, // minutes
        median: 10.2,
        fastest: 4.1,
        slowest: 28.7,
      },
      topIncidentAreas: [
        { name: 'Downtown Market', incidents: 15, riskLevel: 'MEDIUM' },
        { name: 'Old Town Square', incidents: 8, riskLevel: 'LOW' },
        { name: 'Train Station Area', incidents: 22, riskLevel: 'HIGH' },
        { name: 'Tourist District', incidents: 5, riskLevel: 'LOW' },
        { name: 'Port Area', incidents: 12, riskLevel: 'MEDIUM' },
      ],
    };

    res.json({
      success: true,
      data: analyticsData,
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching analytics data',
    });
  }
});

module.exports = router;