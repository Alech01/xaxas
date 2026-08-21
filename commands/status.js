const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const { getFooter, getBirdAttachment } = require('../utils/footer');
const config = require('../config');

const statusOptions = {
    working: {
        title: 'WORKING',
        description: 'The bypass is currently operational and functioning as expected. All features are active and ready to use.',
        color: 0x2ECC71, // green
    },
    update: {
        title: 'UPDATE',
        description: 'The bypass is currently being updated with new improvements or patches. Service may be temporarily unavailable during this process.',
        color: 0xF1C40F, // yellow
    },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Set and display the current bypass status'),

    statusOptions,

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('status_select')
            .setPlaceholder('Select the current status')
            .addOptions([
                { label: 'Working', value: 'working', description: 'Bypass is operational' },
                { label: 'Update', value: 'update', description: 'Bypass is being updated' },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ content: 'Select the current status:', components: [row], ephemeral: true });
    },

    async handleStatusSelect(interaction) {
        const info = statusOptions[interaction.values[0]];
        if (!info) {
            return interaction.update({ content: 'Unknown status.', components: [] });
        }

        const embed = new EmbedBuilder()
            .setTitle(info.title)
            .setDescription(info.description)
            .setColor(info.color)
            .setFooter(getFooter())
            .setTimestamp();

        await interaction.update({ content: 'Status updated.', components: [] });
        await interaction.channel.send({ embeds: [embed], files: [getBirdAttachment()] });
    },
};
