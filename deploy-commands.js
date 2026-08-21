const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const config = require('./config');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && typeof command.data.toJSON === 'function') {
        commands.push(command.data.toJSON());
    } else {
        console.warn(`[deploy] Skipped ${file}: no valid "data" export.`);
    }
}

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token) { console.error('[deploy] BOT_TOKEN missing in .env'); process.exit(1); }
if (!clientId) { console.error('[deploy] CLIENT_ID missing in .env'); process.exit(1); }
if (!config.GUILD_ID) { console.error('[deploy] GUILD_ID missing in config.js'); process.exit(1); }

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`[deploy] Registering ${commands.length} commands: ${commands.map(c => '/' + c.name).join(', ')}`);

        await rest.put(
            Routes.applicationGuildCommands(clientId, config.GUILD_ID),
            { body: commands },
        );
        console.log(`[deploy] Guild commands registered in ${config.GUILD_ID}.`);

        // Clear globals to avoid duplicates
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
        console.log('[deploy] Global commands cleared.');
    } catch (error) {
        if (error.code === 50001 || error.status === 403) {
            console.error('[deploy] MISSING ACCESS: the bot is not in that guild, or was invited without the "applications.commands" scope.');
            console.error(`[deploy] Re-invite: https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`);
        } else if (error.status === 401) {
            console.error('[deploy] UNAUTHORIZED: BOT_TOKEN is wrong/regenerated, or CLIENT_ID does not match the token.');
        } else {
            console.error('[deploy] Error registering commands:', error);
        }
        process.exit(1);
    }
})();
