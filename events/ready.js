const { ActivityType, REST, Routes } = require('discord.js');
const { syncEmojis } = require('../utils/emojis');
const config = require('../config');

async function registerCommands(client) {
    const commands = [];
    for (const command of client.commands.values()) {
        if (command.data && typeof command.data.toJSON === 'function') {
            commands.push(command.data.toJSON());
        }
    }

    if (commands.length === 0) {
        console.warn('[commands] No commands found to register.');
        return;
    }

    const clientId = client.application?.id || client.user.id;
    const rest = new REST({ version: '10' }).setToken(client.token);

    console.log(`[commands] Registering ${commands.length} commands: ${commands.map(c => '/' + c.name).join(', ')}`);

    const guildIds = new Set(client.guilds.cache.map(g => g.id));
    if (config.GUILD_ID) guildIds.add(config.GUILD_ID);

    for (const guildId of guildIds) {
        try {
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
            console.log(`[commands] OK -> guild ${guildId}`);
        } catch (err) {
            if (err.code === 50001 || err.status === 403) {
                console.error(`[commands] MISSING ACCESS in guild ${guildId}. The bot was invited without the "applications.commands" scope.`);
                console.error(`[commands] Re-invite it with this URL:\nhttps://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`);
            } else {
                console.error(`[commands] FAILED -> guild ${guildId}:`, err.message);
            }
        }
    }

    try {
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
    } catch (err) {
        console.warn('[commands] Could not clear global commands:', err.message);
    }
}

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}`);

        client.user.setPresence({
            activities: [{ name: 'Lost Bypass TOP!', type: ActivityType.Playing }],
            status: 'dnd',
        });

        console.log('Status set to DND - Lost Bypass TOP!');

        await syncEmojis(client).catch(err => console.error('[emojis] Sync error:', err));
        await registerCommands(client).catch(err => console.error('[commands] Registration error:', err));
    },
};
