const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const { getFooter, getBirdAttachment, getLogoAttachment } = require('../utils/footer');
const { getEmoji } = require('../utils/emojis');
const config = require('../config');

const translations = {
    en: {
        title: 'Payment Methods',
        zelle: 'Zelle',
        paypal: 'PayPal',
        transfer_mx: 'Bank Transfer (Mexico)',
        wise: 'Wise',
        cashapp: 'CashApp',
        sent: 'Payment methods posted.',
    },
    es: {
        title: 'Metodos de Pago',
        zelle: 'Zelle',
        paypal: 'PayPal',
        transfer_mx: 'Transferencia Bancaria (Mexico)',
        wise: 'Wise',
        cashapp: 'CashApp',
        sent: 'Metodos de pago publicados.',
    },
    pt: {
        title: 'Metodos de Pagamento',
        zelle: 'Zelle',
        paypal: 'PayPal',
        transfer_mx: 'Transferencia Bancaria (Mexico)',
        wise: 'Wise',
        cashapp: 'CashApp',
        sent: 'Metodos de pagamento publicados.',
    },
};

const paymentMethods = ['zelle', 'paypal', 'transfer_mx', 'wise', 'cashapp'];

function buildPaymentsEmbed(lang) {
    const t = translations[lang] || translations.en;

    // One line per method: LOGO  Name
    const lines = paymentMethods.map(key => {
        const emoji = getEmoji(key);
        return `${emoji ? emoji + ' ' : ''}**${t[key]}**`;
    });

    return new EmbedBuilder()
        .setTitle(t.title)
        .setDescription(lines.join('\n'))
        .setColor(config.DEFAULT_COLOR)
        .setThumbnail('attachment://lost_bypass_logo.png')
        .setFooter(getFooter())
        .setTimestamp();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('payments')
        .setDescription('Display available payment methods'),

    translations,
    paymentMethods,
    buildPaymentsEmbed,

    async execute(interaction) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('payments_lang')
            .setPlaceholder('Select language / Selecciona idioma / Selecione idioma')
            .addOptions([
                { label: 'English', value: 'en' },
                { label: 'Espanol', value: 'es' },
                { label: 'Portugues', value: 'pt' },
            ]);

        await interaction.reply({
            content: 'Select your preferred language:',
            components: [new ActionRowBuilder().addComponents(selectMenu)],
            ephemeral: true,
        });
    },

    async handleLanguageSelect(interaction) {
        const lang = interaction.values[0];
        const t = translations[lang] || translations.en;

        await interaction.update({ content: t.sent, components: [] });

        await interaction.channel.send({
            embeds: [buildPaymentsEmbed(lang)],
            files: [getLogoAttachment(), getBirdAttachment()],
        });
    },
};
