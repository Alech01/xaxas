const fs = require('fs');
const path = require('path');

// On Railway the container filesystem is wiped on every redeploy.
// Mount a Volume and set DATA_DIR to its mount path (e.g. /data)
// so tickets and the ticket counter survive deploys.
const DATA_DIR = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(__dirname, '..', 'data');

fs.mkdirSync(DATA_DIR, { recursive: true });

function dataFile(name) {
    return path.join(DATA_DIR, name);
}

module.exports = { DATA_DIR, dataFile };
