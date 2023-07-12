const User = require("../model/User");
const ApplicationError = require("./ApplicationError");
const { httpErrorCodes } = require("./httpStatusCodes");
const regexValidation = require("./regexValidation");

class BodyCheck {

    #req;
    #username;
    #email;
    #fullName;
    #password;
    #mobile;
    #accept_tc;
    #otp_verification;
    #otpType;

    constructor(req) {
        this.#req = req;
        this.#username = req.body?.username;
        this.#email = req.body?.email;
        this.#fullName = req.body?.fullName;
        this.#password = req.body?.password;
        this.#mobile = req.body?.mobile;
        this.#accept_tc = req.body?.accept_tc;
        this.#otp_verification = req.body?.otp_verification;
        this.#otpType = req.body?.otpType;
    };

    async usernameCheck() {
        if (!this.#username) throw new ApplicationError("No Username", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
            'property': 'username',
            'errorMessage': 'Username is required.'
        });
    };

    async emailCheck() {
        if (!this.#email && !this.#email.emailId) throw new ApplicationError("No Email", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
            'property': 'email',
            'errorMessage': 'Email is required.'
        });
    };


    async passwordCheck() {
        if (!this.#password) throw new ApplicationError("No Password", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
            'property': 'password',
            'errorMessage': 'Password is required.'
        });
    };

    async fullNameCheck() {
        if (!this.#fullName) throw new ApplicationError("No Fullname", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
            'property': 'fullName',
            'errorMessage': 'We need your Full Name to register you.'
        });
    };

    async mobileCheck() {
        if (!this.#mobile && !this.#mobile?.extension) throw new ApplicationError("No Extension", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
            'property': 'mobile.extension',
            'errorMessage': 'Mobile Extension is required.'
        });

        if (!this.#mobile && !this.#mobile?.mobileNo) throw new ApplicationError("No Mobile Number", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
            'property': 'mobile.mobileNo',
            'errorMessage': 'Mobile Number is required.'
        });
    };

    async termsAndConditionsCheck() {
        if (!Object.keys(this.#req.body).includes("accept_tc") || !this.#accept_tc) throw new ApplicationError("No T&C", httpErrorCodes.clientError.LEGAL_REASONS, {
            'property': 'accept_tc',
            'errorMessage': 'Due to Legal Reasons we can not create account without T&C checked.'
        });
    };

    async verifyWithOTPCheck() {

        let toVerify = {
            verify_mobile: false,
            verify_email: false
        };

        if (!Object.keys(this.#req?.body).includes('otp_verification') || !this.#otp_verification) return toVerify;
        if (Object.keys(this.#req.body).includes('email') && this.#email?.emailId) toVerify.verify_email = true;
        if (Object.keys(this.#req.body).includes('mobile') && this.#mobile?.mobileNo) toVerify.verify_mobile = true;

        return toVerify;
    };

    async otpTypeCheck() {
        if (!this.#otpType) throw new ApplicationError("No otpType", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
            'property': 'otpType',
            'errorMessage': 'OTP Type not sent.'
        });

        return this.#otpType;
    };

    async confirmOTPTypes() {
        console.log(this.#req.body)
    }
}

class DuplicateCheck {

    #req;
    #username;
    #email;
    #mobile;

    constructor(req) {
        this.#req = req;
        this.#username = req.body?.username;
        this.#email = req.body?.email;
        this.#mobile = req.body?.mobile;
    };

    async usernameCheck() {
        const duplicateUsername = await User.findOne({ username: this.#username }).exec();

        if (duplicateUsername) throw new ApplicationError("Duplicate Username", httpErrorCodes.clientError.CONFLICT, {
            'property': 'username',
            'errorMessage': 'Username already taken! Please try with a new one.'
        });
    };

    async emailCheck() {

        const duplicateEmail = await User.findOne({ 'email.emailId': this.#email?.emailId }).exec();
        if (duplicateEmail) throw new ApplicationError("Duplicate Email", httpErrorCodes.clientError.CONFLICT, {
            'property': 'email.emailId',
            'errorMessage': 'You already have an account! Please log in.'
        });
    };

    async mobileCheck() {

        const duplicateMobile = await User.findOne({ 'mobile.mobileNo': this.#mobile?.mobileNo, 'mobile.extension': this.#mobile?.extension }).exec();

        if (duplicateMobile) throw new ApplicationError("Duplicate Mobile No", httpErrorCodes.clientError.CONFLICT, {
            'property': 'mobile',
            'errorMessage': 'This Mobile Number is alredy linked to another Account.'
        });
    }
};

class CheckValidation {

    #req;
    #password;
    #email;
    #mobile;
    #passwordMatchRegEx = regexValidation.password;
    #emailMatchRegEx = regexValidation.email;
    #mobileMatchRegEx = regexValidation.mobile;

    constructor(req) {
        this.#req = req;
        this.#password = req.body?.password;
        this.#email = req.body?.email;
        this.#mobile = req.body?.mobile;
    }

    async validatePasswordStrength() {

        if (!this.#passwordMatchRegEx.test(this.#password))
            throw new ApplicationError("Weak Password", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
                'property': 'password',
                'errorMessage': 'Make sure password is 8 Characters long. Atleast 1 Uppercase, 1 Special character, 1 Digit and 2 Lowercase characters.'
            });
    };

    async validateEmail() {
        if (!this.#emailMatchRegEx.emailId.test(this.#email?.emailId))
            throw new ApplicationError("Not an Email", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
                'property': 'email',
                'errorMessage': 'Not a valid email address.'
            });
    };

    async validateMobile() {
        if (!Object.keys(this.#req.body).includes('mobile') && !Object.keys(this.#req.body?.mobile).includes('mobileNo')) return;
        if (!this.#mobileMatchRegEx.mobileNo.test(this.#mobile.mobileNo))
            throw new ApplicationError("Invalid Mobile Number", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
                'property': 'mobile.mobileNo',
                'errorMessage': 'Not a valid mobile number.'
            });
    }
};

module.exports = {
    BodyCheck,
    DuplicateCheck,
    CheckValidation
};