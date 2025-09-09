const Joi = require('joi');

const email = Joi.string().trim().lowercase().email().required();
const password = Joi.string()
  .min(8)
  .max(128)
  .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&()_+\-={}:;"'.,<>\[\]`~\\/|^]{8,}$/)
  .message('Password must be at least 8 chars and include letters and numbers.')
  .required();
const role = Joi.string().valid('job_seeker', 'recruiter').required();
const name = Joi.string().min(2).max(120).required();
// OTP and reset flows removed for simplified auth

const registerSchema = Joi.object({ email, password, role, name });
const loginSchema = Joi.object({ email, password });
// removed verify/resend/forgot/reset schemas

const profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(120),
  avatar: Joi.string().uri(),
  resumeUrl: Joi.string().uri(),
  companyName: Joi.string().max(160),
  location: Joi.string().max(160),
  skills: Joi.array().items(Joi.string().max(50)).max(50),
  experience: Joi.number().integer().min(0).max(60),
}).min(1);

module.exports = {
  registerSchema,
  loginSchema,
  profileUpdateSchema,
};


