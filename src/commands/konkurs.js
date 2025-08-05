const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('konkurs')
    .setDescription('Tworzy konkurs z nagrodą!')
    .addIntegerOption(option =>
      option.setName('czas')
        .setDescription('Czas trwania w sekundach')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('zwyciezcy')
        .setDescription('Liczba zwycięzców')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('nagroda')
        .setDescription('Nagroda')
        .setRequired(true)),
  async execute(interaction, client) {
    const czas = interaction.options.getInteger('czas');
    const zwyciezcy = interaction.options.getInteger('zwyciezcy');
    const nagroda = interaction.options.getString('nagroda');
    const endTime = Date.now() + czas * 1000;
    const giveawayId = `${interaction.id}_${Date.now()}`;


    let participants = [];
    const konkursEmbed = new EmbedBuilder()
      .setTitle('BOT52 | Konkurs')
      .setDescription(`> 🕒 Konkurs kończy się: <t:${Math.floor(endTime/1000)}:R>\n> 👑 Zwycięzcy: **${zwyciezcy}**\n> 🎁 Nagroda: **${nagroda}**\n\n> 👤 Utworzony przez: <@${interaction.user.id}>`)
      .setImage('https://cdn.discordapp.com/attachments/1382391361243975685/1402190710324596806/Marielle_Price.png?ex=6893035c&is=6891b1dc&hm=80f08c67b78218198ccbb721a7e6eb195a9b0bdc2c5f36261bb3a4287ab718b2&') 
      .setColor(0xFFA500)
      .setFooter({ text: `BOT52 • ${new Date().toLocaleString('pl-PL')}` })
      .setTimestamp(Date.now());

    const joinBtn = new ButtonBuilder()
      .setCustomId(`join_${giveawayId}`)
      .setLabel('Dołącz 🎉')
      .setStyle(ButtonStyle.Success);
    const countBtn = new ButtonBuilder()
      .setCustomId(`count_${giveawayId}`)
      .setLabel('Uczestnicy: 0')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);
    const row = new ActionRowBuilder().addComponents(joinBtn, countBtn);

    const msg = await interaction.reply({ embeds: [konkursEmbed], components: [row], fetchReply: true });


    
    const dbPath = path.join(__dirname, '../../data/giveaways.json');
    let giveaways = [];
    try {
      giveaways = JSON.parse(fs.readFileSync(dbPath));
    } catch {}
    giveaways.push({
      id: giveawayId,
      messageId: msg.id,
      channelId: msg.channel.id,
      endTime,
      zwyciezcy,
      nagroda,
      host: interaction.user.id
    });
    fs.writeFileSync(dbPath, JSON.stringify(giveaways, null, 2));

    
    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: czas * 1000
    });

    collector.on('collect', async i => {
      if (i.customId === `join_${giveawayId}`) {
        if (participants.includes(i.user.id)) {
          await i.reply({ content: 'Już bierzesz udział w konkursie!', ephemeral: true });
        } else {
          participants.push(i.user.id);
          await i.reply({ content: 'Dołączono do konkursu!', ephemeral: true });
          
          const updatedRow = new ActionRowBuilder().addComponents(
            joinBtn,
            new ButtonBuilder()
              .setCustomId(`count_${giveawayId}`)
              .setLabel(`Uczestnicy: ${participants.length}`)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
          await msg.edit({ components: [updatedRow] });
        }
      }
    });

    collector.on('end', async () => {
      let winners = [];
      if (participants.length === 0) {
        winners = ['Brak uczestników w konkursie.'];
      } else {
        let pool = [...participants];
        while (winners.length < zwyciezcy && pool.length > 0) {
          const idx = Math.floor(Math.random() * pool.length);
          winners.push(`<@${pool[idx]}>`);
          pool.splice(idx, 1);
        }
      }
      
      const winEmbed = new EmbedBuilder()
        .setTitle('BOT52 | Konkurs')
        .setDescription(`> 🕒 Konkurs zakończył się: <t:${Math.floor(Date.now()/1000)}:R>\n> 👑 Zwycięzcy: ${winners.join(', ')}\n> 🎁 Nagroda: **${nagroda}**\n\n> 👤 Utworzony przez: <@${interaction.user.id}>`)
        .setImage('https://cdn.discordapp.com/attachments/1382391361243975685/1402190710324596806/Marielle_Price.png?ex=6893035c&is=6891b1dc&hm=80f08c67b78218198ccbb721a7e6eb195a9b0bdc2c5f36261bb3a4287ab718b2&')
        .setColor(0xFFA500)
        .setFooter({ text: `BOT52 • ${new Date().toLocaleString('pl-PL')}` })
        .setTimestamp(Date.now());
      
      const redCountBtn = new ButtonBuilder()
        .setCustomId(`count_${giveawayId}_end`)
        .setLabel(`Uczestnicy: ${participants.length}`)
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true);
      const endRow = new ActionRowBuilder().addComponents(redCountBtn);
      await msg.edit({ embeds: [winEmbed], components: [endRow] });
      
      const statusEmbed = new EmbedBuilder()
        .setDescription(`Konkurs został zakończony. Udział brało ${participants.length} osób.`)
        .setColor(0xFFA500);
      
      if (participants.length === 0) {
        await msg.reply({ embeds: [winEmbed, statusEmbed] });
      } else {
        const congratsEmbed = new EmbedBuilder()
          .setTitle('BOT52 | Konkurs')
          .setDescription(`Gratulacje! Zwycięzcami konkursu są: ${winners.join(', ')}`)
          .setColor(0xFFA500)
          .setFooter({ text: `BOT52 • ${new Date().toLocaleString('pl-PL')}` })
          .setTimestamp(Date.now());
        await msg.reply({
  content: `${winners.join(' ')}`,
  embeds: [congratsEmbed],
});

      }
    });
  }
};
