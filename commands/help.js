const Discord = require('discord.js');

const embedColor = process.env.embedColor;

exports.help = async() => {
    let name = `**help**`;
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
            .setName('help')
            .setDescription('Displays the help menu');
}

/**
* @param {Discord.Interaction<CacheType>} interaction
* @param {Discord.Client} client
*/
exports.run = async(interaction, client) => {
    let embed = new Discord.EmbedBuilder();

    if (embedColor) embed.setColor(embedColor);
    embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
    embed.setTitle("Command List");
    embed.setFooter("???");

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
