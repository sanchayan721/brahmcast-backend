const Creator = require('../model/Creator');
const ApplicationError = require('../utils/ApplicationError');
const { httpErrorCodes } = require('../utils/httpStatusCodes');

const checkDuplicates = async (details) => {
    const duplicate = await Creator.findOne({ handle: details.handle }).exec();

    if (duplicate) throw new ApplicationError("Duplicate Handle", httpErrorCodes.clientError.CONFLICT, {
        'property': 'handle',
        'errorMessage': 'Creator handle taken! Please try with a new one.'
    });
};

const createNewCreator = async (creatorDetails) => {
    await checkDuplicates(creatorDetails);
    const creatorAccount = await Creator.create({
        handle: creatorDetails?.handle,
        name: creatorDetails?.name
    });
    return creatorAccount;
};

const updateCreator = async ({ selector, action }) => {
    return await Creator.findOneAndUpdate(selector, action);
};

const handleNewCreator = async (req, res) => {
    const { handle, creatorName } = req.body;

    const duplicate = Creator.findOne({ handle }).exec();

    if (duplicate) return res.status(409).json({
        'message': {
            'property': 'handle',
            'errorMessage': 'Creator handle Already Exists.'
        }
    });

    const creator = await Creator.create({
        handle,
        creatorName
    }).exec();

    console.log(creator)

}

module.exports = { 
    createNewCreator,
    updateCreator,
    handleNewCreator
};