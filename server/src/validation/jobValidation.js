const Joi = require('joi');

const id = Joi.string().regex(/^[a-f\d]{24}$/i);

const salarySchema = Joi.object({
  min: Joi.number().min(0).default(0),
  max: Joi.number().min(Joi.ref('min')).default(0),
});

const createJobSchema = Joi.object({
  title: Joi.string().min(3).max(120).required(),
  company: Joi.string().min(1).max(100).allow('').optional(),
  description: Joi.string().min(10).max(20000).required(),
  location: Joi.string().min(2).max(120).required(),
  jobType: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'remote').required(),
  experience: Joi.string().valid('entry', 'mid', 'senior', 'lead').required(),
  salaryMin: Joi.number().min(0).allow(null, '').optional(),
  salaryMax: Joi.number().min(0).allow(null, '').optional(),
  skills: Joi.array().items(Joi.string().min(1).max(50)).min(1).max(50).required(),
  status: Joi.string().valid('active', 'paused', 'closed').default('active'),
  deadline: Joi.date().allow(null, '').optional(),
}).custom((value, helpers) => {
  // Custom validation for salary range
  if (value.salaryMin && value.salaryMax && value.salaryMin > value.salaryMax) {
    return helpers.error('salary.range');
  }
  return value;
});

const updateJobSchema = createJobSchema.fork(['title', 'description', 'location'], (s) => s.optional());

const applyJobSchema = Joi.object({
  coverLetter: Joi.string().max(5000).allow('').default(''),
  experience: Joi.string().max(1000).optional(),
  skills: Joi.array().items(Joi.string()).optional(),
});

const updateApplicationStatusSchema = Joi.object({
  status: Joi.string().valid('applied', 'under_review', 'shortlisted', 'rejected', 'withdrawn').required(),
  notes: Joi.string().max(1000).allow('').optional(),
});

const updateJobStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'paused', 'closed').required(),
});

module.exports = { 
  createJobSchema, 
  updateJobSchema, 
  applyJobSchema, 
  updateApplicationStatusSchema,
  updateJobStatusSchema,
  id 
};


