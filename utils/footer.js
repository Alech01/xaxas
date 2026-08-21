const { AttachmentBuilder } = require('discord.js');
const path = require('path');

function getFooter() {
    return { text: 'By Lost', iconURL: 'attachment://bird.png' };
}

function getBirdAttachment() {
    return new AttachmentBuilder(
        path.join(__dirname, '..', 'assets', 'bird.png'),
        { name: 'bird.png' }
    );
}

function getLogoAttachment() {
    return new AttachmentBuilder(
        path.join(__dirname, '..', 'assets', 'lost_bypass_logo.png'),
        { name: 'lost_bypass_logo.png' }
    );
}

module.exports = { getFooter, getBirdAttachment, getLogoAttachment };
