const Studio = require('../model/Studio');
const ApplicationError = require('../utils/ApplicationError');
const { httpErrorCodes } = require('../utils/httpStatusCodes');

const checkDuplicates = async (details) => {
    const duplicate = await Studio.findOne({ handle: details.handle }).exec();

    if (duplicate) throw new ApplicationError("Duplicate Handle", httpErrorCodes.clientError.CONFLICT, {
        'property': 'handle',
        'errorMessage': 'Studio handle taken! Please try with a new one.'
    });
};

const createNewStudio = async (studioDetails) => {
    await checkDuplicates(studioDetails);
    const studioAccount = await Studio.create({
        handle: studioDetails?.handle,
        name: studioDetails?.name
    });
    return studioAccount;
};

const updateStudio = async ({ selector, action }) => {
    return await Studio.findOneAndUpdate(selector, action);
};

const handleNewStudio = async (req, res) => {
    const { handle, name } = req.body;

    let duplicate;
    let studio;

    try {
        duplicate = await Studio.findOne({ handle }).exec();
    } catch (error) {
        console.log(error);
        res.status(500).json({
            'message': {
                'property': 'server',
                'errorMessage': 'Fetching Failed, please try again later.'
            }
        })
    }

    if (duplicate) return res.status(409).json({
        'message': {
            'property': 'handle',
            'errorMessage': 'Studio handle already exists.'
        }
    })

    else {
        studio = await Studio.create({ handle, name });
    }

    console.log(studio)
}

module.exports = {
    createNewStudio,
    updateStudio,
    handleNewStudio
};