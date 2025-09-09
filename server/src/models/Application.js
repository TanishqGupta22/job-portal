const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['applied', 'under_review', 'shortlisted', 'rejected', 'withdrawn'], default: 'applied' },
    coverLetter: { type: String },
    experience: { type: String },
    skills: { type: [String], default: [] },
    resume: { type: String },
    notes: { type: String },
  },
  { timestamps: { createdAt: 'appliedAt', updatedAt: 'updatedAt' } }
);

// Define indexes separately to avoid duplicates
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ job: 1 });
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ status: 1 });

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;


