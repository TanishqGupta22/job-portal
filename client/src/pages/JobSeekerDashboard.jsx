import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import JobCard from '../components/Jobs/JobCard';
import applicationService from '../services/applicationService';
import jobService from '../services/jobService';

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applications');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [applicationsData, savedJobsData, recommendationsData] = await Promise.all([
        applicationService.getMyApplications(),
        jobService.getSavedJobs(),
        jobService.getJobRecommendations()
      ]);
      setApplications(applicationsData.applications || []);
      setSavedJobs(savedJobsData.jobs || []);
      setRecommendations(recommendationsData.jobs || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'info';
      case 'under_review': return 'warning';
      case 'shortlisted': return 'success';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const getApplicationStatusText = (status) => {
    switch (status) {
      case 'applied': return 'Applied';
      case 'under_review': return 'Under Review';
      case 'shortlisted': return 'Shortlisted';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const sortApplications = (apps, sortOption) => {
    const sortedApps = [...apps];
    
    switch (sortOption) {
      case 'newest':
        return sortedApps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      case 'oldest':
        return sortedApps.sort((a, b) => new Date(a.appliedAt) - new Date(b.appliedAt));
      case 'status':
        return sortedApps.sort((a, b) => {
          const statusOrder = { 'applied': 1, 'under_review': 2, 'shortlisted': 3, 'rejected': 4 };
          return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        });
      default:
        return sortedApps;
    }
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setApplications(sortApplications(applications, newSortBy));
  };

  const handleWithdrawApplication = async (applicationId) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      try {
        await applicationService.withdrawApplication(applicationId);
        loadDashboardData();
      } catch (error) {
        console.error('Error withdrawing application:', error);
      }
    }
  };

  const handleUnsaveJob = async (jobId) => {
    try {
      // Assuming there's an unsave endpoint
      await jobService.saveJob(jobId); // Toggle save/unsave
      loadDashboardData();
    } catch (error) {
      console.error('Error unsaving job:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="job-seeker-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name}</h1>
        <p>Track your applications and discover new opportunities</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-content">
            <h3>{applications.length}</h3>
            <p>Total Applications</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <h3>{applications.filter(app => app.status === 'under_review').length}</h3>
            <p>Under Review</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <h3>{applications.filter(app => app.status === 'shortlisted').length}</h3>
            <p>Shortlisted</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <h3>{savedJobs.length}</h3>
            <p>Saved Jobs</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          My Applications ({applications.length})
        </button>
        <button
          className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved Jobs ({savedJobs.length})
        </button>
        <button
          className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations ({recommendations.length})
        </button>
      </div>

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="applications-section">
          {applications.length > 0 && (
            <div className="section-header">
              <h2>My Applications ({applications.length})</h2>
              <div className="sort-options">
                <select 
                  className="input-field"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="status">By Status</option>
                </select>
              </div>
            </div>
          )}
          {applications.length === 0 ? (
            <Card className="empty-state">
              <div className="empty-content">
                <h3>No applications yet</h3>
                <p>Start applying to jobs to track your progress here.</p>
                <Button onClick={() => window.location.href = '/jobs'}>
                  Browse Jobs
                </Button>
              </div>
            </Card>
          ) : (
            <div className="applications-list">
              {applications.map(application => (
                <Card key={application._id} className="application-card">
                  <div className="application-header">
                    <div className="application-info">
                      <h3>{application.job.title}</h3>
                      <p className="company">{application.job.company}</p>
                      <p className="location">📍 {application.job.location}</p>
                    </div>
                    <div className="application-status">
                      <span className={`status-badge status-${getApplicationStatusColor(application.status)}`}>
                        {getApplicationStatusText(application.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="application-details">
                    <p><strong>Applied:</strong> {formatDate(application.appliedAt)}</p>
                    {application.coverLetter && (
                      <p><strong>Cover Letter:</strong> {application.coverLetter.substring(0, 100)}...</p>
                    )}
                  </div>

                  <div className="application-actions">
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => window.open(`/jobs/${application.job._id}`, '_blank')}
                    >
                      View Job
                    </Button>
                    {application.status === 'applied' && (
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => handleWithdrawApplication(application._id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved Jobs Tab */}
      {activeTab === 'saved' && (
        <div className="saved-jobs-section">
          {savedJobs.length === 0 ? (
            <Card className="empty-state">
              <div className="empty-content">
                <h3>No saved jobs</h3>
                <p>Save jobs you're interested in to view them here.</p>
                <Button onClick={() => window.location.href = '/jobs'}>
                  Browse Jobs
                </Button>
              </div>
            </Card>
          ) : (
            <div className="jobs-grid">
              {savedJobs.map(job => (
                <JobCard
                  key={job._id}
                  job={job}
                  isOwner={false}
                  isSaved={true}
                  onUnsave={handleUnsaveJob}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="recommendations-section">
          {recommendations.length === 0 ? (
            <Card className="empty-state">
              <div className="empty-content">
                <h3>No recommendations yet</h3>
                <p>Complete your profile to get personalized job recommendations.</p>
                <Button onClick={() => window.location.href = '/profile'}>
                  Complete Profile
                </Button>
              </div>
            </Card>
          ) : (
            <div className="jobs-grid">
              {recommendations.map(job => (
                <JobCard
                  key={job._id}
                  job={job}
                  isOwner={false}
                  showRecommendationBadge={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobSeekerDashboard;
