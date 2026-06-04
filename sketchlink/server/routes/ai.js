const express = require('express');
const { generateTasks, generateDiagram } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/tasks',   protect, generateTasks);
router.post('/diagram', protect, generateDiagram);

module.exports = router;
