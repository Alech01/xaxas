const antispam = require('../handlers/antispam');
const ticketHandler = require('../handlers/ticketHandler');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;
        if (!message.guild) return;

        // Anti-spam and anti-link check
        const blocked = await antispam.checkMessage(message, client);
        if (blocked) return;

        // Update ticket activity tracking
        ticketHandler.updateActivity(message.channel.id);

        // Handle !payments prefix command
        if (message.content.toLowerCase() === '!payments') {
            await message.delete().catch(() => {});

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('payments_lang')
                .setPlaceholder('Select language / Selecciona idioma / Selecione idioma')
                .addOptions([
                    { label: 'English', value: 'en' },
                    { label: 'Espanol', value: 'es' },
                    { label: 'Portugues', value: 'pt' },
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await message.channel.send({
                content: 'Select your preferred language:',
                components: [row],
            });
        }
    },
};
