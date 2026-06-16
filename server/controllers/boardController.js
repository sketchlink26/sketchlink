const Board = require('../models/Board');

// GET /api/boards  — list all boards owned or shared with user
const getBoards = async (req, res, next) => {
  try {
    const boards = await Board.find({
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id },
      ],
    })
      .select('title description thumbnail createdAt updatedAt shareCode owner')
      .sort({ updatedAt: -1 });

    res.json({ boards });
  } catch (err) {
    next(err);
  }
};

// POST /api/boards — create new board
const createBoard = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const board = await Board.create({
      title:       title || 'Untitled Board',
      description: description || '',
      owner:       req.user._id,
    });
    res.status(201).json({ board });
  } catch (err) {
    next(err);
  }
};

// GET /api/boards/:id
const getBoardById = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id)
      .select('+elements')
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Access check
    const isOwner = board.owner._id.toString() === req.user._id.toString();
    const isCollab = board.collaborators.some(
      c => c.user._id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollab && !board.isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ board });
  } catch (err) {
    next(err);
  }
};

// GET /api/boards/share/:code  — join by share code, auto-adds requester as collaborator
const getBoardByShareCode = async (req, res, next) => {
  try {
    const board = await Board.findOne({ shareCode: req.params.code });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const isOwner      = board.owner.toString() === req.user._id.toString();
    const alreadyCollab = board.collaborators.some(
      c => c.user.toString() === req.user._id.toString()
    );

    if (!isOwner && !alreadyCollab) {
      board.collaborators.push({ user: req.user._id, role: 'editor' });
      await board.save();
    }

    // Re-fetch with full population so client gets owner/collaborator names
    const populated = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    res.json({ board: populated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/boards/:id  — save board elements (auto-save)
const updateBoard = async (req, res, next) => {
  try {
    const { title, elements, thumbnail } = req.body;

    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Push current state to history (keep last 20)
    if (board.elements && board.elements.length > 0) {
      board.history.push({ elements: board.elements, savedBy: req.user._id });
      if (board.history.length > 20) board.history.shift();
    }

    if (title)     board.title     = title;
    if (elements)  board.elements  = elements;
    if (thumbnail) board.thumbnail = thumbnail;

    await board.save();
    res.json({ board });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/boards/:id
const deleteBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await board.deleteOne();
    res.json({ message: 'Board deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBoards,
  createBoard,
  getBoardById,
  getBoardByShareCode,
  updateBoard,
  deleteBoard,
};
