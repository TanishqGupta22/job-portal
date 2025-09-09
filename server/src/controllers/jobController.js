const Job = require('../models/Job');
const Application = require('../models/Application');
const mongoose = require('mongoose');
const { removeScriptTags } = require('../utils/sanitize');
const { createJobSchema, updateJobSchema, applyJobSchema, updateJobStatusSchema } = require('../validation/jobValidation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/resumes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for resumes'), false);
    }
  }
});

async function createJob(req, res) {
  try {
    console.log('Creating job with data:', JSON.stringify(req.body, null, 2));
    const { value, error } = createJobSchema.validate(req.body, { abortEarly: false });
    if (error) {
      console.log('Validation errors:', error.details);
      return res.status(400).json({ 
        message: 'Validation failed', 
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    value.description = removeScriptTags(value.description);
    // Set company to user's name if not provided
    if (!value.company) {
      value.company = req.user.name || 'Company';
    }
    const job = await Job.create({ ...value, postedBy: req.user.sub });
    console.log('Job created successfully:', job._id);
    return res.status(201).json({ job });
  } catch (e) {
    console.error('Error creating job:', e);
    return res.status(400).json({ message: 'Failed to create job', error: e.message });
  }
}

async function updateJob(req, res) {
  try {
    const { value, error } = updateJobSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
    if (value.description) value.description = removeScriptTags(value.description);
    const job = await Job.findOneAndUpdate({ _id: req.params.id, postedBy: req.user.sub }, value, { new: true });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    return res.json({ job });
  } catch (e) {
    return res.status(400).json({ message: 'Failed to update job' });
  }
}

async function deleteJob(req, res) {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user.sub });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    return res.json({ message: 'Deleted' });
  } catch (e) {
    return res.status(400).json({ message: 'Failed to delete job' });
  }
}

async function getJob(req, res) {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  return res.json({ job });
}

async function getJobs(req, res) {
  try {
    const { 
      search, 
      location, 
      experience, 
      jobType, 
      salaryMin, 
      salaryMax, 
      skills, 
      status = 'active',
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filter = {};
    
    // Text search
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Location filter
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    // Experience level filter
    if (experience) {
      filter.experience = experience;
    }
    
    // Job type filter
    if (jobType) {
      filter.jobType = jobType;
    }
    
    // Salary range filter
    if (salaryMin || salaryMax) {
      filter.$or = filter.$or || [];
      const salaryFilter = {};
      if (salaryMin) salaryFilter.salaryMin = { $gte: Number(salaryMin) };
      if (salaryMax) salaryFilter.salaryMax = { $lte: Number(salaryMax) };
      filter.$or.push(salaryFilter);
    }
    
    // Skills filter
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      filter.skills = { $in: skillArray };
    }
    
    // Status filter
    filter.status = status;
    
    const skip = (Number(page) - 1) * Number(limit);
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('postedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Job.countDocuments(filter)
    ]);
    
    return res.json({ 
      jobs, 
      total, 
      page: Number(page), 
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ message: 'Failed to fetch jobs' });
  }
}

async function getMyJobs(req, res) {
  try {
    const jobs = await Job.find({ postedBy: req.user.sub })
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name email');
    
    // Add application count for each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await Application.countDocuments({ job: job._id });
        return {
          ...job.toObject(),
          applicationCount
        };
      })
    );
    
    return res.json({ jobs: jobsWithCounts });
  } catch (error) {
    console.error('Error fetching my jobs:', error);
    return res.status(500).json({ message: 'Failed to fetch jobs' });
  }
}

async function updateJobStatus(req, res) {
  try {
    const { value, error } = updateJobStatusSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Validation failed', details: error.details });
    }
    
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user.sub }, 
      { status: value.status }, 
      { new: true }
    );
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    return res.json({ job });
  } catch (error) {
    console.error('Error updating job status:', error);
    return res.status(500).json({ message: 'Failed to update job status' });
  }
}

async function getJobStats(req, res) {
  try {
    const userId = req.user.sub;
    const jobs = await Job.find({ postedBy: userId }).select('_id status');
    const jobIds = jobs.map((j) => j._id);
    
    const [totalApplications, pendingApplications, countsByStatus] = await Promise.all([
      Application.countDocuments({ job: { $in: jobIds } }),
      Application.countDocuments({ job: { $in: jobIds }, status: 'applied' }),
      Job.aggregate([
        { $match: { postedBy: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);
    
    const byStatus = countsByStatus.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, { active: 0, paused: 0, closed: 0 });
    
    return res.json({ 
      totalJobs: jobs.length,
      activeJobs: byStatus.active,
      totalApplications,
      pendingApplications,
      byStatus
    });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    return res.status(500).json({ message: 'Failed to fetch job statistics' });
  }
}

async function applyToJob(req, res) {
  try {
    // Handle file upload
    upload.single('resume')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      // Parse skills if sent as JSON string in multipart/form-data
      if (typeof req.body.skills === 'string') {
        try {
          const parsedSkills = JSON.parse(req.body.skills);
          req.body.skills = Array.isArray(parsedSkills) ? parsedSkills : [];
        } catch (e) {
          req.body.skills = [];
        }
      }

      const { value, error } = applyJobSchema.validate(req.body, { abortEarly: false });
      if (error) {
        return res.status(400).json({ message: 'Validation failed', details: error.details });
      }

      // Check if job exists and is active
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      if (job.status !== 'active') {
        return res.status(400).json({ message: 'Job is not accepting applications' });
      }

      // Check if user already applied
      const existingApplication = await Application.findOne({
        job: req.params.id,
        applicant: req.user.sub
      });
      if (existingApplication) {
        return res.status(400).json({ message: 'You have already applied to this job' });
      }

      const applicationData = {
        job: req.params.id,
        applicant: req.user.sub,
        coverLetter: value.coverLetter || '',
        experience: value.experience || '',
        skills: value.skills || [],
        resume: req.file ? req.file.filename : null,
        status: 'applied'
      };

      const application = await Application.create(applicationData);
      await application.populate('job', 'title company postedBy');
      await application.populate('applicant', 'name email');

      return res.status(201).json({ application });
    });
  } catch (error) {
    console.error('Error applying to job:', error);
    return res.status(500).json({ message: 'Failed to apply to job' });
  }
}

async function getApplicationsForRecruiterJobs(req, res) {
  try {
    const jobs = await Job.find({ postedBy: req.user.sub }).select('_id');
    const jobIds = jobs.map((j) => j._id);
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('job', 'title company location')
      .populate('applicant', 'name email')
      .sort({ appliedAt: -1 });
    
    return res.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ message: 'Failed to fetch applications' });
  }
}

async function getMyApplications(req, res) {
  try {
    const applications = await Application.find({ applicant: req.user.sub })
      .populate('job', 'title company location salaryMin salaryMax jobType experience')
      .sort({ appliedAt: -1 });
    
    return res.json({ applications });
  } catch (error) {
    console.error('Error fetching my applications:', error);
    return res.status(500).json({ message: 'Failed to fetch applications' });
  }
}

module.exports = {
  createJob,
  updateJob,
  deleteJob,
  getJobById: getJob,
  getJobs,
  applyToJob,
  getApplicationsForRecruiterJobs,
  getMyApplications,
  getMyJobs,
  updateJobStatus,
  getJobStats,
};


