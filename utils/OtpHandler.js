const OTPGenerator = require("../helpers/OTPGenerator");
const { BodyCheck } = require("./checks");
const { httpSuccessCodes, httpErrorCodes } = require("./httpStatusCodes");
const redisClient = require('../config/redis');
const ApplicationError = require("./ApplicationError");

class OtpHandler {

    #req;
    #res;
    #username;
    #email;
    #mobile;
    #bodyCheck;
    #OTP_TYPES = { mobile: 'mobile', email: 'email' };
    #reqVerify;
    #MINUTES_IN_SECONDS = 60;
    #otpGenerator = new OTPGenerator(6);
    #email_otp;
    #mobile_otp;
    #resData;

    constructor(req, res) {
        this.#req = req;
        const { email_otp, mobile_otp, ...resData } = req.body;
        this.#res = res;
        this.#resData = resData;

        this.#username = req.body?.username;
        this.#email = req.body?.email;
        this.#mobile = req.body?.mobile;

        this.#reqVerify = req.body?.verify;
        this.#email_otp = req.body?.email_otp;
        this.#mobile_otp = req.body?.mobile_otp;

        this.#bodyCheck = new BodyCheck(req);
    }

    async handleOTPGeneration() {
        const toVerify = await this.#bodyCheck.verifyWithOTPCheck();

        /* Skip Verification */
        if (!toVerify.verify_email && !toVerify.verify_mobile) {

            this.#res.status(httpSuccessCodes.ACCPEPTED).json({
                ...this.#req.body,
                verify: {
                    mobile: false,
                    email: false
                }
            });

        }

        /* Only Verify Email */
        else if (toVerify.verify_email && !toVerify.verify_mobile) {

            let eOTP = this.#otpGenerator.generateOTP();
            await this.#saveOTPtoCache(eOTP, this.#OTP_TYPES.email);

            this.#res.status(httpSuccessCodes.ACCPEPTED).json({
                ...this.#req.body,
                verify: {
                    email: true,
                    mobile: false
                }
            });

        }

        /* Only Verify Mobile */
        else if (!toVerify.verify_email && toVerify.verify_mobile) {

            let mOTP = this.#otpGenerator.generateOTP();
            await this.#saveOTPtoCache(mOTP, this.#OTP_TYPES.mobile);

            this.#res.status(httpSuccessCodes.ACCPEPTED).json({
                ...this.#req.body,
                verify: {
                    email: false,
                    mobile: true
                }
            });

        }

        /* Verify Both Email and Mobile */
        else {

            let eOTP = this.#otpGenerator.generateOTP();
            let mOTP = this.#otpGenerator.generateOTP();

            await Promise.all([
                this.#saveOTPtoCache(eOTP, this.#OTP_TYPES.email),
                this.#saveOTPtoCache(mOTP, this.#OTP_TYPES.mobile)
            ]);

            this.#res.status(httpSuccessCodes.ACCPEPTED).json({
                ...this.#req.body,
                verify: {
                    email: true,
                    mobile: true
                }
            });
        }
    }

    async handleOTPReGeneration() {

        const otpType = await this.#bodyCheck.otpTypeCheck();

        console.log(otpType)

        if (!Object.keys(this.#OTP_TYPES).includes(otpType)) throw new ApplicationError("Wrong OTP Type", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
            'property': 'otpType',
            'errorMessage': 'Wrong OTP Type! Please check the OTP type.'
        })

        else {
            let newOTP = this.#otpGenerator.generateOTP();
            await this.#saveOTPtoCache(newOTP, otpType);
        }

    }

    async #saveOTPtoCache(otp, otpType) {

        const key = `${this.#username}+${otpType}`;
        const [result] = await redisClient.multi().GET(key).exec();

        if (!result) {
            await redisClient
                .multi()
                .SET(key, JSON.stringify({ otps: [otp], attempt: 0 }))
                .EXPIRE(key, Number(process.env.OTP_EXPIRE) * this.#MINUTES_IN_SECONDS)
                .exec();
        }

        else {

            const oldRequest = JSON.parse(result);

            if (oldRequest?.attempt >= Number(process.env.MAX_OTP_REQUESTS)) throw new ApplicationError("Too Many Requests.", httpErrorCodes.clientError.TOO_MANY_REQUESTS, {
                'property': `otpType.${otpType}`,
                'errorMessage': `Can not send more verification request! Please try after ${process.env.OTP_EXPIRE} minutes.`
            });

            await redisClient
                .multi()
                .SET(key, JSON.stringify({ otps: [...oldRequest?.otps, otp], attempt: oldRequest?.attempt + 1 }))
                .EXPIRE(key, Number(process.env.OTP_EXPIRE) * this.#MINUTES_IN_SECONDS)
                .exec();
        }

    };

    async handleOTPVerification() {

        if (this.#reqVerify?.email && this.#reqVerify?.mobile) {

            const [email_verified, mobile_verified] = await Promise.all([
                this.#otpVerification(this.#email_otp, this.#OTP_TYPES.email),
                this.#otpVerification(this.#mobile_otp, this.#OTP_TYPES.mobile)
            ]);

            // Email OTP
            if (!email_verified) throw new ApplicationError("Wrong Email OTP", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
                property: 'email_otp',
                errorMessage: 'Incorrect OTP! Please Retry.'
            });

            await this.#saveVerifiedToCache({ email: { ...this.#email, verified: true } });


            // Mobile OTP
            if (!mobile_verified) throw new ApplicationError("Wrong Mobile OTP", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
                property: 'mobile_otp',
                errorMessage: 'Incorrect OTP! Please Retry.'
            });

            await this.#saveVerifiedToCache({ mobile: { ...this.#mobile, verified: true } });

            this.#res.status(httpSuccessCodes.ACCPEPTED).json({
                ...this.#resData,
                email: { ...this.#email, verified: true },
                mobile: { ...this.#mobile, verified: true }
            })

        }

        else if (this.#reqVerify?.email && !this.#reqVerify?.email) {

            const email_verified = await this.#otpVerification(this.#email_otp, this.#OTP_TYPES.email);

            if (!email_verified) new ApplicationError("Wrong Email OTP", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
                property: 'email_otp',
                errorMessage: 'Incorrect OTP! Please Retry.'
            });

            this.#res.status(httpSuccessCodes.ACCPEPTED).json({
                ...this.#resData,
                email: { ...this.#email, verified: true },
            });
        }

        else if (!this.#reqVerify?.email && this.#reqVerify?.email) {

            const mobile_verified = await this.#otpVerification(this.#mobile_otp, this.#OTP_TYPES.mobile);

            if (!mobile_verified) new ApplicationError("Wrong Mobile OTP", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
                property: 'mobile_otp',
                errorMessage: 'Incorrect OTP! Please Retry.'
            });

            this.#res.status(httpSuccessCodes.ACCPEPTED).json({
                ...this.#resData,
                mobile: { ...this.#mobile, verified: true },
            });
        }

        else {
            throw new ApplicationError('Route Not Allowed', httpErrorCodes.clientError.ACCESS_FORBIDDEN, {
                'property': 'otp_verification',
                'errorMessage': 'OTP Verification Not Available! OTP type not Selected.'
            })
        }

    }

    async #otpVerification(otp, otpType) {
        const key = `${this.#username}+${otpType}`;
        const [result] = await redisClient.multi().GET(key).exec();

        if (!result) throw new ApplicationError("OTP Expired", httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE, {
            'property': `${otpType}_otp`,
            'errorMessage': `This OTP has expired! Please try again.`
        });

        const { otps } = JSON.parse(result);

        if (otps.includes(Number(otp))) {
            return true;
        }

        else {
            return false;
        }
    }

    async #saveVerifiedToCache(toSave) {

        const key = `${this.#username}+verified`;
        const [duplicate] = await redisClient.multi().GET(key).exec();

        if (!duplicate) {
            await redisClient
                .multi()
                .SET(key, JSON.stringify({ ...toSave }))
                .exec();
        }

        else {

            const previouslyVerified = JSON.parse(duplicate);

            await redisClient
                .multi()
                .SET(key, JSON.stringify({ ...toSave, ...previouslyVerified }))
                .exec();
        }
    }
}

module.exports = OtpHandler;