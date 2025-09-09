import api from './api';

// Job Services
export const jobService = {
  // Get all jobs with optional filters
  getJobs: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.location) params.append('location', filters.location);
    if (filters.skills) params.append('skills', filters.skills);
    if (filters.experience) params.append('experience', filters.experience);
    if (filters.salaryMin) params.append('salaryMin', filters.salaryMin);
    if (filters.salaryMax) params.append('salaryMax', filters.salaryMax);
    if (filters.jobType) params.append('jobType', filters.jobType);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/jobs?${params.toString()}`);
    return response.data;
  },

  // Get single job by ID
  getJobById: async (jobId) => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  // Create new job (recruiter only)
  createJob: async (jobData) => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  // Update job (recruiter only)
  updateJob: async (jobId, jobData) => {
    const response = await api.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  // Delete job (recruiter only)
  deleteJob: async (jobId) => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },

  // Get my posted jobs (recruiter only)
  getMyJobs: async () => {
    const response = await api.get('/jobs/me');
    return response.data;
  },

  // Update job status (recruiter only)
  updateJobStatus: async (jobId, status) => {
    const response = await api.patch(`/jobs/${jobId}/status`, { status });
    return response.data;
  },

  // Get job statistics (recruiter only)
  getJobStats: async () => {
    const response = await api.get('/jobs/stats');
    return response.data;
  },

  // Save/unsave job (job seeker only)
  saveJob: async (jobId) => {
    const response = await api.post(`/jobs/${jobId}/save`);
    return response.data;
  },

  // Get saved jobs (job seeker only)
  getSavedJobs: async () => {
    const response = await api.get('/jobs/saved');
    return response.data;
  },

  // Get job recommendations (job seeker only)
  getJobRecommendations: async () => {
    const response = await api.get('/jobs/recommendations');
    return response.data;
  }
};

export default jobService;
