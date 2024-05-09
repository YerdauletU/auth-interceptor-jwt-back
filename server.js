const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

// Массив пользователей (предположим, что у каждого есть уникальный ID и пароль)
const users = [
  { id: 1, username: "user1", password: "password1" },
  { id: 2, username: "user2", password: "password2" },
];

// Заглушка для базы данных пользователей
function findUserByUsername(username) {
  return users.find((user) => user.username === username);
}

// Генерация Access Token
function generateAccessToken(user) {
  return jwt.sign({ userId: user.id }, "your_secret_key", { expiresIn: "30" });
}

// Генерация Refresh Token
function generateRefreshToken() {
  return jwt.sign({}, "your_refresh_secret_key", { expiresIn: "5m" });
}

// Обработчик для запроса на аутентификацию
app.post("/api/login", (req, res) => {
  // Предположим, что данные пользователя передаются в теле запроса
  const { username, password } = req.body;

  // Находим пользователя в базе данных
  const user = findUserByUsername(username);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Неверные учетные данные" });
  }

  // Генерируем Access Token и Refresh Token
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  res.json({ accessToken, refreshToken });
});

// Обработчик для запроса на обновление Access Token
app.post("/api/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "Отсутствует refresh token" });
  }

  jwt.verify(refreshToken, "your_refresh_secret_key", (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Недействительный refresh token" });
    }

    // Предположим, что мы можем получить ID пользователя из refresh token
    const userId = decoded.userId;

    // На основе ID пользователя можно сгенерировать новый access token
    const user = users.find((user) => user.id === userId);

    if (!user) {
      return res.status(401).json({ error: "Пользователь не найден" });
    }

    const accessToken = generateAccessToken(user);

    res.json({ accessToken });
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
