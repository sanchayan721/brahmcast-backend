const ProjectOwner = require('../model/ProjectOwner');
const ApplicationError = require('../utils/ApplicationError');
const { httpErrorCodes } = require('../utils/httpStatusCodes');

const checkDuplicates = async (details) => {
    const duplicate = await ProjectOwner.findOne({ handle: details.handle }).exec();

    if (duplicate) throw new ApplicationError("Duplicate Handle", httpErrorCodes.clientError.CONFLICT, {
        'property': 'handle',
        'errorMessage': 'Project Owner handle taken! Please try with a new one.'
    });
};

const createNewProjectOwner = async (projectOwnerDetails) => {
    await checkDuplicates(projectOwnerDetails);
    const projectOwnerAccount = await ProjectOwner.create({
        handle: projectOwnerDetails?.handle,
        name: projectOwnerDetails?.name
    });
    return projectOwnerAccount;
};

const updateProjectOwner = async ({ selector, action }) => {
    return await ProjectOwner.findOneAndUpdate(selector, action);
};

const handleNewProjectOwner = async (req, res) => {
    const { handle, projectOwnerName } = req.body;

    const duplicate = ProjectOwner.findOne({ handle }).exec();

    if (duplicate) return res.status(409).json({
        'message': {
            'property': 'handle',
            'errorMessage': 'Project Owner handle already exists.'
        }
    });

    const projectOwner = await ProjectOwner.create({
        handle,
        projectOwnerName
    }).exec();

    console.log(projectOwner)

}

module.exports = { 
    createNewProjectOwner,
    updateProjectOwner, 
    handleNewProjectOwner 
};