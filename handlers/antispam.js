const { EmbedBuilder } = require('discord.js');
const config = require('../config');

const URL_REGEX = /(https?:\/\/[^\s]+)|(discord\.gg\/[^\s]+)|(www\.[^\s]+)/gi;
const messageTracker = new Map();

function hasAllowedRole(member) {
    if (!member || !member.roles) return false;
    return config.LINK_ALLOWED_ROLES.some(roleId => member.roles.cache.has(roleId));
}

async function checkMessage(message, client) {
    if (message.author.bot) return false;
    if (!message.guild) return false;
    if (!message.member) return false;

    const member = message.member;

    // Anti-link check
    if (URL_REGEX.test(message.content) && !hasAllowedRole(member)) {
        // Reset regex lastIndex
        URL_REGEX.lastIndex = 0;

        await message.delete().catch(() => {});

        // Log to mod channel
        const modChannel = client.channels.cache.get(config.MOD_LOG_CHANNEL);
        if (modChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('Link Removed')
                .addFields(
                    { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: 'Channel', value: `${message.channel}`, inline: true },
                    { name: 'Content', value: message.content.substring(0, 1024) }
                )
                .setColor(config.DEFAULT_COLOR)
                .setTimestamp();

            await modChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }

        // Notify user
        try {
            await message.author.send({
                content: 'You are not allowed to send links in this server.',
            });
        } catch (error) {
            // User has DMs disabled
        }

        return true;
    }

    // Reset regex lastIndex
    URL_REGEX.lastIndex = 0;

    // Anti-spam check (more than 5 messages in 5 seconds)
    const userId = message.author.id;
    const now = Date.now();

    if (!messageTracker.has(userId)) {
        messageTracker.set(userId, []);
    }

    const timestamps = messageTracker.get(userId);
    timestamps.push(now);

    // Keep only timestamps within the last 5 seconds
    const recent = timestamps.filter(t => now - t < 5000);
    messageTracker.set(userId, recent);

    if (recent.length > 5 && !hasAllowedRole(member)) {
        await message.delete().catch(() => {});

        // Log to mod channel
        const modChannel = client.channels.cache.get(config.MOD_LOG_CHANNEL);
        if (modChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('Spam Detected')
                .addFields(
                    { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: 'Channel', value: `${message.channel}`, inline: true },
                    { name: 'Messages in 5s', value: `${recent.length}`, inline: true }
                )
                .setColor(config.DEFAULT_COLOR)
                .setTimestamp();

            await modChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }

        // Timeout the user for 5 minutes
        try {
            await member.timeout(5 * 60 * 1000, 'Spam detected by auto-moderation');
        } catch (error) {
            console.error('Failed to timeout user:', error.message);
        }

        return true;
    }

    // Clean up old entries periodically
    if (messageTracker.size > 1000) {
        for (const [key, times] of messageTracker.entries()) {
            const filtered = times.filter(t => now - t < 10000);
            if (filtered.length === 0) {
                messageTracker.delete(key);
            } else {
                messageTracker.set(key, filtered);
            }
        }
    }

    return false;
}

module.exports = { checkMessage };
