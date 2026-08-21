const fs = require('fs');
const path = require('path');
const { dataFile } = require('./paths');

const COUNTER_FILE = dataFile('counter.json');

function read() {
    try {
        if (!fs.existsSync(COUNTER_FILE)) return { ticket: 0 };
        return JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf-8'));
    } catch (err) {
        return { ticket: 0 };
    }
}

function write(data) {
    fs.mkdirSync(path.dirname(COUNTER_FILE), { recursive: true });
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 2));
}

/** Returns the next ticket number as a zero-padded string: 0001, 0002, ... */
function nextTicketNumber() {
    const data = read();
    data.ticket = (data.ticket || 0) + 1;
    write(data);
    return String(data.ticket).padStart(4, '0');
}

module.exports = { nextTicketNumber, read, write };
