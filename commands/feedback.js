const {
    SlashCommandBuilder, AttachmentBuilder, MessageFlags,
    ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder,
    MediaGalleryItemBuilder, FileBuilder, EmbedBuilder,
} = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const { getFooter, getBirdAttachment } = require('../utils/footer');
const config = require('../config');

const AUTO_TITLE = 'Feedback Lost Bypass';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('feedback')
        .setDescription('Post a customer feedback')
        .addStringOption(option =>
            option.setName('subtitle')
                .setDescription('Subtitle shown under the main title')
                .setRequired(true)
                .setMaxLength(200))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Screenshot or clip of the feedback')
                .setRequired(true)),

    async execute(interaction) {
        if (config.FEEDBACK_ADMIN_ONLY && !isAdmin(interaction.member)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const subtitle = interaction.options.getString('subtitle');
        const media = interaction.options.getAttachment('image');

        // Re-upload the file so the post never breaks if the original is deleted
        const safeName = (media.name || 'feedback').replace(/[^a-zA-Z0-9._-]/g, '_');
        const file = new AttachmentBuilder(media.url, { name: safeName });
        const isImage = (media.contentType || '').startsWith('image/');

        // Target channel: FEEDBACK_CHANNEL if configured, otherwise the current one
        let channel = interaction.channel;
        if (config.FEEDBACK_CHANNEL) {
            const configured = interaction.client.channels.cache.get(config.FEEDBACK_CHANNEL);
            if (configured) channel = configured;
        }

        await interaction.reply({ content: `Feedback posted in ${channel}.`, ephemeral: true });

        const supportsV2 = typeof ContainerBuilder === 'function' && MessageFlags?.IsComponentsV2;

        if (supportsV2) {
            const container = new ContainerBuilder().setAccentColor(config.DEFAULT_COLOR);

            if (isImage) {
                container.addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems(
                        new MediaGalleryItemBuilder().setURL(`attachment://${safeName}`)
                    )
                );
            } else {
                container.addFileComponents(
                    new FileBuilder().setURL(`attachment://${safeName}`)
                );
            }

            await channel.send({
                components: [
                    new TextDisplayBuilder().setContent(`**${AUTO_TITLE}**`),
                    new TextDisplayBuilder().setContent(`**${subtitle}**`),
                    container,
                    new TextDisplayBuilder().setContent(`-# By Lost • ${interaction.user}`),
                ],
                files: [file],
                flags: MessageFlags.IsComponentsV2,
            });
            return;
        }

        // Fallback for older discord.js
        const embed = new EmbedBuilder()
            .setTitle(AUTO_TITLE)
            .setDescription(`**${subtitle}**`)
            .setColor(config.DEFAULT_COLOR)
            .setFooter(getFooter())
            .setTimestamp();

        if (isImage) embed.setImage(`attachment://${safeName}`);

        await channel.send({
            embeds: [embed],
            files: isImage ? [file, getBirdAttachment()] : [file, getBirdAttachment()],
        });
    },
};
