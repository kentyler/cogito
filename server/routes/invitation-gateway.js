import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve the invitation acceptance page
router.get('/invitation/:token', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/invitation.html'));
});

export default router;