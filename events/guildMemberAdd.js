const { EmbedBuilder } = require('discord.js');
const { getFooter, getBirdAttachment } = require('../utils/footer');
const config = require('../config');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        // Auto-assign role
        try {
            const role = member.guild.roles.cache.get(config.AUTO_ROLE_ID);
            if (role) {
                await member.roles.add(role);
            }
        } catch (error) {
            console.error('Failed to assign auto-role:', error);
        }

        // Send welcome log
        const channel = client.channels.cache.get(config.WELCOME_CHANNEL);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle('Member Joined')
            .setDescription(`${member} has joined the server.`)
            .addFields(
                { name: 'User', value: `${member.user.tag}`, inline: true },
                { name: 'ID', value: member.user.id, inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setColor(config.DEFAULT_COLOR)
            .setFooter(getFooter())
            .setTimestamp();

        await channel.send({ embeds: [embed], files: [getBirdAttachment()] });
    },
};
