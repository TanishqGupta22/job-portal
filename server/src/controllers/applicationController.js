const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { applyJobSchema, updateApplicationStatusSchema } = require('../validation/jobValidation');
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
      const job = await Job.findById(req.params.jobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      if (job.status !== 'active') {
        return res.status(400).json({ message: 'Job is not accepting applications' });
      }

      // Check if user already applied
      const existingApplication = await Application.findOne({
        job: req.params.jobId,
        applicant: req.user.sub
      });
      if (existingApplication) {
        return res.status(400).json({ message: 'You have already applied to this job' });
      }

      const applicationData = {
        job: req.params.jobId,
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

async function getApplicationsForRecruiterJobs(req, res) {
  try {
    // Get all jobs posted by this recruiter
    const jobs = await Job.find({ postedBy: req.user.sub }).select('_id');
    const jobIds = jobs.map(job => job._id);

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

async function getApplicationsForJob(req, res) {
  try {
    // Verify the job belongs to this recruiter
    const job = await Job.findOne({ 
      _id: req.params.jobId, 
      postedBy: req.user.sub 
    });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'name email')
      .sort({ appliedAt: -1 });

    return res.json({ applications });
  } catch (error) {
    console.error('Error fetching applications for job:', error);
    return res.status(500).json({ message: 'Failed to fetch applications' });
  }
}

async function getApplicationById(req, res) {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title company location')
      .populate('applicant', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has permission to view this application
    const isApplicant = application.applicant._id.toString() === req.user.sub;
    const isRecruiter = application.job.postedBy.toString() === req.user.sub;

    if (!isApplicant && !isRecruiter) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json({ application });
  } catch (error) {
    console.error('Error fetching application:', error);
    return res.status(500).json({ message: 'Failed to fetch application' });
  }
}

async function updateApplicationStatus(req, res) {
  try {
    const { value, error } = updateApplicationStatusSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Validation failed', details: error.details });
    }

    const application = await Application.findById(req.params.id)
      .populate('job', 'postedBy');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is the recruiter who posted the job
    if (application.job.postedBy.toString() !== req.user.sub) {
      return res.status(403).json({ message: 'Access denied' });
    }

    application.status = value.status;
    if (value.notes) {
      application.notes = value.notes;
    }
    application.updatedAt = new Date();

    await application.save();

    // If application is shortlisted, check if we should close the job
    if (value.status === 'shortlisted') {
      const shortlistedCount = await Application.countDocuments({
        job: application.job._id,
        status: 'shortlisted'
      });
      
      // If this is the first shortlisted application, close the job
      if (shortlistedCount === 1) {
        await Job.findByIdAndUpdate(application.job._id, { 
          status: 'closed',
          updatedAt: new Date()
        });
      }
    }

    return res.json({ application });
  } catch (error) {
    console.error('Error updating application status:', error);
    return res.status(500).json({ message: 'Failed to update application status' });
  }
}

async function withdrawApplication(req, res) {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      applicant: req.user.sub
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status === 'withdrawn') {
      return res.status(400).json({ message: 'Application already withdrawn' });
    }

    application.status = 'withdrawn';
    application.updatedAt = new Date();
    await application.save();

    return res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    return res.status(500).json({ message: 'Failed to withdraw application' });
  }
}

async function downloadResume(req, res) {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'postedBy');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has permission to download this resume
    const isApplicant = application.applicant.toString() === req.user.sub;
    const isRecruiter = application.job.postedBy.toString() === req.user.sub;

    if (!isApplicant && !isRecruiter) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!application.resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const filePath = path.join(__dirname, '../../uploads/resumes', application.resume);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Resume file not found' });
    }

    res.download(filePath, `resume-${application.applicant}.pdf`);
  } catch (error) {
    console.error('Error downloading resume:', error);
    return res.status(500).json({ message: 'Failed to download resume' });
  }
}

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicationsForRecruiterJobs,
  getApplicationsForJob,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
  downloadResume
};
