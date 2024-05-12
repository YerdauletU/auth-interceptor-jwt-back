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

// let uuid = crypto.randomUUID();
// console.log(typeof uuid);
// console.log(uuid);

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
  let users = JSON.parse(fs.readFileSync("./DB.json", "utf8"));

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
  // Находим пользователя в базе данных
  const user = findUserByUsername(name);

  // Предположим, что данные пользователя передаются в теле запроса
  const { name, password } = req.body;
  const access = req.headers["authorization"].split(" ")[1];
  if (!access) access = user.access;

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Неверные учетные данные" });
  }

  jwt.verify(access, accessPrivateKey, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ error: "Недействительный access token", access });
    }

    return res.json({ access });
  });
});

app.post("/api/signup", (req, res) => {
  let users = JSON.parse(fs.readFileSync("./DB.json", "utf8"));

  const { name, password } = req.body;

  let user = users.find((user) => user.name === name);
  if (user) return res.status(401).json({ error: "Имя пользователя занято" });

  const id = crypto.randomUUID();
  const access = generateAccessToken({ id, name, password });
  const refresh = generateRefreshToken({ id, name, password });

  users.push({ id, name, password, access, refresh });

  fs.writeFileSync("./DB.json", JSON.stringify(users));

  return res.json(users);
});

app.post("/api/refresh", (req, res) => {
  const accessToken = req.headers["authorization"].split(" ")[1];

  let customDecoded;
  try {
    customDecoded = jwt.decode(accessToken);
  } catch (error) {
    return res
      .status(403)
      .json({ error: "Отсуствуют decode данные access token" });
  }

  const { index, id, name, password, access, refresh } = findUserByUsername(
    customDecoded.name
  );

  jwt.verify(refresh, refreshPrivateKey, (err, decoded) => {
    if (err) {
      let newRefreshToken = generateRefreshToken({ id, name, password });
      let newAccessToken = generateAccessToken({ id, name, password });

      let users = JSON.parse(fs.readFileSync("./DB.json", "utf8"));

      users[index].refresh = newRefreshToken;
      users[index].access = newAccessToken;

      fs.writeFileSync("./DB.json", JSON.stringify(users));

      return res.json({
        access: users[index].access,
        refresh: users[index].refresh,
      });
    }

    let newAccessToken = generateAccessToken({ id, name, password });

    let users = JSON.parse(fs.readFileSync("./DB.json", "utf8"));

    users[index].access = newAccessToken;

    fs.writeFileSync("./DB.json", JSON.stringify(users));

    return res.json({ access: users[index].access });
  });
});

app.post("http://localhost:8080//api/asd", (req, res) => {
  return res.json({message: "aaabbb"});
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
