const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { getFooter, getBirdAttachment } = require('../utils/footer');
const config = require('../config');
const { nextTicketNumber } = require('../utils/counter');
const fs = require('fs');
const path = require('path');

const { dataFile } = require('../utils/paths');

const TICKETS_FILE = dataFile('tickets.json');

function loadTickets() {
    try {
        if (!fs.existsSync(TICKETS_FILE)) return {};
        const data = fs.readFileSync(TICKETS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function saveTickets(data) {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(data, null, 2));
}

async function createTicket(interaction, client) {
    const tickets = loadTickets();

    // Check if user already has an open ticket
    const existing = Object.entries(tickets).find(
        ([_, t]) => t.userId === interaction.user.id && !t.closed
    );

    if (existing) {
        return interaction.reply({
            content: `You already have an open ticket: <#${existing[0]}>`,
            ephemeral: true,
        });
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;

    // Get or create ticket category
    let category = null;
    if (config.TICKET_CATEGORY_ID) {
        category = guild.channels.cache.get(config.TICKET_CATEGORY_ID);
    }
    if (!category) {
        category = guild.channels.cache.find(
            c => c.name === 'Tickets' && c.type === ChannelType.GuildCategory
        );
        if (!category) {
            category = await guild.channels.create({
                name: 'Tickets',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                ],
            });
        }
    }

    // Sequential, zero-padded ticket number: 0001, 0002, ...
    const ticketNumber = nextTicketNumber();
    const channelName = `${config.TICKET_NAME_PREFIX}-${ticketNumber}`;

    // Set up permissions
    const permissionOverwrites = [
        {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
        },
        {
            id: interaction.user.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
            ],
        },
        {
            id: client.user.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ManageMessages,
            ],
        },
    ];

    // Add admin role permissions
    for (const roleId of config.ADMIN_ROLES) {
        permissionOverwrites.push({
            id: roleId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ManageMessages,
            ],
        });
    }

    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites,
    });

    // Save ticket data
    tickets[channel.id] = {
        userId: interaction.user.id,
        channelId: channel.id,
        channelName: channelName,
        number: ticketNumber,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        warned: false,
        warnedAt: null,
        closed: false,
    };
    saveTickets(tickets);

    // Build welcome embed
    const embed = new EmbedBuilder()
        .setTitle(`Ticket #${ticketNumber}`)
        .setDescription(
            `Welcome ${interaction.user}, a staff member will assist you shortly.\n\n` +
            'Please describe what you need:\n' +
            '- Purchase a bypass\n' +
            '- Technical support\n' +
            '- Other inquiries'
        )
        .setColor(config.DEFAULT_COLOR)
        .setFooter(getFooter())
        .setTimestamp();

    const closeButton = new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(closeButton);

    await channel.send({
        content: `${interaction.user}`,
        embeds: [embed],
        components: [row],
        files: [getBirdAttachment()],
    });

    await interaction.editReply({ content: `Your ticket has been created: ${channel}` });
}

async function closeTicket(interaction, client) {
    const tickets = loadTickets();
    const ticketData = tickets[interaction.channel.id];

    if (!ticketData) {
        return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
    }

    await interaction.reply({ content: 'Closing ticket and generating transcript...' });

    try {
        // Generate HTML transcript
        const discordTranscripts = require('discord-html-transcripts');
        const htmlTranscript = await discordTranscripts.createTranscript(interaction.channel, {
            filename: `transcript-${interaction.channel.name}.html`,
            saveImages: true,
            poweredBy: false,
        });

        // Generate plain text transcript
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        let textContent = `Transcript - ${interaction.channel.name}\n`;
        textContent += `Created: ${new Date().toUTCString()}\n`;
        textContent += `${'='.repeat(60)}\n\n`;

        sorted.forEach(msg => {
            textContent += `[${msg.createdAt.toUTCString()}] ${msg.author.tag}: ${msg.content || ''}\n`;
            if (msg.embeds.length > 0) {
                msg.embeds.forEach(embed => {
                    if (embed.title) textContent += `  [Embed Title: ${embed.title}]\n`;
                    if (embed.description) textContent += `  [Embed Description: ${embed.description.substring(0, 200)}]\n`;
                });
            }
            if (msg.attachments.size > 0) {
                textContent += `  [Attachments: ${msg.attachments.map(a => a.url).join(', ')}]\n`;
            }
        });

        const textFile = new AttachmentBuilder(
            Buffer.from(textContent, 'utf-8'),
            { name: `transcript-${interaction.channel.name}.txt` }
        );

        // Send transcripts to log channel
        const transcriptChannel = client.channels.cache.get(config.TRANSCRIPT_CHANNEL);
        if (transcriptChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('Ticket Closed')
                .addFields(
                    { name: 'Ticket', value: `#${ticketData.number || interaction.channel.name}`, inline: true },
                    { name: 'Opened By', value: `<@${ticketData.userId}>`, inline: true },
                    { name: 'Closed By', value: `${interaction.user}`, inline: true }
                )
                .setColor(config.DEFAULT_COLOR)
                .setFooter(getFooter())
                .setTimestamp();

            await transcriptChannel.send({
                embeds: [logEmbed],
                files: [htmlTranscript, textFile, getBirdAttachment()],
            });
        }
    } catch (error) {
        console.error('Error generating transcript:', error);
    }

    // Mark ticket as closed
    tickets[interaction.channel.id].closed = true;
    saveTickets(tickets);

    // Delete the channel after a short delay
    setTimeout(async () => {
        try {
            await interaction.channel.delete();
        } catch (error) {
            console.error('Failed to delete ticket channel:', error);
        }
    }, 5000);
}

function updateActivity(channelId) {
    const tickets = loadTickets();
    if (tickets[channelId] && !tickets[channelId].closed) {
        tickets[channelId].lastActivity = Date.now();
        tickets[channelId].warned = false;
        tickets[channelId].warnedAt = null;
        saveTickets(tickets);
    }
}

module.exports = { createTicket, closeTicket, updateActivity, loadTickets, saveTickets };
