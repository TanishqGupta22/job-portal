const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { authGuard } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/applicationController');

const router = Router();
const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 100 });

// Application routes
router.get('/me', authGuard, requireRole('job_seeker'), limiter, ctrl.getMyApplications);
router.get('/recruiter', authGuard, requireRole('recruiter'), limiter, ctrl.getApplicationsForRecruiterJobs);
router.get('/job/:jobId', authGuard, requireRole('recruiter'), limiter, ctrl.getApplicationsForJob);

// Specific routes before generic :id routes
router.patch('/:id/status', authGuard, requireRole('recruiter'), limiter, ctrl.updateApplicationStatus);
router.get('/:id/resume', authGuard, limiter, ctrl.downloadResume);
router.delete('/:id', authGuard, requireRole('job_seeker'), limiter, ctrl.withdrawApplication);
router.get('/:id', authGuard, limiter, ctrl.getApplicationById);

router.post('/:jobId/apply', authGuard, requireRole('job_seeker'), limiter, ctrl.applyToJob);

module.exports = router;
