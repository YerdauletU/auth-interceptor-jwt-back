// const jwt = require("jsonwebtoken");
// const fs = require("fs");

// let accessPrivateKey = 'your_access_secret_key';
// let refreshPrivateKey = 'your_refresh_secret_key';

// let aToken = jwt.sign({ id: 3, name: "c", password: "cc" }, accessPrivateKey, { expiresIn: '30' });
// let rToken = jwt.sign({ id: 2, name: "b", password: "bb" }, refreshPrivateKey, { expiresIn: '5000h' });

// console.log("access: " + aToken);
// console.log("refresh: " + rToken);

// console.log("asd");

// let asd = fs.readFileSync("./DB.json", "utf8")
// console.log(asd);
// asd = JSON.parse(asd)
// console.log(typeof asd);
// fs.writeFileSync("./DB.json", JSON.stringify([...asd, {id:2}]));
// const zxc = fs.readFileSync("./DB.json", "utf8")
// console.log(zxc);

///////////

// app.post("/asd", (req, res) => {
//     let {id} = req.body;
//     console.log(id);

//     // return res.send("asd: " + id);
//     res.json({"uuid": 65464564});
// })

/////////////

const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Заглушка для базы данных пользователей
function findUserByUsername(username) {
  let users = fs.readFileSync("./DB.json", "utf8");
  users = JSON.parse(users);

  let result;
  users.map((user, index) => {
    if (user.name === username) {
      result = { index, ...user };
    }
  });
  return result;
}

let accessPrivateKey = "your_access_secret_key";
let refreshPrivateKey = "your_refresh_secret_key";

// Генерация Access Token
function generateAccessToken({ id, name, password }) {
  return jwt.sign({ id, name, password }, accessPrivateKey, {
    expiresIn: "30",
  });
}

// Генерация Refresh Token
function generateRefreshToken({ id, name, password }) {
  return jwt.sign({ id, name, password }, refreshPrivateKey, {
    expiresIn: "5m",
  });
}

app.post("/api/login", (req, res) => {
  // Предположим, что данные пользователя передаются в теле запроса
  const { name, password, access } = req.body;
  const authHeader = req.headers["Authorization"];
  console.log(authHeader);

  // Находим пользователя в базе данных
  const user = findUserByUsername(name);
  console.log(user);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Неверные учетные данные" });
  }

  let accessToken;
  if (!access) accessToken = user.access;

  jwt.verify(accessToken, accessPrivateKey, (err, decoded) => {
    if (err) {
      // console.log(typeof {...decoded});
      // console.log({...decoded});
      // return res.json({decoded});
      return res.status(403).json({ error: "Недействительный access token" });
    }

    // return res.json({ answer: name });
    return res.json({ accessToken });
  });
});

app.post("/api/refresh", (req, res) => {
  const userName = req.body.name;

  const user = findUserByUsername(userName);

  let { refresh, index } = user;

  let customDecoded;
  try {
    customDecoded = jwt.decode(refresh);
  } catch (error) {
    return res
      .status(403)
      .json({ error: "Отсуствуют decode данные refresh token" });
  }

  let { id, name, password } = customDecoded;

  jwt.verify(refresh, refreshPrivateKey, (err, decoded) => {
    if (err) {
      //   return res.status(403).json({ error: "Недействительный refresh token" });

      return res.json(customDecoded);
    }

    let newAccessToken = generateAccessToken({ id, name, password });
    
    let users = fs.readFileSync("./DB.json", "utf8");
    users = JSON.parse(users);
    // console.log("prev access: " + users[index].access);
    users[index].access = newAccessToken;
    // console.log(users[index]);
    fs.writeFileSync("./DB.json", JSON.stringify(users));
    return res.json({ newAccessToken });
  });

  // return res.json(customDecoded);
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
