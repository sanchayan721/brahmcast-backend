const User = require('../model/User');

const {
    httpErrorCodes,
    httpSuccessCodes
} = require('../utils/httpStatusCodes');

const {
    createOrganization,
    addAdmin
} = require('../utils/organizationOperator');

const {
    checkSentInBody,
    checkValidation,
    checkDuplicates,
    BodyCheck,
    DuplicateCheck,
    CheckValidation
} = require('../utils/checks');
const OtpHandler = require('../utils/OtpHandler');
const ErrorSender = require('../utils/ErrorSender');


/* const handleNewUser = async (req, res) => {

    try {

        // Checking Required Fields in body
        await checkSentInBody.username(req);
        await checkSentInBody.email(req);
        await checkSentInBody.fullName(req);
        await checkSentInBody.password(req);
        await checkSentInBody.termsAndConditions(req);

        // checking Validity
        await checkValidation.validatePasswordStrength(req);
        await checkValidation.validateEmail(req);
        await checkValidation.validateMobile(req);

        // Checking Duplocates
        await checkDuplicates.username(req);
        await checkDuplicates.email(req);
        await checkDuplicates.mobile(req);

        const {

            username,
            email: { emailId },
            mobile: { mobileNo },
            password,
            otp_verification,
            fullName,
            dob,
            gender,
            account_type,
            organizationDetails

        } = req.body;


        // Creating the Organization
        const createdOrganization = await createOrganization(
            account_type,
            organizationDetails
        );

        // Creating the user
        const createdUser = await User.create({
            username,
            email: { emailId: emailId },
            mobile: { mobileNo: mobileNo },
            fullName,
            gender,
            dob,
            password,
            org: { [account_type]: createdOrganization._id }
        });

        // Update the Organization setting user as admin
        await addAdmin(
            account_type,
            createdOrganization._id,
            createdUser._id
        );

        // Populating the Userdetails to send it to the Client
        const newUser = await User.findOne({
            _id: createdUser._id
        })
            .populate(`org.${account_type}`)
            .exec();

        res.status(httpSuccessCodes.CREATED).json(newUser);
    }

    catch (error) {
        console.log(error)
        switch (error?.name) {

            case 'ValidationError':
                let { path, message } = Object.values(error?.errors)[0]?.properties;
                res.status(httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE).json({
                    'property': path,
                    'errorMessage': message
                });
                break;

            case 'ApplicationError':
                res.status(
                    error?.httpStatus || httpErrorCodes.serverError.INTERNAL_SERVER_ERROR
                ).json({ ...error?.cause });
                break;

            default:
                res.sendStatus(httpErrorCodes.serverError.INTERNAL_SERVER_ERROR);
                break;
        };
    }
}; */

const validateLoginInfo = async (req, res) => {
    try {

        console.log(req.body)

        // Checking Required Fields in body
        const bodyCheck = new BodyCheck(req);
        await Promise.all([
            bodyCheck.usernameCheck(),
            bodyCheck.emailCheck(),
            bodyCheck.passwordCheck()
        ]);

        // Checking Duplocates
        const duplicateCheck = new DuplicateCheck(req);
        await Promise.all([
            duplicateCheck.usernameCheck(),
            duplicateCheck.emailCheck(),
            duplicateCheck.mobileCheck()
        ]);

        // Validating InputInformations
        const checkValidation = new CheckValidation(req);
        await Promise.all([
            checkValidation.validateEmail(),
            checkValidation.validatePasswordStrength(),
            checkValidation.validateMobile()
        ]);

        // Validating OTP
        const otpHandler = new OtpHandler(req, res);
        await otpHandler.handleOTPGeneration();

    } catch (error) {
        const loginInfoError = new ErrorSender(error, res);
        loginInfoError.sendError();
    }
};

const resendOTP = async (req, res) => {

    try {

        const otpHandler = new OtpHandler(req, res);
        await otpHandler.handleOTPReGeneration();

    } catch (error) {

        const resendOTPError = new ErrorSender(error, res);
        resendOTPError.sendError();
    }

}

const validateOTP = async (req, res) => {

    try {
        
        const otpHandler = new OtpHandler(req, res);
        await otpHandler.handleOTPVerification();

    } catch (error) {

        const validateOTPError = new ErrorSender(error, res);
        validateOTPError.sendError();
    }
}

module.exports = {
    /* handleNewUser, */
    validateLoginInfo,
    resendOTP,
    validateOTP
};