const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['PANIC_BUTTON', 'GEOFENCE_VIOLATION', 'AI_MONITORING'], required: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
    message: { type: String, required: true },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
    },
    metadata: { type: Object, default: {} },
    status: { type: String, enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'], default: 'ACTIVE' },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Alert', alertSchema);
