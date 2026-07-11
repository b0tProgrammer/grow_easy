const express = require('express');
const upload = require('../middleware/upload');
const { parseCsv } = require('../services/csvParser');
const { processRows } = require('../services/batchProcessor');
const jobStore = require('../services/jobStore');

const router = express.Router();

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded. Attach a CSV under field name "file".' });
    }

    const csvString = req.file.buffer.toString('utf-8');
    const { rows, headers } = parseCsv(csvString);

    const job = jobStore.createJob();
    res.status(202).json({ success: true, jobId: job.id, totalRows: rows.length });

    processRows(rows, headers, (progress) => {
      if (progress.status === 'started') {
        jobStore.updateProgress(job, { totalBatches: progress.totalBatches, totalRows: progress.totalRows, completedBatches: 0 });
      } else if (progress.status === 'done' || progress.status === 'retrying') {
        if (progress.status === 'done') {
          jobStore.updateProgress(job, { completedBatches: job.progress.completedBatches + 1 });
        }
      }
    })
      .then((result) => jobStore.completeJob(job, result))
      .catch((err) => jobStore.failJob(job, err));
  } catch (err) {
    next(err);
  }
});

router.get('/:jobId', (req, res) => {
  const job = jobStore.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found or expired.' });

  res.json({
    success: true,
    status: job.status,
    progress: job.progress,
    result: job.status === 'done' ? job.result : null,
    error: job.error,
  });
});


router.get('/:jobId/events', (req, res) => {
  const job = jobStore.getJob(req.params.jobId);
  if (!job) return res.status(404).end();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);
  send({ type: 'progress', progress: job.progress });
  if (job.status !== 'processing') {
    send(job.status === 'done' ? { type: 'done', result: job.result } : { type: 'error', error: job.error });
    return res.end();
  }

  const unsubscribe = jobStore.subscribe(job, (payload) => {
    send(payload);
    if (payload.type === 'done' || payload.type === 'error') res.end();
  });

  req.on('close', unsubscribe);
});

module.exports = router;
