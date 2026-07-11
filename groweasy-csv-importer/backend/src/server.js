require('dotenv').config();
const express = require('express');
const cors = require('cors');
const importRouter = require('./routes/import');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
  })
);
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.use('/api/import', importRouter);

app.use((req, res) => res.status(404).json({ success: false, error: 'Not found.' }));
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`GrowEasy CSV Importer API listening on port ${process.env.FRONTEND_ORIGIN}`);
  console.log(`GrowEasy CSV Importer API listening on port ${PORT}`);
  console.log(`AI provider: ${process.env.AI_PROVIDER}`);
});

module.exports = app;
