const express = require('express');
const { generateTasks, generateDiagram, digitizeImage } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/tasks',    protect, generateTasks);
router.post('/diagram',  protect, generateDiagram);
router.post('/digitize', protect, digitizeImage);

module.exports = router;
