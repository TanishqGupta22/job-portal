import React, { useEffect, useState } from 'react';
import Card from '../Common/Card';
import Button from '../Common/Button';
import ApplicationForm from './ApplicationForm';
import ApplicationReviewModal from './ApplicationReviewModal';
import Modal from '../Common/Modal';
import applicationService from '../../services/applicationService';

const JobCard = ({ 
  job, 
  showActions = true, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onViewApplications,
  isOwner = false 
}) => {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState('');
  const [applicationCount, setApplicationCount] = useState(job.applicationCount || 0);

  useEffect(() => {
    setApplicationCount(job.applicationCount || 0);
  }, [job.applicationCount]);

  const fetchApplications = async () => {
    if (!isOwner) return;
    try {
      setApplicationsLoading(true);
      setApplicationsError('');
      const { applications } = await applicationService.getApplicationsForJob(job._id);
      setApplications(applications || []);
      setApplicationCount((applications || []).length);
    } catch (e) {
      setApplicationsError('Failed to load applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const fetchApplicationCount = async () => {
    if (!isOwner) return;
    try {
      const { applications } = await applicationService.getApplicationsForJob(job._id);
      setApplicationCount((applications || []).length);
    } catch (e) {
      // silently ignore
    }
  };

  const handleApplicationUpdate = (updatedApplications) => {
    setApplications(updatedApplications);
    setApplicationCount(updatedApplications.length);
  };

  useEffect(() => {
    if (showApplications) {
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showApplications]);
  const formatSalary = (min, max) => {
    if (!min && !max) return 'Salary not specified';
    if (!min) return `Up to $${max?.toLocaleString()}`;
    if (!max) return `From $${min?.toLocaleString()}`;
    return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'closed': return 'danger';
      default: return 'secondary';
    }
  };

  const getExperienceText = (experience) => {
    switch (experience) {
      case 'entry': return 'Entry Level (0-2 years)';
      case 'mid': return 'Mid Level (3-5 years)';
      case 'senior': return 'Senior Level (6-10 years)';
      case 'lead': return 'Lead/Principal (10+ years)';
      default: return experience;
    }
  };

  return (
    <Card className="job-card" hover>
      <div className="job-header">
        <div className="job-title-section">
          <h3 className="job-title">{job.title}</h3>
          <div className="job-meta">
            <span className="job-location">📍 {job.location}</span>
            <span className="job-type">{job.jobType}</span>
            <span className="job-experience">{getExperienceText(job.experience)}</span>
          </div>
        </div>
        <div className="job-status">
          <span className={`status-badge status-${job.status}`}>
            {job.status}
          </span>
        </div>
      </div>

      <div className="job-content">
        <p className="job-description">
          {job.description.length > 200 
            ? `${job.description.substring(0, 200)}...` 
            : job.description
          }
        </p>
        
        <div className="job-details">
          <div className="job-salary">
            💰 {formatSalary(job.salaryMin, job.salaryMax)}
          </div>
          {job.deadline && (
            <div className="job-deadline">
              📅 Deadline: {formatDate(job.deadline)}
            </div>
          )}
        </div>

        <div className="job-skills">
          {job.skills?.slice(0, 5).map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill}
            </span>
          ))}
          {job.skills?.length > 5 && (
            <span className="skill-more">
              +{job.skills.length - 5} more
            </span>
          )}
        </div>
      </div>

      {showActions && (
        <div className="job-actions">
          {isOwner ? (
            <div className="owner-actions">
              <Button
                size="small"
                variant="outline"
                onClick={() => setShowApplications(true)}
              >
                View Applications ({applicationCount})
              </Button>
              <Button
                size="small"
                variant="outline"
                onClick={() => onEdit?.(job)}
              >
                Edit
              </Button>
              <Button
                size="small"
                variant={job.status === 'active' ? 'warning' : 'success'}
                onClick={() => onToggleStatus?.(job._id, job.status === 'active' ? 'paused' : 'active')}
              >
                {job.status === 'active' ? 'Pause' : 'Activate'}
              </Button>
              <Button
                size="small"
                variant="danger"
                onClick={() => onDelete?.(job._id)}
              >
                Delete
              </Button>
            </div>
          ) : (
            <div className="applicant-actions">
              <Button
                size="small"
                variant="primary"
                onClick={() => setShowApplicationForm(true)}
              >
                Apply Now
              </Button>
              <Button
                size="small"
                variant="ghost"
                onClick={() => {/* Handle save */}}
              >
                💾 Save
              </Button>
            </div>
          )}
        </div>
      )}

      <ApplicationForm
        job={job}
        isOpen={showApplicationForm}
        onClose={() => setShowApplicationForm(false)}
        onSuccess={() => {
          setShowApplicationForm(false);
          // Refresh application count after successful apply
          fetchApplicationCount();
        }}
      />

      {/* Applications Review Modal for owners */}
      {isOwner && (
        <ApplicationReviewModal
          isOpen={showApplications}
          onClose={() => setShowApplications(false)}
          applications={applications}
          job={job}
          onApplicationUpdate={handleApplicationUpdate}
        />
      )}
    </Card>
  );
};

export default JobCard;
