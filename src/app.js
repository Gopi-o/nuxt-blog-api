const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

// Путь к db.json
const DB_PATH = path.join(__dirname, 'db.json');

// Чтение данных
function getDb() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

// Маршрут для главной страницы
app.get('/', (req, res) => {
  res.send('API работает! Доступные пути: /posts');
});

app.get('/posts', (req, res) => {
  const db = getDb();
  let result = [...db.posts];
  
  if (req.query._sort) {
    const order = req.query._order === 'desc' ? -1 : 1;
    result.sort((a, b) => (a[req.query._sort] > b[req.query._sort] ? order : -order));
  }
  
  if (req.query._limit) {
    result = result.slice(0, Number(req.query._limit));
  }
  
  res.json(result);
});

app.get('/comments', (req, res) => {
  const db = getDb();
  let result = db.comments;
  if (req.query.postId) {
    result = result.filter(c => c.postId == req.query.postId);
  }
  res.json(result);
});

app.patch('/posts/:id', (req, res) => {
  const db = getDb()
  const postIndex = db.posts.findIndex(p => p.id == req.params.id)
  
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Пост не найден' })
  }
  
  db.posts[postIndex] = { ...db.posts[postIndex], ...req.body }
  fs.writeFileSync(DB_PATH, JSON.stringify(db))
  
  res.json(db.posts[postIndex])
})

app.delete('/posts/:id', (req, res) => {
  const db = getDb()
  const postId = parseInt(req.params.id);
  
  const postIndex = db.posts.findIndex(p => p.id === postId);
  
  // if (postIndex === -1) {
  //   return res.status(404).json({ error: 'Пост не найден' });
  // }
  
  db.posts.splice(postIndex, 1);
  
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
})

app.get('/posts/:id', (req, res) => {
  const db = getDb();
  const post = db.posts.find(p => p.id == req.params.id);
  res.json(post || { error: 'Пост не найден' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});