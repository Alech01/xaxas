const path = require('path');

// Payment logos that get uploaded as application emojis (usable in any server)
const EMOJI_FILES = {
    zelle: 'zelle.png',
    paypal: 'paypal.png',
    transfer_mx: 'transfer_mx.png',
    wise: 'wise.png',
    cashapp: 'cashapp.png',
};

const cache = new Map();

/**
 * Uploads assets/*.png as application-owned emojis (once) and caches their markdown.
 * Application emojis work in every guild without needing emoji slots.
 */
async function syncEmojis(client) {
    if (!client.application || !client.application.emojis) {
        console.warn('[emojis] discord.js version does not support application emojis. Update discord.js (>=14.18).');
        return;
    }

    let existing;
    try {
        existing = await client.application.emojis.fetch();
    } catch (err) {
        console.error('[emojis] Could not fetch application emojis:', err.message);
        return;
    }

    for (const [name, file] of Object.entries(EMOJI_FILES)) {
        let emoji = existing.find(e => e.name === name);

        if (!emoji) {
            try {
                emoji = await client.application.emojis.create({
                    attachment: path.join(__dirname, '..', 'assets', file),
                    name,
                });
                console.log(`[emojis] Uploaded :${name}:`);
            } catch (err) {
                console.error(`[emojis] Failed to upload :${name}: -`, err.message);
                continue;
            }
        }

        cache.set(name, `<:${emoji.name}:${emoji.id}>`);
    }

    console.log(`[emojis] ${cache.size}/${Object.keys(EMOJI_FILES).length} payment logos ready.`);
}

function getEmoji(name) {
    return cache.get(name) || '';
}

module.exports = { syncEmojis, getEmoji, EMOJI_FILES };
