const OpenAI = require('openai');
const Board  = require('../models/Board');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/tasks  — generate tasks from board description
const generateTasks = async (req, res, next) => {
  try {
    const { boardDescription, boardId, nlpHint } = req.body;

    const prompt = `You are the AI engine inside SketchLink, an AI-powered collaborative whiteboard.

Board content: ${boardDescription || 'A whiteboard with various shapes and diagrams.'}
${nlpHint ? 'User described the board as: "' + nlpHint + '"' : ''}

Generate 5–6 actionable software development tasks a team should complete based on this board content.
Return ONLY a valid JSON array. Each object: {"title":"...","priority":"High|Medium|Low","category":"Design|Dev|Testing|Docs|Meeting"}
No markdown fences, no explanation — raw JSON only.`;

    const completion = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      messages:    [{ role: 'user', content: prompt }],
      max_tokens:  600,
      temperature: 0.7,
    });

    const raw   = completion.choices[0].message.content.trim().replace(/```json|```/g, '');
    const tasks = JSON.parse(raw);

    if (boardId) {
      await Board.findByIdAndUpdate(boardId, {
        $set: { generatedTasks: tasks.map(t => ({ ...t, completed: false })) },
      });
    }

    res.json({ tasks });
  } catch (err) {
    console.error('Tasks error:', err.message);
    const fallback = [
      { title: 'Design system architecture & component diagram',  priority: 'High',   category: 'Design'  },
      { title: 'Set up MERN stack project scaffolding',           priority: 'High',   category: 'Dev'     },
      { title: 'Implement HTML5 canvas drawing engine',           priority: 'High',   category: 'Dev'     },
      { title: 'Integrate TensorFlow.js CNN model client-side',   priority: 'Medium', category: 'Dev'     },
      { title: 'Set up Socket.IO real-time collaboration server', priority: 'Medium', category: 'Dev'     },
      { title: 'Write unit tests for shape recognition module',   priority: 'Low',    category: 'Testing' },
    ];
    res.json({ tasks: fallback, fallback: true });
  }
};

// POST /api/ai/diagram  — generate diagram structure from text
const generateDiagram = async (req, res, next) => {
  try {
    const { prompt: userPrompt } = req.body;

    const prompt = `You are the AI diagram engine inside SketchLink.
The user wants to generate a diagram for: "${userPrompt}"

Return a JSON object describing the diagram:
{
  "type": "flowchart|mindmap|architecture",
  "nodes": [{"id":"n1","label":"...","shape":"rect|circle|diamond","color":"#hexcolor","x":100,"y":100}],
  "edges": [{"from":"n1","to":"n2","label":""}]
}
Keep it to 4–7 nodes. Space nodes at least 150px apart. No markdown, raw JSON only.`;

    const completion = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      messages:    [{ role: 'user', content: prompt }],
      max_tokens:  600,
      temperature: 0.5,
    });

    const raw     = completion.choices[0].message.content.trim().replace(/```json|```/g, '');
    const diagram = JSON.parse(raw);
    res.json({ diagram });
  } catch (err) {
    console.error('Diagram error:', err.message);
    next(err);
  }
};

module.exports = { generateTasks, generateDiagram };