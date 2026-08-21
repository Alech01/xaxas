const { EmbedBuilder } = require('discord.js');
const { getFooter, getBirdAttachment } = require('../utils/footer');
const config = require('../config');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        const channel = client.channels.cache.get(config.LEAVE_CHANNEL);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle('Member Left')
            .setDescription(`${member.user.tag} has left the server.`)
            .addFields(
                { name: 'User', value: `${member.user.tag}`, inline: true },
                { name: 'ID', value: member.user.id, inline: true },
                { name: 'Joined At', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
                { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setColor(config.DEFAULT_COLOR)
            .setFooter(getFooter())
            .setTimestamp();

        await channel.send({ embeds: [embed], files: [getBirdAttachment()] });
    },
};
