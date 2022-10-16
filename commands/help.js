const Discord = require('discord.js');
const __filename__ = __filename; // Old __filename
__filename = require("path").parse(__filename).name.toLowerCase(); // Since names have to be lower cased

const embedColor = process.env.embedColor;

exports.help = async() => {
    let name = `**${__filename}**`;
    let description = "Displays the help menu";
    return `${name} - ${description}\n`;
}

/**
 * 
 * @param {Discord.SlashCommandBuilder} builder 
 * @returns {Discord.SlashCommandBuilder} built
 */
 exports.build = (builder) => {
    return builder
            .setName(__filename)
            .setDescription('Displays the help menu');
}

/**
* @param {Discord.Interaction<CacheType>} interaction
* @param {Discord.Client} client
*/
exports.run = async(interaction, client) => {
    let embed = new Discord.EmbedBuilder();

    if (embedColor) embed.setColor(embedColor);
    embed.setAuthor({
        name: interaction.user.tag,
        url: interaction.user.displayAvatarURL()
    });
    embed.setTitle("Command List");
    embed.setFooter({
        text: "Help Command"
    });

    let description = `There are ${client.commandList.length} commands\n\n`;

    for(const command of client.commandList)
    {
        let concatedString = "";

        try
        {
            concatedString = await command.file.help();
        }
        catch
        {
            concatedString = "**Load Failed** - Help display of command failed to load\n";
        }

        description += concatedString;
    }

    embed.setDescription(description);
    return interaction.reply({ embeds: [embed], ephemeral: true }); // If I remember right this should be correct??
}
