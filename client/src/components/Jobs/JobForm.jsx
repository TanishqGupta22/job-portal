import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Card from '../Common/Card';
import jobService from '../../services/jobService';

const jobSchema = yup.object({
  title: yup.string().required('Job title is required').min(3, 'Title must be at least 3 characters'),
  company: yup.string().optional(),
  description: yup.string().required('Job description is required').min(50, 'Description must be at least 50 characters'),
  location: yup.string().required('Location is required'),
  skills: yup.array().of(yup.string()).min(1, 'At least one skill is required'),
  experience: yup.string().required('Experience level is required'),
  salaryMin: yup.number().min(0, 'Minimum salary must be positive'),
  salaryMax: yup.number().min(yup.ref('salaryMin'), 'Maximum salary must be greater than minimum'),
  jobType: yup.string().required('Job type is required'),
  deadline: yup.date().min(new Date(), 'Deadline must be in the future')
});

const JobForm = ({ job = null, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillsInput, setSkillsInput] = useState('');
  const [skills, setSkills] = useState(job?.skills || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(jobSchema),
    defaultValues: {
      title: job?.title || '',
      company: job?.company || '',
      description: job?.description || '',
      location: job?.location || '',
      experience: job?.experience || '',
      salaryMin: job?.salaryMin || '',
      salaryMax: job?.salaryMax || '',
      jobType: job?.jobType || '',
      deadline: job?.deadline ? new Date(job.deadline).toISOString().split('T')[0] : ''
    }
  });

  const addSkill = () => {
    const skill = skillsInput.trim();
    if (skill && !skills.includes(skill)) {
      const newSkills = [...skills, skill];
      setSkills(newSkills);
      setValue('skills', newSkills);
      setSkillsInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    const newSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(newSkills);
    setValue('skills', newSkills);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const jobData = {
        ...data,
        skills,
        salaryMin: data.salaryMin ? parseInt(data.salaryMin) : undefined,
        salaryMax: data.salaryMax ? parseInt(data.salaryMax) : undefined,
        deadline: data.deadline ? new Date(data.deadline) : undefined
      };

      if (job) {
        await jobService.updateJob(job._id, jobData);
      } else {
        await jobService.createJob(jobData);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card title={job ? 'Edit Job' : 'Create New Job'} className="job-form">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="form-row-2">
          <Input
            label="Job Title"
            placeholder="e.g., Senior React Developer"
            error={errors.title?.message}
            {...register('title')}
            required
          />
          <Input
            label="Company Name"
            placeholder="e.g., Tech Corp"
            error={errors.company?.message}
            {...register('company')}
          />
        </div>

        <div className="form-row">
          <label className="input-label">
            Job Description
            <span className="required">*</span>
          </label>
          <textarea
            className={`input-field ${errors.description ? 'input-error' : ''}`}
            placeholder="Describe the role, responsibilities, and requirements..."
            rows="6"
            {...register('description')}
          />
          {errors.description && (
            <span className="input-error-message">{errors.description.message}</span>
          )}
        </div>

        <div className="form-row-2">
          <Input
            label="Location"
            placeholder="e.g., New York, NY"
            error={errors.location?.message}
            {...register('location')}
            required
          />
          <div className="input-group">
            <label className="input-label">
              Experience Level
              <span className="required">*</span>
            </label>
            <select
              className={`input-field ${errors.experience ? 'input-error' : ''}`}
              {...register('experience')}
            >
              <option value="">Select experience level</option>
              <option value="entry">Entry Level (0-2 years)</option>
              <option value="mid">Mid Level (3-5 years)</option>
              <option value="senior">Senior Level (6-10 years)</option>
              <option value="lead">Lead/Principal (10+ years)</option>
            </select>
            {errors.experience && (
              <span className="input-error-message">{errors.experience.message}</span>
            )}
          </div>
        </div>

        <div className="form-row-2">
          <div className="input-group">
            <label className="input-label">
              Job Type
              <span className="required">*</span>
            </label>
            <select
              className={`input-field ${errors.jobType ? 'input-error' : ''}`}
              {...register('jobType')}
            >
              <option value="">Select job type</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="remote">Remote</option>
            </select>
            {errors.jobType && (
              <span className="input-error-message">{errors.jobType.message}</span>
            )}
          </div>
          <Input
            label="Application Deadline"
            type="date"
            error={errors.deadline?.message}
            {...register('deadline')}
          />
        </div>

        <div className="form-row-2">
          <Input
            label="Minimum Salary"
            type="number"
            placeholder="e.g., 50000"
            error={errors.salaryMin?.message}
            {...register('salaryMin')}
          />
          <Input
            label="Maximum Salary"
            type="number"
            placeholder="e.g., 80000"
            error={errors.salaryMax?.message}
            {...register('salaryMax')}
          />
        </div>

        <div className="form-row">
          <label className="input-label">
            Required Skills
            <span className="required">*</span>
          </label>
          <div className="skills-input">
            <input
              type="text"
              className="input-field skills-input-field"
              placeholder="Type a skill (e.g., React, JavaScript, Python)"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button 
              type="button" 
              onClick={addSkill} 
              variant="outline"
              disabled={!skillsInput.trim()}
            >
              Add Skill
            </Button>
          </div>
          {errors.skills && (
            <span className="input-error-message">{errors.skills.message}</span>
          )}
          {skills.length > 0 && (
            <div className="skills-section">
              <p className="skills-count">{skills.length} skill{skills.length !== 1 ? 's' : ''} added</p>
              <div className="skills-list">
                {skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="skill-remove"
                      title="Remove skill"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {job ? 'Update Job' : 'Create Job'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default JobForm;
