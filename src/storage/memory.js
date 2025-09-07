/**
 * In-memory storage for demo purposes
 * In production, replace with your database (MongoDB, PostgreSQL, etc.)
 */

const storage = {
  // Users storage
  users: [
    // Example user for testing
    {
      id: 'demo-user-123',
      name: 'Demo User',
      email: 'demo@example.com',
      phone: '+1234567890',
      password: '$2b$12$example.hash.for.demo.purposes.only', // bcrypt hash of 'password'
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],

  // Alerts storage
  alerts: [
    // Example alerts
    {
      id: 'alert-demo-1',
      userId: 'demo-user-123',
      type: 'AI_MONITORING',
      severity: 'MEDIUM',
      message: 'Inactivity detected for 15 minutes in downtown area',
      location: { latitude: 40.7128, longitude: -74.0060 },
      metadata: { alertType: 'INACTIVITY', duration: 900000 },
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      status: 'ACTIVE',
    },
    {
      id: 'alert-demo-2',
      userId: 'demo-user-123',
      type: 'GEOFENCE_VIOLATION',
      severity: 'HIGH',
      message: 'Entered restricted area: Construction Zone Alpha',
      location: { latitude: 40.7589, longitude: -73.9851 },
      metadata: { geofenceId: 'geo-123', geofenceName: 'Construction Zone Alpha', distance: 50 },
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      status: 'ACKNOWLEDGED',
    },
  ],

  // Blockchain issuances storage
  blockchainIssuances: [
    // Example blockchain issuance
    {
      id: 'blockchain-demo-1',
      userId: 'demo-user-123',
      blockchainId: 'TSM-A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
      userInfo: {
        name: 'Demo User',
        email: 'demo@example.com',
        phone: '+1234567890',
      },
      metadata: {
        issuedAt: '2024-01-15T10:30:00.000Z',
        version: '1.0',
      },
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
      blockNumber: 18567890,
      networkId: 137,
      contractAddress: '0x1234567890123456789012345678901234567890',
      tokenId: 1,
      status: 'CONFIRMED',
      createdAt: '2024-01-15T10:30:00.000Z',
    },
  ],
};

/**
 * Helper functions for data manipulation
 */

// Get user by ID (excluding password)
function getUserById(userId) {
  const user = storage.users.find(u => u.id === userId);
  if (!user) return null;
  
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Get user alerts with filtering and sorting
function getUserAlerts(userId, options = {}) {
  const { severity, status, limit = 50 } = options;
  
  let alerts = storage.alerts
    .filter(alert => alert.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (severity) {
    alerts = alerts.filter(alert => alert.severity === severity);
  }

  if (status) {
    alerts = alerts.filter(alert => alert.status === status);
  }

  return alerts.slice(0, limit);
}

// Get blockchain issuances for user
function getUserBlockchainIssuances(userId) {
  return storage.blockchainIssuances
    .filter(issuance => issuance.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Export storage and helper functions
module.exports = {
  ...storage,
  getUserById,
  getUserAlerts,
  getUserBlockchainIssuances,
};