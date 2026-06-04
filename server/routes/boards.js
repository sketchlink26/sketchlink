const express = require('express');
const {
  getBoards,
  createBoard,
  getBoardById,
  getBoardByShareCode,
  updateBoard,
  deleteBoard,
} = require('../controllers/boardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);   // all board routes require auth

router.get('/',                    getBoards);
router.post('/',                   createBoard);
router.get('/share/:code',         getBoardByShareCode);
router.get('/:id',                 getBoardById);
router.put('/:id',                 updateBoard);
router.delete('/:id',              deleteBoard);

module.exports = router;
