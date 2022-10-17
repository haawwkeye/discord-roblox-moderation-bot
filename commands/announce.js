const Discord = require("discord.js");
const ms = require("ms");
const __filename__ = __filename; // Old __filename
__filename = require("path").parse(__filename).name.toLowerCase(); // Since names have to be lower cased

const commandCoolDown = new Set();


function startCoolDown(authorId)
{
    commandCoolDown.add(authorId);

    let timeString = `${process.env.cooldown || "10"}s`;
    setTimeout(() => {
        commandCoolDown.delete(authorId);
    }, ms(timeString));
}

// This is the roblox command this is what we will be looking for on the admin website
// with this we can also only show commands that have this Roblox function
exports.Roblox = async() => {
    
}

// Permission level for the command
exports.Level = -1;

exports.help = async() => {
    let name = `**${__filename__} <title> <description>**`;
    let description = "Makes a global announcement to the players playing your game";
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
            .setDescription("Makes a global announcement to the players playing your game")
            .addStringOption(option => option.setName("title").setDescription("The announcement title").setRequired(true))
            .addStringOption(option => option.setName("description").setDescription("The announcement content").setRequired(true));
}

/**
* @param {Discord.Interaction<CacheType>} interaction
* @param {Discord.Client} client
*/
exports.run = async(interaction, client) => {
    let author = interaction.user;
    let title = interaction.options.getString("title");
    let description = interaction.options.getString("description");

    if (commandCoolDown.has(author.id))
    {
        return interaction.reply({
            embeds: [client.embedMaker(author, "Cooldown", `You're on cooldown! Please try to use this command again after ${Number(process.env.cooldown)} seconds since the last successful attempt`)],
            ephemeral: true
        });
    }

    if(!title)
    {
        return interaction.reply({
            embeds: [client.embedMaker(author, "No Title Supplied", "You didn't supply a title for me to set as the announcement's title")],
            ephemeral: true
        });
    }

    if(!description)
    {
        return interaction.reply({
            embeds: [client.embedMaker(author, "No Description Supplied", "You didn't supply a description for me to set as the announcement's description")],
            ephemeral: true
        });
    }

    startCoolDown(author.id);
    
    let user = interaction.user;

    let requestID = interaction.id;
    let newRequest = {
        author: user.tag,
        title: title,
        description: description,

        type: "Announcement",
        requestID: requestID,
        authorID: user.id,
    }

    client.interactions[requestID] = interaction;
    client.request[requestID] = newRequest;

    setTimeout(() => {
        if (client.interactions[requestID] != undefined && client.request[requestID] != undefined)
        {            
            delete client.request[requestID]
            delete client.interactions[requestID]

            interaction.followUp({
                content: `<@${user.id}>`,
                embeds: [client.embedMaker(user, "Failure", "Command timed out (30s)")],
                ephemeral: true
            });
        }
    }, ms("30s"));

    await interaction.reply({
        embeds: [client.embedMaker(author, "Sent Request", `I have successfully sent the request over for Roblox to read! If there is no response, it's most likely that the server is down`)],
        ephemeral: true
    });
}