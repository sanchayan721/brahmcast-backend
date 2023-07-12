const { createNewCreator, updateCreator } = require('../controllers/creatorController');
const { createNewProjectOwner, updateProjectOwner } = require('../controllers/projectOwnerController');
const { createNewStudio, updateStudio } = require('../controllers/studioController');

const ORGANIZATION_TYPES = require('../config/organizationTypes');
const { httpErrorCodes } = require('./httpStatusCodes');
const ApplicationError = require('./ApplicationError');


const createOrganization = async (account_type, organizationDetails) => {

    switch (account_type) {

        case ORGANIZATION_TYPES.Creator:
            return await createNewCreator(organizationDetails);

        case ORGANIZATION_TYPES.Studio:
            return await createNewStudio(organizationDetails);

        case ORGANIZATION_TYPES.ProjectOwner:
            return await createNewProjectOwner(organizationDetails);

        default:
            throw new ApplicationError("Wrong Account Type",
                httpErrorCodes.clientError.ENTRY_NOT_ACCEPTABLE,
                {
                    property: 'account_type',
                    errorMessage: `${account_type} is not a valid Account Type`
                }
            );
    };

};

const addAdmin = async (account_type, orgId, userId) => {

    const query = {
        selector:
        {
            _id: orgId
        },

        action:
        {
            $set: { admin: userId },
            $push: { handlers: userId }
        }
    };

    switch (account_type) {

        case ORGANIZATION_TYPES.Creator:
            return await updateCreator(query);

        case ORGANIZATION_TYPES.Studio:
            return await updateStudio(query);

        case ORGANIZATION_TYPES.ProjectOwner:
            return await updateProjectOwner(query);

        default:
            return;
    };
};


module.exports = {
    createOrganization,
    addAdmin
};