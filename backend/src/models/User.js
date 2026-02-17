const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required.'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email.'],
        },
        password_hash: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Index
userSchema.index({ email: 1 }, { unique: true });

/**
 * Hash password before saving (only if modified).
 */
userSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash')) return next();
    this.password_hash = await bcrypt.hash(this.password_hash, SALT_ROUNDS);
    next();
});

/**
 * Compare a plaintext password against the stored hash.
 */
userSchema.methods.comparePassword = async function (plaintext) {
    return bcrypt.compare(plaintext, this.password_hash);
};

/**
 * Strip password_hash from JSON output.
 */
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password_hash;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
