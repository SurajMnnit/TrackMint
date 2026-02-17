const mongoose = require('mongoose');

const ALLOWED_CATEGORIES = [
    'food',
    'transport',
    'entertainment',
    'utilities',
    'health',
    'shopping',
    'education',
    'rent',
    'other',
];

const expenseSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required.'],
            index: true,
        },
        amount_paise: {
            type: Number,
            required: [true, 'Amount is required.'],
            validate: {
                validator: (v) => Number.isInteger(v) && v > 0,
                message: 'Amount must be a positive integer (subunit).',
            },
        },
        category: {
            type: String,
            required: [true, 'Category is required.'],
            enum: {
                values: ALLOWED_CATEGORIES,
                message: 'Category must be one of: ' + ALLOWED_CATEGORIES.join(', '),
            },
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters.'],
        },
        date: {
            type: Date,
            required: [true, 'Date is required.'],
        },
        receipt_path: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Compound index for efficient user-scoped queries sorted by date
expenseSchema.index({ user_id: 1, date: -1 });
expenseSchema.index({ user_id: 1, category: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.ALLOWED_CATEGORIES = ALLOWED_CATEGORIES;
