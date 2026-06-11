const { BLOOD_COMPATIBILITY } = require('../utils/constants');

/**
 * Returns the list of donor blood groups that can donate to the requested group.
 * e.g. request is for 'A+' → compatible donors: ['O-', 'O+', 'A-', 'A+']
 */
const getCompatibleDonorGroups = (requestedGroup) => {
    const compatible = [];
    for (const [donorGroup, canDonateTo] of Object.entries(BLOOD_COMPATIBILITY)) {
        if (canDonateTo.includes(requestedGroup)) {
            compatible.push(donorGroup);
        }
    }
    return compatible;
};

/**
 * Returns blood groups that the given donor can donate to.
 */
const getCompatibleRecipientGroups = (donorGroup) => {
    return BLOOD_COMPATIBILITY[donorGroup] || [];
};

const isCompatible = (donorGroup, recipientGroup) => {
    return (BLOOD_COMPATIBILITY[donorGroup] || []).includes(recipientGroup);
};

module.exports = { getCompatibleDonorGroups, getCompatibleRecipientGroups, isCompatible };
