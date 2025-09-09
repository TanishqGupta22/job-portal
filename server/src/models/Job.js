const mongoose = require('mongoose');

const salaryRangeSchema = new mongoose.Schema(
  {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    location: { type: String, required: true },
    jobType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'], default: 'full-time' },
    experience: { type: String, enum: ['entry', 'mid', 'senior', 'lead'], default: 'entry' },
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    salaryRange: salaryRangeSchema, // Keep for backward compatibility
    skills: [{ type: String }],
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'paused', 'closed'], default: 'active' },
    deadline: { type: Date },
  },
  { timestamps: true }
);

// Define indexes separately to avoid duplicates
jobSchema.index({ title: 'text', description: 'text', company: 'text', location: 'text', skills: 'text' });
jobSchema.index({ title: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ experience: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ skills: 1 });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;


