const tmi = require('tmi.js');

// Define configuration options
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  connection: {
		secure: true,
		reconnect: true
	},
  channels: [
    process.env.CHANNEL_NAME
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (channel, user, msg, self) {
  console.log(user);
  if (self) { return; } // Ignore messages from the bot  

  // Remove whitespace from chat message
  const chatMessage = msg.trim();

  const commandName = chatMessage.split(' ')[0].toLowerCase();  
  // parse out argument after the space
  const timer = chatMessage.split(' ')[1];
  
  // If the command is known, let's execute it
  if (commandName === '!tiltcd') {    
    if (!checkModStatus(user, channel)) {
      return;
    }
    
    if (!timer || isNaN(timer)) {
      client.say(channel, `Countdown timer usage: !tiltcd x, where x is the number of seconds you wish to countdown from.`);
      return;
    }
    
    client.say(channel, `${timer} second countdown started!`);  
    console.log(`${timer} second countdown started!`);
    startCountdown(channel, timer);    
  } else if (commandName === '!costcoso') {
    if (!checkModStatus(user, channel)) {
      return;
    }
    
    client.say(channel, `@asdfWENDYfdsa loves Costco. $1.50 for a hot dog and soda. Kirkland is the best. This is not paid advertising. She just loves Costco. Chicken bake.`);    
  } else {
    console.log(`* Unknown command ${commandName}`);    
  }
}

function startCountdown (channel, x) {  
  let countRemaining = x;  
    
  const myTimer = setInterval(() => {    
    if (countRemaining === 0) {
      client.say(channel, `GO!`);
      clearInterval(myTimer);      
      return;
    } else if (countRemaining <= 5 || (countRemaining % 5 === 0)){
      client.say(channel, `${countRemaining}`);  
    }
    countRemaining--;
  }, 1500, countRemaining);       
}

function checkModStatus(user, channel) {
  if (!user.mod && user['user-id'] !== '416826719') {
    client.say(channel, `Apply for mod status to use tiltbot LUL`);
    return false;
  }
  return true;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

