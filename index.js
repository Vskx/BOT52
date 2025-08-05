
require('dotenv').config()
const { Client, GatewayIntentBits, ActivityType } = require('discord.js')
const fs = require('fs')

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const statuses = [
  { name: 'status1', type: ActivityType.Playing },
  { name: 'status2', type: ActivityType.Watching },
  { name: 'status2', type: ActivityType.Listening }
]
let statusIndex = 0

client.once('ready', async () => {
  console.log(`Zalogowano jako ${client.user.tag}`)
  require('./src/handlers/commandHandler')(client)
  setInterval(() => {
    client.user.setActivity(statuses[statusIndex])
    statusIndex = (statusIndex + 1) % statuses.length
  }, 30000)
})

fs.readdirSync('./src/events').filter(f => f.endsWith('.js')).forEach(file => {
  const event = require(`./src/events/${file}`)
  if (event.name) client.on(event.name, (...args) => event.execute(...args, client))
})

client.login(process.env.TOKEN)
