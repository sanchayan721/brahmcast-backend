
const ORGANIZATION_TYPES = require('../config/organizationTypes');
const { createNewCreator } = require('../controllers/creatorController');
const { createNewProjectOwner } = require('../controllers/projectOwnerController');
const { createNewStudio } = require('../controllers/studioController');
const ApplicationError = require('./ApplicationError');
const { httpErrorCodes } = require('./httpErrorCodes');

const createOrganization = async (account_type, organizationDetails) => {

    switch (account_type) {

        case ORGANIZATION_TYPES.Creator:
            return await createNewCreator(organizationDetails);

        case ORGANIZATION_TYPES.Studio:
            return await createNewStudio(organizationDetails);

        case ORGANIZATION_TYPES.ProjectOwner:
            return createNewProjectOwner(organizationDetails);

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

module.exports = createOrganization;