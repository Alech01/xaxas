const {
    SlashCommandBuilder, EmbedBuilder, ModalBuilder,
    TextInputBuilder, TextInputStyle, ActionRowBuilder,
} = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const { getFooter, getBirdAttachment } = require('../utils/footer');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Send a custom announcement embed (opens a form with multi-line support)'),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId('embed_modal')
            .setTitle('New Embed');

        const titleInput = new TextInputBuilder()
            .setCustomId('embed_title')
            .setLabel('Title (optional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(256);

        // Paragraph style => Shift+Enter creates real new lines
        const descriptionInput = new TextInputBuilder()
            .setCustomId('embed_description')
            .setLabel('Description')
            .setPlaceholder('Write here. Shift+Enter for a new line.\n**bold**  *italic*  __underline__')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4000);

        const colorInput = new TextInputBuilder()
            .setCustomId('embed_color')
            .setLabel('Color hex (optional, default grey)')
            .setPlaceholder('#808080')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(7);

        const imageInput = new TextInputBuilder()
            .setCustomId('embed_image')
            .setLabel('Image URL (optional)')
            .setPlaceholder('https://...')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(500);

        const footerInput = new TextInputBuilder()
            .setCustomId('embed_footer')
            .setLabel('Extra footer text (optional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(200);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(colorInput),
            new ActionRowBuilder().addComponents(imageInput),
            new ActionRowBuilder().addComponents(footerInput),
        );

        await interaction.showModal(modal);
    },

    async handleModal(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const title = interaction.fields.getTextInputValue('embed_title');
        const description = interaction.fields.getTextInputValue('embed_description').replace(/\\n/g, '\n');
        const rawColor = interaction.fields.getTextInputValue('embed_color');
        const imageUrl = interaction.fields.getTextInputValue('embed_image');
        const footerText = interaction.fields.getTextInputValue('embed_footer');

        let color = config.DEFAULT_COLOR;
        if (rawColor) {
            const parsed = parseInt(rawColor.replace('#', ''), 16);
            if (!Number.isNaN(parsed)) color = parsed;
        }

        const embed = new EmbedBuilder()
            .setDescription(description)
            .setColor(color)
            .setTimestamp();

        if (title) embed.setTitle(title);

        if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
            embed.setImage(imageUrl);
        }

        if (footerText) {
            embed.setFooter({ text: `${footerText} | By Lost`, iconURL: 'attachment://bird.png' });
        } else {
            embed.setFooter(getFooter());
        }

        await interaction.reply({ content: 'Embed sent.', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], files: [getBirdAttachment()] });
    },
};
