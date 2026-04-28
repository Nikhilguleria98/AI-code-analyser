import express from 'express';
import { analyzePastedCode, getProjectFileContent, getProjectFiles, listProjects, triggerAnalysis, uploadProject } from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadFile } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', listProjects);
router.post('/upload', uploadFile.single('archive'), uploadProject);
router.post('/analyze-code', analyzePastedCode);
router.get('/:projectId/files', getProjectFiles);
router.get('/:projectId/file', getProjectFileContent);

export default router;
