const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage, client) {
        if (!newMessage.guild) return;
        if (newMessage.author && newMessage.author.bot) return;
        if (oldMessage.partial || newMessage.partial) return;
        if (oldMessage.content === newMessage.content) return;

        const modChannel = client.channels.cache.get(config.MOD_LOG_CHANNEL);
        if (!modChannel) return;

        const embed = new EmbedBuilder()
            .setTitle('Message Edited')
            .addFields(
                { name: 'Author', value: newMessage.author ? `${newMessage.author.tag} (${newMessage.author.id})` : 'Unknown', inline: true },
                { name: 'Channel', value: `${newMessage.channel}`, inline: true },
                { name: 'Before', value: oldMessage.content ? oldMessage.content.substring(0, 1024) : 'No text content' },
                { name: 'After', value: newMessage.content ? newMessage.content.substring(0, 1024) : 'No text content' }
            )
            .setColor(config.DEFAULT_COLOR)
            .setTimestamp();

        await modChannel.send({ embeds: [embed] }).catch(() => {});
    },
};
