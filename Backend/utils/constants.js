const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const EMERGENCY_LEVELS = ['low', 'medium', 'high', 'critical'];

const REQUEST_STATUS = {
    PENDING:   'pending',
    ACCEPTED:  'accepted',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

const RESPONSE_STATUS = {
    PENDING:  'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
};

const ROLES = {
    DONOR:    'donor',
    HOSPITAL: 'hospital',
};

// Blood compatibility map: donor blood group → can donate to
const BLOOD_COMPATIBILITY = {
    'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+':  ['O+', 'A+', 'B+', 'AB+'],
    'A-':  ['A-', 'A+', 'AB-', 'AB+'],
    'A+':  ['A+', 'AB+'],
    'B-':  ['B-', 'B+', 'AB-', 'AB+'],
    'B+':  ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'],
};

module.exports = {
    BLOOD_GROUPS,
    EMERGENCY_LEVELS,
    REQUEST_STATUS,
    RESPONSE_STATUS,
    ROLES,
    BLOOD_COMPATIBILITY,
};
