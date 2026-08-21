const {
    SlashCommandBuilder, EmbedBuilder, ModalBuilder,
    TextInputBuilder, TextInputStyle, ActionRowBuilder,
} = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const { getFooter, getBirdAttachment } = require('../utils/footer');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changelog')
        .setDescription('Post a changelog update (opens a form with multi-line support)'),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId('changelog_modal')
            .setTitle('New Changelog');

        const versionInput = new TextInputBuilder()
            .setCustomId('changelog_version')
            .setLabel('Version')
            .setPlaceholder('1.2.0')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(32);

        const titleInput = new TextInputBuilder()
            .setCustomId('changelog_title')
            .setLabel('Title (optional)')
            .setPlaceholder('Changelog')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(200);

        // Paragraph style => Shift+Enter / Enter creates real new lines
        const changesInput = new TextInputBuilder()
            .setCustomId('changelog_changes')
            .setLabel('Changes')
            .setPlaceholder('- Fixed X\n- Added Y\n- Improved Z')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4000);

        modal.addComponents(
            new ActionRowBuilder().addComponents(versionInput),
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(changesInput),
        );

        await interaction.showModal(modal);
    },

    async handleModal(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const version = interaction.fields.getTextInputValue('changelog_version');
        const title = interaction.fields.getTextInputValue('changelog_title') || 'Changelog';
        // Line breaks come through as-is; \n typed literally is also supported
        const changes = interaction.fields.getTextInputValue('changelog_changes').replace(/\\n/g, '\n');

        const embed = new EmbedBuilder()
            .setTitle(`${title} - v${version}`)
            .setDescription(changes)
            .setColor(config.DEFAULT_COLOR)
            .setFooter(getFooter())
            .setTimestamp();

        await interaction.reply({ content: 'Changelog posted.', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], files: [getBirdAttachment()] });
    },
};
