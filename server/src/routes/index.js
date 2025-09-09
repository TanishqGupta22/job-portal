const { Router } = require('express');
const authRoutes = require('./auth');
const jobRoutes = require('./job');
const applicationRoutes = require('./application');

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'API is up' });
});

router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);

module.exports = router;