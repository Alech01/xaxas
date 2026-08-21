const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getFooter, getBirdAttachment } = require('../utils/footer');
const config = require('../config');
const ticketHandler = require('./ticketHandler');
const discordTranscripts = require('discord-html-transcripts');

async function check(client) {
    const tickets = ticketHandler.loadTickets();
    const now = Date.now();
    let modified = false;

    for (const [channelId, ticket] of Object.entries(tickets)) {
        if (ticket.closed) continue;

        const channel = client.channels.cache.get(channelId);
        if (!channel) {
            tickets[channelId].closed = true;
            modified = true;
            continue;
        }

        const timeSinceActivity = now - ticket.lastActivity;

        // Phase 1: Send warning after 24 hours of inactivity
        if (!ticket.warned && timeSinceActivity >= config.TICKET_INACTIVITY_WARNING) {
            // DM the user
            try {
                const user = await client.users.fetch(ticket.userId);
                const dmEmbed = new EmbedBuilder()
                    .setTitle('Ticket Inactivity Warning')
                    .setDescription(
                        `Your ticket in **${channel.guild.name}** has been inactive for 24 hours.\n\n` +
                        'If you do not respond within the next 12 hours, the ticket will be automatically closed.'
                    )
                    .setColor(config.DEFAULT_COLOR)
                    .setFooter(getFooter())
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed], files: [getBirdAttachment()] });
            } catch (error) {
                console.error(`Could not DM user ${ticket.userId}:`, error.message);
            }

            // Send warning in the ticket channel
            const channelEmbed = new EmbedBuilder()
                .setTitle('Inactivity Warning')
                .setDescription(
                    `<@${ticket.userId}>, this ticket has been inactive for 24 hours.\n\n` +
                    'It will be automatically closed in 12 hours if there is no response.'
                )
                .setColor(config.DEFAULT_COLOR)
                .setFooter(getFooter())
                .setTimestamp();

            await channel.send({ embeds: [channelEmbed], files: [getBirdAttachment()] }).catch(() => {});

            tickets[channelId].warned = true;
            tickets[channelId].warnedAt = now;
            modified = true;
        }

        // Phase 2: Auto-close after 12 hours past warning
        if (ticket.warned && ticket.warnedAt) {
            const timeSinceWarning = now - ticket.warnedAt;

            if (timeSinceWarning >= config.TICKET_AUTO_CLOSE_AFTER_WARNING) {
                try {
                    // Generate HTML transcript
                    const htmlTranscript = await discordTranscripts.createTranscript(channel, {
                        filename: `transcript-${channel.name}.html`,
                        saveImages: true,
                        poweredBy: false,
                    });

                    // Generate text transcript
                    const messages = await channel.messages.fetch({ limit: 100 });
                    const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
                    let textContent = `Transcript - ${channel.name}\n`;
                    textContent += `Created: ${new Date().toUTCString()}\n`;
                    textContent += `Reason: Auto-closed due to inactivity\n`;
                    textContent += `${'='.repeat(60)}\n\n`;

                    sorted.forEach(msg => {
                        textContent += `[${msg.createdAt.toUTCString()}] ${msg.author.tag}: ${msg.content || ''}\n`;
                    });

                    const textFile = new AttachmentBuilder(
                        Buffer.from(textContent, 'utf-8'),
                        { name: `transcript-${channel.name}.txt` }
                    );

                    // Send to transcript channel
                    const transcriptChannel = client.channels.cache.get(config.TRANSCRIPT_CHANNEL);
                    if (transcriptChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('Ticket Auto-Closed')
                            .addFields(
                                { name: 'Channel', value: channel.name, inline: true },
                                { name: 'Opened By', value: `<@${ticket.userId}>`, inline: true },
                                { name: 'Reason', value: 'Inactivity', inline: true }
                            )
                            .setColor(config.DEFAULT_COLOR)
                            .setFooter(getFooter())
                            .setTimestamp();

                        await transcriptChannel.send({
                            embeds: [logEmbed],
                            files: [htmlTranscript, textFile, getBirdAttachment()],
                        });
                    }

                    // DM user about closure
                    try {
                        const user = await client.users.fetch(ticket.userId);
                        const closeEmbed = new EmbedBuilder()
                            .setTitle('Ticket Closed')
                            .setDescription('Your ticket has been automatically closed due to inactivity.')
                            .setColor(config.DEFAULT_COLOR)
                            .setFooter(getFooter())
                            .setTimestamp();

                        await user.send({ embeds: [closeEmbed], files: [getBirdAttachment()] });
                    } catch (error) {
                        console.error(`Could not DM user ${ticket.userId}:`, error.message);
                    }

                    tickets[channelId].closed = true;
                    modified = true;

                    await channel.delete().catch(() => {});
                } catch (error) {
                    console.error(`Error auto-closing ticket ${channelId}:`, error);
                }
            }
        }
    }

    if (modified) {
        ticketHandler.saveTickets(tickets);
    }
}

module.exports = { check };
