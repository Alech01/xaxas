module.exports = {
    // Roles that can use admin commands (/embed, /status, /changelog, /ticket-panel, /terms)
    ADMIN_ROLES: ['1539347302131699712', '1540273397626576986'],

    // Role automatically assigned to new members
    AUTO_ROLE_ID: '1539347264701734972',

    // Roles allowed to send links (exempt from anti-link)
    LINK_ALLOWED_ROLES: ['1539347239825178684', '1539347302131699712', '1540273397626576986'],

    // Channel IDs
    WELCOME_CHANNEL: '1540272883732054066',
    LEAVE_CHANNEL: '1540272898206470254',
    TRANSCRIPT_CHANNEL: '1540272918775332985',
    MOD_LOG_CHANNEL: '1540291241990950932',

    // Guild ID
    GUILD_ID: '1539336933925322763',

    // Ticket auto-close timings
    TICKET_INACTIVITY_WARNING: 24 * 60 * 60 * 1000,
    TICKET_AUTO_CLOSE_AFTER_WARNING: 12 * 60 * 60 * 1000,

    // Single grey used by EVERY embed in the bot
    DEFAULT_COLOR: 0x808080,

    // Custom emoji ID for the raven on the Buy button
    // After uploading the bird.png as a custom emoji to your server,
    // set this to the emoji ID (e.g., '1234567890123456789')
    RAVEN_EMOJI_ID: null,

    // Ticket category ID (null = auto-create)
    TICKET_CATEGORY_ID: null,

    // Ticket channel name prefix -> ticket-0001, ticket-0002, ...
    TICKET_NAME_PREFIX: 'ticket',

    // Channel where /feedback posts (null = post in the current channel)
    FEEDBACK_CHANNEL: null,

    // true = only ADMIN_ROLES can use /feedback, false = anyone can
    FEEDBACK_ADMIN_ONLY: false,
};
