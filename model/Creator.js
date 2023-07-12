const mongoose = require('mongoose');
const regexValidation = require('../utils/regexValidation');
const Schema = mongoose.Schema;

const emailSchema = new Schema({
    emailId: {
        type: String,
        required: [true, "Please provide a email"],
        unique: true,
        lowercase: true,
        match: [
            regexValidation.email.emailId,
            "Please enter a valid email address.",
        ],
    }
});

const creatorSchema = new Schema({
    __v: {
        type: Number,
        select: false
    },

    handle: {
        type: String,
        required: [true, "Please Provide a username"],
        unique: true,
    },

    name: {
        type: String,
        required: [true, "Creator Name Required"],
    },

    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    handlers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],

    pendingInvitations: [{
        type: emailSchema
    }]
});

module.exports = mongoose.model('Creator', creatorSchema);