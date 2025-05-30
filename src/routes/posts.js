const express = require('express')
const router = express.Router()

// Временные данные (замените на БД)
let posts = [
  { id: 1, title: 'Первый пост', content: 'Привет, мир!' }
]

// GET /api/posts
router.get('/', (req, res) => {
  res.json(posts)
})

// POST /api/posts
router.post('/', (req, res) => {
  const newPost = { id: posts.length + 1, ...req.body }
  posts.push(newPost)
  res.status(201).json(newPost)
})

module.exports = router