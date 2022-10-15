// Interaction setup
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.token);

exports.run = async (commandList) => {
  const commands = [];
  for (const commandData of commandList)
  {
      let command = commandData.file.build(new SlashCommandBuilder());
      commands.push(command.toJSON());
  }

  try
  {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.clientId),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
  catch (error)
  {
		console.error(error);
	}
}