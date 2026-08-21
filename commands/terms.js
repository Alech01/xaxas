const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const { getFooter, getBirdAttachment } = require('../utils/footer');
const config = require('../config');

const termsText = `**1. Absolute Sale & Zero-Refund Policy:**
All transactions made with Lost Bypass are final and irreversible. By purchasing our software, you acknowledge that no refunds, partial or full, will be granted under any pretext.

**2. Anti-Piracy & Software Integrity:**
Any tampering with our client is strictly forbidden. This includes, but is not limited to, reverse engineering, attempting to crack the software, or uploading our binaries to malware analysis websites (such as VirusTotal). Violating this clause triggers an immediate, permanent hardware ban.

**3. Account Ownership & Discretion:**
Your access is exclusively yours. Renting out your slot, sharing credentials, or reselling the software is a direct violation of these terms. Furthermore, disclosing internal communications, private discord channels, or proprietary guides to the public will result in instant termination.

**4. Hardware Resets & Technical Assistance:**
Our support team is dedicated solely to resolving core bugs within the Lost Bypass software. If you wipe your operating system, change PC components without prior consultation, or require help due to failure to read instructions, a mandatory reconfiguration fee will be applied to restore your service.

**5. Community Standards:**
Lost Bypass maintains a zero-tolerance policy for toxicity. Harassment, insults, or demanding behavior directed at our staff or other members will lead to the immediate revocation of your license. We reserve the right of admission and may refuse service at our discretion.

**6. Disclaimer of Liability:**
The software is delivered strictly on an "as is" basis. Lost Bypass assumes zero liability for in-game account suspensions, hardware malfunctions, or any negative consequences arising from the use of our product. You use this tool entirely at your own risk.

**7. Amendments & Jurisdiction:**
Lost Bypass operates under its local legal jurisdiction for any disputes. We reserve the unrestricted right to modify, add, or remove rules from this agreement at any time. It is your sole responsibility to check for policy updates regularly.`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('terms')
        .setDescription('Display the Terms & Conditions'),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('Terms & Conditions')
            .setDescription(termsText)
            .setColor(config.DEFAULT_COLOR)
            .setFooter(getFooter())
            .setTimestamp();

        await interaction.reply({ content: 'Terms & Conditions posted.', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], files: [getBirdAttachment()] });
    },
};
