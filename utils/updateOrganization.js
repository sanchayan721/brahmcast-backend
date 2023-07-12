const Creator = require('../model/Creator');
const Studio = require('../model/Studio');
const ProductOwner = require('../model/ProjectOwner');
const ORGANIZATION_TYPES = require('../config/organizationTypes');
const ApplicationError = require('./ApplicationError');
const { httpErrorCodes } = require('./httpErrorCodes');

const checkDuplicates = async (account_type, schema, organizationDetails) => {
    const duplicate = await schema.findOne({ handle: organizationDetails.handle }).exec();

    if (duplicate) throw new ApplicationError("Duplicate Handle", httpErrorCodes.clientError.CONFLICT, {
        'property': 'handle',
        'errorMessage': `${account_type} handle taken! Please try with a new one.`
    });
};

const updateOrganization = async (org) => {

    switch (org.orgType) {

        case ORGANIZATION_TYPES.Creator:

            const creatorAccount = await Creator.findOneAndUpdate(
                {
                    _id: org.orgId
                },
                {
                    $set: { admin: org.admin },
                    $push: { handlers: org.admin }
                });
            return creatorAccount;


        case ORGANIZATION_TYPES.Studio:

            const studioAccount = await Studio.findOneAndUpdate(
                {
                    _id: org.orgId
                },
                {
                    $set: { admin: org.admin },
                    $push: { handlers: org.admin }
                });
            return studioAccount;


        case ORGANIZATION_TYPES.ProjectOwner:

            const projectOwnerAccount = await ProductOwner.findOneAndUpdate(
                {
                    _id: org.orgId
                },
                {
                    $set: { admin: org.admin },
                    $push: { handlers: org.admin }
                });
            return projectOwnerAccount;

        default:
            return;
    };

};

module.exports = updateOrganization;