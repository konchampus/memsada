# Memes Agency

## Установка

1. Установите Node.js и MongoDB.
2. Склонируйте репозиторий.
3. Установите зависимости:
   cd server
   npm install
   mongod
   use memesAgency
    db.users.insertOne({
    email: "admin@memes.ru",
    password: "$2b$10$YOUR_HASHED_PASSWORD" // Сгенерируйте с помощью bcrypt
    })
    node server/index.js