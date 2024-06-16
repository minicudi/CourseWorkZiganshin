const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors'); 

const app = express();
const port = 3000;
app.use(cors({
  origin: '*', 
  credentials: true
})); 

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Project_for_coursework',
    password: '123',
    port: 5432,
});


app.use(bodyParser.json()); 

app.get('/', (req, res) => {
    res.send('Привет, мир!');
});

app.get('/api/films', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM films');
        res.send(rows); 
    } catch (error) {
        console.error('Error querying films:', error);
        res.status(500).send('Internal Server Error'); 
    }
});

app.get('/api/sessions', async (req, res) => {
    try {
        const { rows } = await pool.query(`
        SELECT sessions.*, films.title AS film_title
        FROM sessions
        INNER JOIN films ON sessions.film_id = films.film_id
        `);
        res.send(rows);
    } catch (error) {
        console.error('Error querying sessions:', error);
        res.status(500).send({ error: 'Internal Server Error' }); 
    }
});


app.get('/api/hall', async (req, res) => {
  try{
    const { rows } = await pool.query('SELECT * FROM hall'); 
    res.send(rows);
  }catch(error){
    console.error('Error querying seats:', error);
    res.status(500).send({error: 'Internal Server Error'});
  
  }
});

app.get('/api/sessions/:filmId', async (req, res) => {
  const { filmId } = req.params;
  try {
    const { rows } = await pool.query('SELECT film_id FROM sessions'); 
    res.send(rows);
  } catch (error) {
    console.error('Error querying sessions:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.get('/api/reservation', async (req, res) => {
  try{
    const { rows } = await pool.query('SELECT * FROM reservation'); 
    res.send(rows);
  }catch(error){
    console.error('Error querying seats:', error);
    res.status(500).send({error: 'Internal Server Error'});
  
  }
});
app.get('/api/halls', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM hall'); 
    res.send(rows);
  } catch (error) {
    console.error('Error querying halls:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});
app.get('/api/hall/:hallId', async (req, res) => {
  const { hallId } = req.params;
  try {
    const query = `
      SELECT 
        hall.*, 
        sessions.*
      FROM 
        hall
      JOIN 
        sessions ON hall.hall_id = sessions.hall_id
      WHERE 
        hall.hall_id = $1
    `;

    const { rows:sessions } = await pool.query(query, [hallId]);
    console.log(sessions);
    const response=[];
    for(const session of sessions){
      const query = `
      SELECT 
        *
      FROM 
        reservation
      WHERE 
        session_id = $1
    `;
    const { rows } = await pool.query(query, [session.session_id]);
    response.push({
      ...session,
      reservations:rows
    
    })
    }
    console.log(response);
    res.send(response);
  } catch (error) {
    console.error('Error querying hall and sessions:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.post('/api/reservation/add', async (req, res) => {
  try {
      const { session_id, row_number, seat_number } = req.body;

      const insertReservationQuery = `INSERT INTO reservation (session_id, row_number, seat_number) VALUES ($1, $2, $3)`;
      const insertParams = [session_id, row_number, seat_number];

      await pool.query(insertReservationQuery, insertParams);

      res.status(201).send('Место успешно зарезервировано');
  } catch (error) {
      console.error('Ошибка при резервировании:', error);
      res.status(500).send('Ошибка при резервировании места');
  }
});
app.get('/api/users', (req, res) => {
  const filePath = path.join(__dirname, 'users.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
          console.error("Error reading file:", err);
          res.status(500).send("Internal Server Error");
          return;
      }
      res.json(JSON.parse(data));
  });
});
app.post('/api/sendReservation', (req, res) => {
  const { filmTitle, sessionTime, seats, username } = req.body;

  const chatId = getChatIdByUsername(username);

  if (chatId) {
      let seatsInfo = seats.map(seat => `Ряд ${seat.rowNumber}, Место ${seat.seatNumber}`).join('\n');
      let message = `Ваше бронирование:\nФильм: ${filmTitle}\nВремя: ${sessionTime}\nМеста:\n${seatsInfo}`;
      bot.sendMessage(chatId, message)
          .then(() => res.status(200).send('Message sent'))
          .catch(error => res.status(500).send(error.message));
  } else {
      res.status(404).send('User not found');
  }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// ---------------------------------<BOT>------------------------------------------------------------//
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const token = '6566385749:AAFeCSKvhMWfubatosa5oDIUokNaf0GFqPY';
const bot = new TelegramBot(token, { polling: true });

const userFilePath = path.join(__dirname, 'users.json');

function readUsersFromFile() {
  if (fs.existsSync(userFilePath)) {
    const fileData = fs.readFileSync(userFilePath);
    return JSON.parse(fileData);
  }
  return {};
}

function writeUsersToFile(users) {
  fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2));
}

let users = readUsersFromFile();
let pendingLogins = {};

fs.watch(userFilePath, (eventType, filename) => {
  if (eventType === 'change') {
    console.log(`${filename} file Changed`);
    users = readUsersFromFile();
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  users = readUsersFromFile(); 

  if (!isChatIdRegistered(chatId)) {
    bot.sendMessage(chatId, 'Привет! Добро пожаловать в наш бот. Пожалуйста, выберите и введите свой логин:');
    pendingLogins[chatId] = true;
  } else {
    bot.sendMessage(chatId, 'Привет! Вы уже зарегистрированы.');
  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  users = readUsersFromFile(); 

  if (msg.text.startsWith('/start')) {
    return;
  }

  if (!isChatIdRegistered(chatId)) {
    if (!pendingLogins[chatId]) {
      bot.sendMessage(chatId, 'Пожалуйста, выберите и введите свой логин:');
      pendingLogins[chatId] = true;
    } else {
      const username = msg.text.trim();
      if (!isLoginUnique(username)) {
        bot.sendMessage(chatId, 'Этот логин уже используется. Пожалуйста, выберите другой логин:');
      } else {
        users[username] = chatId;
        writeUsersToFile(users);
        delete pendingLogins[chatId];
        bot.sendMessage(chatId, `Привет, ${username}! Вы успешно зарегистрировались.`);
      }
    }
  } else {
    bot.sendMessage(chatId, 'Ваш чат ID уже зарегистрирован.');
  }
  console.log(users);
});

function isLoginUnique(username) {
  return !users[username];
}

function isChatIdRegistered(chatId) {
  return Object.values(users).includes(chatId);
}

function getChatIdByUsername(username) {
  return users[username];
}