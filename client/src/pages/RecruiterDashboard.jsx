import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import JobCard from '../components/Jobs/JobCard';
import JobForm from '../components/Jobs/JobForm';
import Modal from '../components/Common/Modal';
import jobService from '../services/jobService';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [jobsData, statsData] = await Promise.all([
        jobService.getMyJobs(),
        jobService.getJobStats()
      ]);
      setJobs(jobsData.jobs || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = () => {
    setEditingJob(null);
    setShowJobForm(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowJobForm(true);
  };

  const handleJobFormSuccess = () => {
    setShowJobForm(false);
    setEditingJob(null);
    loadDashboardData();
  };

  const handleJobFormCancel = () => {
    setShowJobForm(false);
    setEditingJob(null);
  };

  const handleToggleStatus = async (jobId, newStatus) => {
    try {
      await jobService.updateJobStatus(jobId, newStatus);
      loadDashboardData();
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await jobService.deleteJob(jobId);
        loadDashboardData();
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  };

  const handleViewApplications = (jobId) => {
    // Navigate to applications page
    console.log('View applications for job:', jobId);
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  const getStatusCount = (status) => {
    return jobs.filter(job => job.status === status).length;
  };

  const sortJobs = (jobsData, sortOption) => {
    const sortedJobs = [...jobsData];
    
    switch (sortOption) {
      case 'newest':
        return sortedJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return sortedJobs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'applications':
        return sortedJobs.sort((a, b) => (b.applicationCount || 0) - (a.applicationCount || 0));
      case 'title':
        return sortedJobs.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sortedJobs;
    }
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setJobs(sortJobs(jobs, newSortBy));
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="recruiter-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name}</h1>
        <p>Manage your job postings and track applications</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-content">
            <h3>{stats.totalJobs || 0}</h3>
            <p>Total Jobs</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <h3>{stats.activeJobs || 0}</h3>
            <p>Active Jobs</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <h3>{stats.totalApplications || 0}</h3>
            <p>Total Applications</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <h3>{stats.pendingApplications || 0}</h3>
            <p>Pending Reviews</p>
          </div>
        </Card>
      </div>

      {/* Job Management */}
      <div className="jobs-section">
        <div className="section-header">
          <h2>Your Job Postings</h2>
          <div className="header-actions">
            <div className="sort-options">
              <select 
                className="input-field"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="applications">Most Applications</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
            <Button onClick={handleCreateJob}>
              + Create New Job
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({jobs.length})
          </button>
          <button
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({getStatusCount('active')})
          </button>
          <button
            className={`filter-tab ${filter === 'paused' ? 'active' : ''}`}
            onClick={() => setFilter('paused')}
          >
            Paused ({getStatusCount('paused')})
          </button>
          <button
            className={`filter-tab ${filter === 'closed' ? 'active' : ''}`}
            onClick={() => setFilter('closed')}
          >
            Closed ({getStatusCount('closed')})
          </button>
        </div>

        {/* Jobs List */}
        <div className="jobs-grid">
          {filteredJobs.length === 0 ? (
            <Card className="empty-state">
              <div className="empty-content">
                <h3>No jobs found</h3>
                <p>
                  {filter === 'all' 
                    ? "You haven't posted any jobs yet. Create your first job posting to get started."
                    : `No ${filter} jobs found.`
                  }
                </p>
                {filter === 'all' && (
                  <Button onClick={handleCreateJob}>
                    Create Your First Job
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            filteredJobs.map(job => (
              <JobCard
                key={job._id}
                job={job}
                isOwner={true}
                onEdit={handleEditJob}
                onDelete={handleDeleteJob}
                onToggleStatus={handleToggleStatus}
                onViewApplications={handleViewApplications}
              />
            ))
          )}
        </div>
      </div>

      {/* Job Form Modal */}
      <Modal
        isOpen={showJobForm}
        onClose={handleJobFormCancel}
        title={editingJob ? 'Edit Job' : 'Create New Job'}
        size="large"
      >
        <JobForm
          job={editingJob}
          onSuccess={handleJobFormSuccess}
          onCancel={handleJobFormCancel}
        />
      </Modal>
    </div>
  );
};

export default RecruiterDashboard;
