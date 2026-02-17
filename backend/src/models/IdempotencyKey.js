const mongoose = require('mongoose');

const idempotencyKeySchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        expense_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Expense',
            required: true,
        },
        status_code: {
            type: Number,
            required: true,
        },
        response: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        expires_at: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index — MongoDB auto-deletes expired docs
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
);

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);
