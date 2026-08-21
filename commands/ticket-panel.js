const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder,
    MediaGalleryItemBuilder, SectionBuilder, SeparatorBuilder,
} = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const { getFooter, getBirdAttachment, getLogoAttachment } = require('../utils/footer');
const config = require('../config');

const panelText = `***Before opening a ticket, please read this.***
If you are opening a ticket, it will be for support or if you want to purchase a bypass.
The available bypasses are:
*Lost Public:*
**• Monthly
• Quarterly**
*Lost Private:*
**• Ask in ticket**
*Lost Control Mobile (Slotted):*
**• Ask in ticket**`;

const closingLine = '**All bypasses are fully functional and each has its own method.**';

function buildBuyButton() {
    const button = new ButtonBuilder()
        .setCustomId('ticket_buy')
        .setLabel('Buy')
        .setStyle(ButtonStyle.Secondary);

    if (config.RAVEN_EMOJI_ID) {
        button.setEmoji(config.RAVEN_EMOJI_ID);
    } else {
        button.setEmoji({ name: '\u{1F6D2}' });
    }

    return button;
}

/** Components V2 panel: image, text and the Buy button all inside one bordered block. */
function buildContainerPanel() {
    return new ContainerBuilder()
        .setAccentColor(config.DEFAULT_COLOR)
        .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL('attachment://lost_bypass_logo.png')
            )
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(panelText))
        .addSeparatorComponents(new SeparatorBuilder())
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(closingLine))
                .setButtonAccessory(buildBuyButton())
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('-# By Lost'));
}

/** Fallback for discord.js versions without Components V2. */
function buildLegacyPanel() {
    const embed = new EmbedBuilder()
        .setTitle('Lost Bypass')
        .setDescription(`${panelText}\n\n${closingLine}`)
        .setColor(config.DEFAULT_COLOR)
        .setImage('attachment://lost_bypass_logo.png')
        .setFooter(getFooter())
        .setTimestamp();

    return {
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(buildBuyButton())],
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-panel')
        .setDescription('Send the ticket purchase panel'),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        await interaction.reply({ content: 'Ticket panel sent.', ephemeral: true });

        const supportsV2 = typeof ContainerBuilder === 'function' && MessageFlags?.IsComponentsV2;

        if (supportsV2) {
            await interaction.channel.send({
                components: [buildContainerPanel()],
                files: [getLogoAttachment()],
                flags: MessageFlags.IsComponentsV2,
            });
        } else {
            console.warn('[ticket-panel] Components V2 unavailable, using legacy embed. Run: npm install discord.js@latest');
            await interaction.channel.send({
                ...buildLegacyPanel(),
                files: [getLogoAttachment(), getBirdAttachment()],
            });
        }
    },
};
