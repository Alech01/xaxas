const config = require('../config');

function isAdmin(member) {
    if (!member || !member.roles) return false;
    return config.ADMIN_ROLES.some(roleId => member.roles.cache.has(roleId));
}

module.exports = { isAdmin };
