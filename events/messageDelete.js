const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'messageDelete',
    async execute(message, client) {
        if (!message.guild) return;
        if (message.author && message.author.bot) return;
        if (message.partial) return;

        const modChannel = client.channels.cache.get(config.MOD_LOG_CHANNEL);
        if (!modChannel) return;

        const embed = new EmbedBuilder()
            .setTitle('Message Deleted')
            .addFields(
                { name: 'Author', value: message.author ? `${message.author.tag} (${message.author.id})` : 'Unknown', inline: true },
                { name: 'Channel', value: `${message.channel}`, inline: true },
                { name: 'Content', value: message.content ? message.content.substring(0, 1024) : 'No text content' }
            )
            .setColor(config.DEFAULT_COLOR)
            .setTimestamp();

        if (message.attachments.size > 0) {
            embed.addFields({
                name: 'Attachments',
                value: message.attachments.map(a => a.url).join('\n').substring(0, 1024),
            });
        }

        await modChannel.send({ embeds: [embed] }).catch(() => {});
    },
};
