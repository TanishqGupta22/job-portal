import React, { useState } from 'react';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Card from '../Common/Card';
import applicationService from '../../services/applicationService';
import { useToast } from '../../context/ToastContext';
import './ApplicationReviewModal.css';

const ApplicationReviewModal = ({ 
  isOpen, 
  onClose, 
  applications, 
  job, 
  onApplicationUpdate 
}) => {
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { success, error } = useToast();

  const handleApplicationSelect = (application) => {
    setSelectedApplication(application);
    setReviewNotes(application.notes || '');
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedApplication) return;

    setIsUpdating(true);
    try {
      await applicationService.updateApplicationStatus(
        selectedApplication._id, 
        status, 
        reviewNotes
      );
      
      success(`Application ${status === 'shortlisted' ? 'shortlisted' : 'rejected'} successfully!`);
      
      // Update the application in the list
      const updatedApplications = applications.map(app => 
        app._id === selectedApplication._id 
          ? { ...app, status, notes: reviewNotes }
          : app
      );
      
      onApplicationUpdate(updatedApplications);
      setSelectedApplication(null);
      setReviewNotes('');
    } catch (err) {
      console.error('Error updating application status:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update application status. Please try again.';
      error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadResume = async (applicationId) => {
    try {
      const blob = await applicationService.downloadResume(applicationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${selectedApplication.applicant.name || 'applicant'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading resume:', err);
      error('Failed to download resume. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'info';
      case 'under_review': return 'warning';
      case 'shortlisted': return 'success';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'applied': return 'Applied';
      case 'under_review': return 'Under Review';
      case 'shortlisted': return 'Shortlisted';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review Applications - ${job?.title}`}
      size="xl"
    >
      <div className="application-review">
        <div className="review-layout">
          {/* Applications List */}
          <div className="applications-sidebar">
            <h3>Applications ({applications.length})</h3>
            <div className="applications-list">
              {applications.map(application => (
                <Card
                  key={application._id}
                  className={`application-item ${selectedApplication?._id === application._id ? 'selected' : ''}`}
                  onClick={() => handleApplicationSelect(application)}
                >
                  <div className="application-summary">
                    <h4>{application.applicant?.name || 'Unknown Applicant'}</h4>
                    <p className="applicant-email">{application.applicant?.email}</p>
                    <p className="application-date">Applied: {formatDate(application.appliedAt)}</p>
                    <span className={`status-badge status-${getStatusColor(application.status)}`}>
                      {getStatusText(application.status)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Application Details */}
          <div className="application-details">
            {selectedApplication ? (
              <div className="details-content">
                <div className="applicant-header">
                  <h2>{selectedApplication.applicant?.name || 'Unknown Applicant'}</h2>
                  <p className="applicant-email">{selectedApplication.applicant?.email}</p>
                  <div className="application-meta">
                    <span>Applied: {formatDate(selectedApplication.appliedAt)}</span>
                    <span className={`status-badge status-${getStatusColor(selectedApplication.status)}`}>
                      {getStatusText(selectedApplication.status)}
                    </span>
                  </div>
                </div>

                <div className="application-content">
                  {/* Resume Section */}
                  <Card className="content-section">
                    <h3>Resume</h3>
                    {selectedApplication.resume ? (
                      <div className="resume-section">
                        <p>Resume file: {selectedApplication.resume}</p>
                        <Button
                          variant="outline"
                          onClick={() => handleDownloadResume(selectedApplication._id)}
                        >
                          📄 Download Resume
                        </Button>
                      </div>
                    ) : (
                      <p className="no-resume">No resume uploaded</p>
                    )}
                  </Card>

                  {/* Cover Letter */}
                  {selectedApplication.coverLetter && (
                    <Card className="content-section">
                      <h3>Cover Letter</h3>
                      <div className="cover-letter">
                        {selectedApplication.coverLetter}
                      </div>
                    </Card>
                  )}

                  {/* Experience */}
                  {selectedApplication.experience && (
                    <Card className="content-section">
                      <h3>Relevant Experience</h3>
                      <div className="experience">
                        {selectedApplication.experience}
                      </div>
                    </Card>
                  )}

                  {/* Skills */}
                  {selectedApplication.skills && selectedApplication.skills.length > 0 && (
                    <Card className="content-section">
                      <h3>Skills</h3>
                      <div className="skills-list">
                        {selectedApplication.skills.map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Review Notes */}
                  <Card className="content-section">
                    <h3>Review Notes</h3>
                    <textarea
                      className="input-field"
                      rows="4"
                      placeholder="Add your review notes here..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                  </Card>

                  {/* Action Buttons */}
                  <div className="review-actions">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedApplication(null)}
                    >
                      Back to List
                    </Button>
                    <div className="status-actions">
                      <Button
                        variant="danger"
                        onClick={() => handleStatusUpdate('rejected')}
                        loading={isUpdating}
                        disabled={selectedApplication.status === 'rejected'}
                      >
                        Reject Application
                      </Button>
                      <Button
                        variant="success"
                        onClick={() => handleStatusUpdate('shortlisted')}
                        loading={isUpdating}
                        disabled={selectedApplication.status === 'shortlisted'}
                      >
                        Shortlist Candidate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <h3>Select an application to review</h3>
                <p>Choose an application from the list to view details and make a decision.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ApplicationReviewModal;
