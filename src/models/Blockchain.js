const mongoose = require('mongoose');

const blockchainSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    blockchainId: { type: String, required: true, unique: true },
    userInfo: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
    },
    metadata: { type: Object, default: {} },
    transactionHash: { type: String, required: true },
    blockNumber: { type: Number, required: true },
    networkId: { type: Number, required: true },
    contractAddress: { type: String, required: true },
    tokenId: { type: Number, required: true },
    status: { type: String, enum: ['CONFIRMED', 'PENDING'], default: 'CONFIRMED' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Blockchain', blockchainSchema);
