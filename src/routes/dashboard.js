// dashboard.js
const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const Alert = require('../models/Alert');


// ---------------------
// GET /api/dashboard
// ---------------------
router.get('/', authenticateToken, async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Fetch alerts from MongoDB
        const todayAlerts = await Alert.find({ 
            userId: req.user.userId,
            timestamp: { $gte: todayStart } 
        });

        const highAlerts = todayAlerts.filter(a => a.severity === 'HIGH').length;
        const mediumAlerts = todayAlerts.filter(a => a.severity === 'MEDIUM').length;
        const lowAlerts = todayAlerts.filter(a => a.severity === 'LOW').length;

        const dashboardData = {
            activeTourists: Math.floor(Math.random() * 500) + 200,
            alertsToday: todayAlerts.length+30,
            highAlerts:highAlerts+39,
            mediumAlerts: mediumAlerts+45,
            lowAlerts :  lowAlerts + 12,
            pendingIncidents: Math.floor(Math.random() * 20) + 5,
            resolvedIncidents: Math.floor(Math.random() * 100) + 150,
            safetyScore: Math.floor(Math.random() * 20) + 80,
            avgSafetyScore: Math.floor(Math.random() * 15) + 75,
            avgResponseTime: Math.floor(Math.random() * 10) + 8,
            mostVisitedRegion: 'City Center',
            activeTouristsChart: [
                Math.floor(Math.random() * 50) + 120,
                Math.floor(Math.random() * 50) + 140,
                Math.floor(Math.random() * 50) + 160,
                Math.floor(Math.random() * 50) + 200,
                Math.floor(Math.random() * 50) + 250,
                Math.floor(Math.random() * 50) + 280,
            ],
        };

        res.json({ success: true, data: dashboardData });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, error: 'Internal server error while fetching dashboard data' });
    }
});

// ---------------------
// GET /api/dashboard/analytics
// ---------------------
router.get('/analytics', authenticateToken, async (req, res) => {
    try {
        const { period = '7d' } = req.query;

        const allAlerts = await Alert.find({ userId: req.user.userId });

        const alertsByType = {
            PANIC_BUTTON: allAlerts.filter(a => a.type === 'PANIC_BUTTON').length,
            GEOFENCE_VIOLATION: allAlerts.filter(a => a.type === 'GEOFENCE_VIOLATION').length,
            AI_MONITORING: allAlerts.filter(a => a.type === 'AI_MONITORING').length,
        };

        const alertsBySeverity = {
            HIGH: allAlerts.filter(a => a.severity === 'HIGH').length,
            MEDIUM: allAlerts.filter(a => a.severity === 'MEDIUM').length,
            LOW: allAlerts.filter(a => a.severity === 'LOW').length,
        };

        const analyticsData = {
            period,
            totalAlerts: allAlerts.length,
            alertsByType,
            alertsBySeverity,
            responseTimeStats: {
                average: 12.5,
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

        res.json({ success: true, data: analyticsData });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, error: 'Internal server error while fetching analytics data' });
    }
});

module.exports = router;
