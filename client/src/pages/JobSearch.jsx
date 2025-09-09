import React, { useState, useEffect } from 'react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Input from '../components/Common/Input';
import JobCard from '../components/Jobs/JobCard';
import jobService from '../services/jobService';

const JobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    experience: '',
    jobType: '',
    salaryMin: '',
    salaryMax: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [savedJobs, setSavedJobs] = useState(new Set());

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (jobs.length > 0) {
      setJobs(sortJobs(jobs, sortBy));
    }
  }, [sortBy]);

  const loadJobs = async (searchFilters = {}) => {
    try {
      setLoading(true);
      const response = await jobService.getJobs({
        ...filters,
        ...searchFilters,
        status: 'active'
      });
      const jobsData = response.jobs || [];
      setJobs(sortJobs(jobsData, sortBy));
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortJobs = (jobsData, sortOption) => {
    const sortedJobs = [...jobsData];
    
    switch (sortOption) {
      case 'newest':
        return sortedJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return sortedJobs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'salary-high':
        return sortedJobs.sort((a, b) => {
          const salaryA = a.salaryMax || a.salaryMin || 0;
          const salaryB = b.salaryMax || b.salaryMin || 0;
          return salaryB - salaryA;
        });
      case 'salary-low':
        return sortedJobs.sort((a, b) => {
          const salaryA = a.salaryMin || a.salaryMax || 0;
          const salaryB = b.salaryMin || b.salaryMax || 0;
          return salaryA - salaryB;
        });
      case 'relevance':
        // For relevance, we could implement a scoring system based on search terms
        // For now, just return as-is (newest first)
        return sortedJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      default:
        return sortedJobs;
    }
  };

  const handleSearch = () => {
    loadJobs();
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setJobs(sortJobs(jobs, newSortBy));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveJob = async (jobId) => {
    try {
      await jobService.saveJob(jobId);
      setSavedJobs(prev => new Set([...prev, jobId]));
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleApplyJob = (job) => {
    // This will be handled by the JobCard component
    console.log('Apply to job:', job);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      experience: '',
      jobType: '',
      salaryMin: '',
      salaryMax: ''
    });
    loadJobs({
      search: '',
      location: '',
      experience: '',
      jobType: '',
      salaryMin: '',
      salaryMax: ''
    });
  };

  return (
    <div className="job-search">
      <div className="search-header">
        <h1>Find Your Dream Job</h1>
        <p>Discover opportunities that match your skills and interests</p>
      </div>

      {/* Search and Filters */}
      <Card className="search-filters">
        <div className="search-bar">
          <Input
            placeholder="Search jobs by title, company, or keywords..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} loading={loading}>
            Search
          </Button>
        </div>

        <div className="filters-grid">
          <Input
            label="Location"
            placeholder="City, State, or Remote"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
          />
          
          <div className="input-group">
            <label className="input-label">Experience Level</label>
            <select
              className="input-field"
              value={filters.experience}
              onChange={(e) => handleFilterChange('experience', e.target.value)}
            >
              <option value="">Any Experience</option>
              <option value="entry">Entry Level (0-2 years)</option>
              <option value="mid">Mid Level (3-5 years)</option>
              <option value="senior">Senior Level (6-10 years)</option>
              <option value="lead">Lead/Principal (10+ years)</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Job Type</label>
            <select
              className="input-field"
              value={filters.jobType}
              onChange={(e) => handleFilterChange('jobType', e.target.value)}
            >
              <option value="">Any Type</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          <div className="salary-range">
            <Input
              label="Min Salary"
              type="number"
              placeholder="e.g., 50000"
              value={filters.salaryMin}
              onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
            />
            <Input
              label="Max Salary"
              type="number"
              placeholder="e.g., 100000"
              value={filters.salaryMax}
              onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-actions">
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button onClick={handleSearch} loading={loading}>
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* Results */}
      <div className="search-results">
        <div className="results-header">
          <h2>
            {loading ? 'Searching...' : `${jobs.length} Jobs Found`}
          </h2>
          <div className="sort-options">
            <select 
              className="input-field"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="salary-high">Salary: High to Low</option>
              <option value="salary-low">Salary: Low to High</option>
              <option value="relevance">Most Relevant</option>
            </select>
          </div>
        </div>

        <div className="jobs-grid">
          {jobs.length === 0 && !loading ? (
            <Card className="empty-state">
              <div className="empty-content">
                <h3>No jobs found</h3>
                <p>Try adjusting your search criteria or browse all available positions.</p>
                <Button onClick={clearFilters}>
                  View All Jobs
                </Button>
              </div>
            </Card>
          ) : (
            jobs.map(job => (
              <JobCard
                key={job._id}
                job={job}
                isOwner={false}
                onApply={handleApplyJob}
                onSave={handleSaveJob}
                isSaved={savedJobs.has(job._id)}
              />
            ))
          )}
        </div>

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner">Loading jobs...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSearch;
