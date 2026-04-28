import express from 'express';
import { getIssuesByReport, getReportById, getReports, getUserIssues } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getReports);
router.get('/issues/user', getUserIssues);
router.get('/:reportId', getReportById);
router.get('/:reportId/issues', getIssuesByReport);

export default router;
