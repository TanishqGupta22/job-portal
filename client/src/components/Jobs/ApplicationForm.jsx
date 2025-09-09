import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Card from '../Common/Card';
import Modal from '../Common/Modal';
import { useToast } from '../../context/ToastContext';
import applicationService from '../../services/applicationService';

const applicationSchema = yup.object({
  coverLetter: yup.string().max(2000, 'Cover letter must be less than 2000 characters'),
  experience: yup.string().max(1000, 'Experience description must be less than 1000 characters'),
});

const ApplicationForm = ({ job, isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const { success, error } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(applicationSchema),
    defaultValues: {
      coverLetter: '',
      experience: ''
    }
  });

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !skills.includes(skill)) {
      setSkills(prev => [...prev, skill]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
    } else {
      alert('Please select a PDF file for your resume.');
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const applicationData = {
        ...data,
        skills,
        resume: resumeFile
      };

      console.log('Submitting application:', { jobId: job._id, data: applicationData });
      const result = await applicationService.applyToJob(job._id, applicationData);
      console.log('Application submitted successfully:', result);
      success('Application submitted successfully!');
      onSuccess?.();
      onClose();
      reset();
      setSkills([]);
      setResumeFile(null);
    } catch (err) {
      console.error('Error submitting application:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit application. Please try again.';
      error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSkills([]);
    setResumeFile(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Apply to ${job?.title}`}
      size="large"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="job-summary">
          <h3 className="job-title">{job?.title}</h3>
          <p className="job-company">{job?.company}</p>
          <p className="job-location">📍 {job?.location}</p>
        </div>

        <div className="form-row">
          <label className="input-label">
            Resume (PDF)
            <span className="required">*</span>
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="input-field"
            required
          />
          {resumeFile && (
            <p className="file-selected">Selected: {resumeFile.name}</p>
          )}
        </div>

        <div className="form-row">
          <label className="input-label">
            Cover Letter
          </label>
          <textarea
            className={`input-field ${errors.coverLetter ? 'input-error' : ''}`}
            placeholder="Write a brief cover letter explaining why you're interested in this position..."
            rows="4"
            {...register('coverLetter')}
          />
          {errors.coverLetter && (
            <span className="input-error-message">{errors.coverLetter.message}</span>
          )}
        </div>

        <div className="form-row">
          <label className="input-label">
            Relevant Experience
          </label>
          <textarea
            className={`input-field ${errors.experience ? 'input-error' : ''}`}
            placeholder="Describe your relevant experience for this role..."
            rows="3"
            {...register('experience')}
          />
          {errors.experience && (
            <span className="input-error-message">{errors.experience.message}</span>
          )}
        </div>

        <div className="form-row">
          <label className="input-label">
            Skills
          </label>
          <div className="skills-input">
            <input
              type="text"
              className="input-field"
              placeholder="Add a skill (e.g., React, JavaScript)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <Button
              type="button"
              onClick={addSkill}
              variant="outline"
              disabled={!skillInput.trim()}
            >
              Add
            </Button>
          </div>
          {skills.length > 0 && (
            <div className="skills-list">
              {skills.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="skill-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!resumeFile}>
            Submit Application
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ApplicationForm;
