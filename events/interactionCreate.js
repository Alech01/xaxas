module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing command ${interaction.commandName}:`, error);
                const reply = { content: 'An error occurred while executing this command.', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply).catch(() => {});
                } else {
                    await interaction.reply(reply).catch(() => {});
                }
            }
            return;
        }

        // Buttons
        if (interaction.isButton()) {
            try {
                if (interaction.customId === 'ticket_buy') {
                    const ticketHandler = require('../handlers/ticketHandler');
                    await ticketHandler.createTicket(interaction, client);
                } else if (interaction.customId === 'ticket_close') {
                    const ticketHandler = require('../handlers/ticketHandler');
                    await ticketHandler.closeTicket(interaction, client);
                }
            } catch (error) {
                console.error('Error handling button interaction:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'An error occurred.', ephemeral: true }).catch(() => {});
                }
            }
            return;
        }

        // Modals
        if (interaction.isModalSubmit()) {
            try {
                if (interaction.customId === 'changelog_modal') {
                    const changelog = require('../commands/changelog');
                    await changelog.handleModal(interaction);
                } else if (interaction.customId === 'embed_modal') {
                    const embedCommand = require('../commands/embed');
                    await embedCommand.handleModal(interaction);
                }
            } catch (error) {
                console.error('Error handling modal submit:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'An error occurred.', ephemeral: true }).catch(() => {});
                }
            }
            return;
        }

        // Select menus
        if (interaction.isStringSelectMenu()) {
            try {
                if (interaction.customId === 'payments_lang') {
                    const payments = require('../commands/payments');
                    await payments.handleLanguageSelect(interaction);
                } else if (interaction.customId === 'status_select') {
                    const status = require('../commands/status');
                    await status.handleStatusSelect(interaction);
                }
            } catch (error) {
                console.error('Error handling select menu interaction:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'An error occurred.', ephemeral: true }).catch(() => {});
                }
            }
            return;
        }
    },
};
