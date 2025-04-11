process.env.UNDICI_CONNECT_TIMEOUT = '20000'; // 20 seconds
const path = require('path');
require('dotenv').config();
const cheerio = require('cheerio'); 
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token } = process.env;
const fs = require('fs');

// Create a new client instance
const client = new Client({
    intents: [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
    ]
});
const dataPath = path.join(__dirname, 'challenges.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const challenges = data.challenges;

function saveChallenges() {
  fs.writeFileSync(dataPath, JSON.stringify({ challenges }, null, 2));
}

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.toLowerCase() === 'hello') {
        await message.reply(`hello, ${message.author.username}!`);
    }
    else if (message.content.toLowerCase() == '!quote') {
        try {
            const res = await fetch('https://dummyjson.com/quotes/random');
            const data = await res.json();
            await message.reply(`${data.quote}`);
        }
        catch (err) {
            console.log(err);
        }
    }
    else if (message.content.toLowerCase() === '!challenge') {
        const random = challenges[Math.floor(Math.random() * challenges.length)];


        message.channel.send(`🧠 **${random.name}**\n🔗 ${random.url}`);
    }
    else if (message.content.startsWith('!add ')) {
        const url = message.content.split(' ')[1];
    
        // Validate URL format
        const urlPattern = /^https:\/\/codingchallenges\.fyi\/challenges\/[a-z0-9\-]+\/$/;
        if (!url || !urlPattern.test(url)) {
            return message.channel.send('❌ Please provide a valid codingchallenges.fyi challenge URL. Format: https://codingchallenges.fyi/challenges/[challenge-name]/');
        }
    
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Not found');
    
            const html = await res.text();
            const $ = cheerio.load(html);
    
            // Extract challenge name from the <h1> or a specific class (you can adjust if it's different)
            const title = $('h1').text().trim();
            
    
            if (!title) {
                return message.channel.send('❌ Could not extract the challenge title.');
            }
    
            // Check if it already exists
            if (challenges.some(ch => ch.url === url)) {
                return message.channel.send('⚠️ This challenge is already in the list.');
            }
    
            const newChallenge = { name: title, url };
            challenges.push(newChallenge);
            saveChallenges();
    
            message.channel.send(`✅ Challenge **${title}** added successfully!`);
        } catch (err) {
            console.error(err);
            message.channel.send('❌ Failed to validate or fetch the challenge.');
        }
    }
    
    
});


// Log in to Discord with your client's token
client.login(token);