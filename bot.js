require('dotenv').config();
const tmi = require('tmi.js');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('.data/db.json');
const db = low(adapter);

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

// create default values for tspin average tracker
// tsm, tss, tsd, tst
db.defaults({
  games: [],
  total: 0
}
).write();

// db.setState({
//   games: [],
//   total: 0
// }).write();
// console.log(db.getState());


// !tspincounter 0 2 1 0
// !tspinstats

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
  
  switch(commandName) {
    case '!tiltcd':
      if (!checkModStatus(user, channel)) {
        return;
      }

      // parse out argument after the space
      const timer = chatMessage.split(' ')[1];

      if (!timer || isNaN(timer)) {
        client.say(channel, `Countdown timer usage: !tiltcd x, where x is the number of seconds you wish to countdown from.`);
        return;
      }

      client.say(channel, `${timer} second countdown started!`);  
      console.log(`${timer} second countdown started!`);
      startCountdown(channel, timer);
      break;
    case '!costcoso':
      if (!checkModStatus(user, channel)) {
        return;
      }

      client.say(channel, `@asdfWENDYfdsa loves Costco. $1.50 for a hot dog and soda. Kirkland is the best. This is not paid advertising. She just loves Costco. Chicken bake. Free samples.`);    
      break;
    case '!tspincount':
      if (!checkModStatus(user, channel)) {
        return;
      }

      let eh = chatMessage.split(' ');
      storeTspins(eh[1], eh[2], eh[3], eh[4], getNextGameId());

      client.say(channel, `Thank you, Wendy, your submission has been accepted.`);
      break;
    case '!tspinstats':
      const results = getTspinStats();     
    
      client.say(channel, `Total T99 games played: ${results.total}`);
      client.say(channel, `Average T-spin Mini per game: ${results.aTsm}`);
      client.say(channel, `Average T-spin Single per game: ${results.aTss}`);
      client.say(channel, `Average T-spin Double per game: ${results.aTsd}`);
      client.say(channel, `Average T-spin Triple per game: ${results.aTst}`);
      
      break;
    case 'yay^yay!':
      if (!checkModStatus(user, channel)) {
        return;
      }
      
      let bitdonor = chatMessage.split(' ')[1];
      let bitamount = chatMessage.split(' ')[4]*10;
      
      if (bitdonor) {
        client.say(channel, `!addpoints ${bitdonor} ${bitamount}`);
      }      
      break;
    default:
      break;
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

function getNextGameId() {
  return db.get('total').value() + 1 || 1;
}

function storeTspins(tsm, tss, tsd, tst, id) {
  if (!isNaN(tsm) && !isNaN(tss) && !isNaN(tsd) && !isNaN(tst)) {
    console.log('-----------------------------');
    console.log(tsm, tss, tsd, tst);
    console.log('-----------------------------');
    db.get('games')
      .push({
        id,
        tsm,
        tss,
        tsd,
        tst,
        dateTime: new Date()
      })
      .write();
    
    db.update('total', n => n+1)
      .write();
  } else {
    // bad
  }
}

function getTspinStats() {
  const totalGames = db.get('total').value();  
  const games = db.get('games').value();
  
  let startObj = {
    tTsm: 0,
    tTss: 0,
    tTsd: 0,
    tTst: 0
  };
  
  const reducer = (accumulator, currentValue) => {    
    return {
      tTsm : accumulator.tTsm + Number(currentValue.tsm),
      tTss : accumulator.tTss + Number(currentValue.tss),
      tTsd : accumulator.tTsd + Number(currentValue.tsd),
      tTst : accumulator.tTst + Number(currentValue.tst)
    }
  }
  
  const totalStats = games.reduce(reducer, startObj);  
  
  return {
    aTsm: (totalStats.tTsm / totalGames).toFixed(2),
    aTss: (totalStats.tTss / totalGames).toFixed(2),
    aTsd: (totalStats.tTsd / totalGames).toFixed(2),
    aTst: (totalStats.tTst / totalGames).toFixed(2),
    total: totalGames
  };
  
}