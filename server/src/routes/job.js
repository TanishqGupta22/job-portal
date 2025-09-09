const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { authGuard } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/jobController');

const router = Router();
const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 200 });

router.get('/', limiter, ctrl.getJobs);
router.get('/me', authGuard, requireRole('recruiter'), limiter, ctrl.getMyJobs);
router.get('/stats', authGuard, requireRole('recruiter'), limiter, ctrl.getJobStats);
router.get('/:id', limiter, ctrl.getJobById);

router.post('/', authGuard, requireRole('recruiter'), limiter, ctrl.createJob);
router.put('/:id', authGuard, requireRole('recruiter'), limiter, ctrl.updateJob);
router.patch('/:id/status', authGuard, requireRole('recruiter'), limiter, ctrl.updateJobStatus);
router.delete('/:id', authGuard, requireRole('recruiter'), limiter, ctrl.deleteJob);

router.post('/:id/apply', authGuard, requireRole('job_seeker'), limiter, ctrl.applyToJob);

router.get('/recruiter/applications', authGuard, requireRole('recruiter'), limiter, ctrl.getApplicationsForRecruiterJobs);
router.get('/me/applications', authGuard, requireRole('job_seeker'), limiter, ctrl.getMyApplications);

module.exports = router;


