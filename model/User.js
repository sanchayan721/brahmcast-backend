const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ROLES_LIST = require('../config/roles_list');
const ORGANIZATION_TYPES = require('../config/organizationTypes');
const regexValidation = require('../utils/regexValidation');

const MINUTES_TO_MIL_SECONDS = 60 * 1000;

const emailModelSchema = new Schema({
    emailId: {
        type: String,
        required: [true, "Please provide a email"],
        unique: true,
        lowercase: true,
        match: [
            regexValidation.email.emailId,
            "Please enter a valid email address.",
        ],
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const mobileModelSchema = new Schema({
    extension: {
        type: String,
        required: [true, "Extension is required"],
    },
    mobileNo: {
        type: String,
        required: [true, "Mobile Number is required"],
        match: [
            regexValidation.mobile.mobileNo,
            "Mobile Number not valid."
        ],
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const relatedOrgModelSchema = new Schema({
    [ORGANIZATION_TYPES.Creator]: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Creator'
    }],
    [ORGANIZATION_TYPES.Studio]: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Studio'
    }],
    [ORGANIZATION_TYPES.ProjectOwner]: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectOwner'
    }]
}, { _id: false });

const userSchema = new Schema({
    __v: {
        type: Number,
        select: false
    },
    
    username: {
        type: String,
        required: [true, "Please Provide a username"],
        unique: true
    },

    email: {
        type: emailModelSchema,
        required: true
    },

    mobile: {
        type: mobileModelSchema
    },

    fullName: {
        type: String
    },

    gender: {
        Male: {
            type: Boolean
        },
        Female: {
            type: Boolean
        },
        Others: {
            type: Boolean
        }
    },

    org: {
        type: relatedOrgModelSchema
    },

    dob: {
        type: Date
    },

    password: {
        type: String,
        required: true,
        select: false                                           // Password field is not selected by default
    },

    refreshToken: String,

    resetPasswordToken: String,

    resetPasswordExpire: Date,
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPasswords = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + Number(process.env.PASSWORD_RESET_EXPIRE) * MINUTES_TO_MIL_SECONDS;

    return resetToken;
};

module.exports = mongoose.model('User', userSchema);