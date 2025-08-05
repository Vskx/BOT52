const { REST, Routes } = require('discord.js');
const fs = require('fs');

module.exports = async (client) => {
  client.commands = new Map();
  const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
  const commands = [];

  for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands },
  );
};
