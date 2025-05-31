const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json());

const readDb = () => JSON.parse(fs.readFileSync(DB_PATH));
const writeDb = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

const getNextId = (collection) => {
  const db = readDb()
  if (!db[collection] || db[collection].length === 0) return 1
  return Math.max(...db[collection].map(item => item.id)) + 1
}

// Обработчик для постов
app.route('/posts')
  .get((req, res) => {
    try {
      const { _sort, _order, _limit } = req.query;
      let posts = [...readDb().posts];

      if (_sort) {
        const order = _order === 'desc' ? -1 : 1;
        posts.sort((a, b) => (a[_sort] > b[_sort] ? order : -order));
      }

      if (_limit) {
        posts = posts.slice(0, Number(_limit));
      }

      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
  .post((req, res) => {
    try {
      const db = readDb();
      const newId = getNextId('posts')
      const newPost = {
        id: newId, 
        ...req.body,
        createdAt: new Date().toISOString(),
        likes: 0
      };
      
      db.posts.push(newPost);
      writeDb(db);
      
      res.status(201).json(newPost);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// Обработчик для одного поста
app.route('/posts/:id')
  .get((req, res) => {
    try {
      const post = readDb().posts.find(p => p.id == req.params.id);
      post ? res.json(post) : res.status(404).json({ error: 'Post not found' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
  .patch((req, res) => {
    try {
      const db = readDb();
      const postIndex = db.posts.findIndex(p => p.id == req.params.id);
      
      if (postIndex === -1) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      db.posts[postIndex] = { 
        ...db.posts[postIndex], 
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      writeDb(db);
      res.json(db.posts[postIndex]);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
  .delete((req, res) => {
    try {
      const db = readDb();
      const initialLength = db.posts.length;
      
      db.posts = db.posts.filter(p => p.id != req.params.id);
      
      if (db.posts.length === initialLength) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      writeDb(db);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// Обработчик для комментов
app.route('/comments')
  .get((req, res) => {
    try {
      let comments = [...readDb().comments];
      
      if (req.query.postId) {
        comments = comments.filter(c => c.postId == req.query.postId);
      }
      
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
  .post((req, res) => {
    try {
      const db = readDb();
      const newId = getNextId('posts')
      const newComment = {
        id: newId,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      
      db.comments.push(newComment);
      writeDb(db);
      
      res.status(201).json(newComment);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});