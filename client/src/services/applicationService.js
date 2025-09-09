import api from './api';

// Application Services
export const applicationService = {
  // Apply to a job
  applyToJob: async (jobId, applicationData) => {
    const formData = new FormData();
    
    // Add text fields
    formData.append('coverLetter', applicationData.coverLetter || '');
    formData.append('experience', applicationData.experience || '');
    formData.append('skills', JSON.stringify(applicationData.skills || []));
    
    // Add resume file if provided
    if (applicationData.resume) {
      formData.append('resume', applicationData.resume);
    }
    
    const response = await api.post(`/jobs/${jobId}/apply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get my applications (job seeker only)
  getMyApplications: async () => {
    const response = await api.get('/applications/me');
    return response.data;
  },

  // Get applications for my jobs (recruiter only)
  getApplicationsForMyJobs: async () => {
    const response = await api.get('/applications/recruiter');
    return response.data;
  },

  // Get applications for specific job (recruiter only)
  getApplicationsForJob: async (jobId) => {
    const response = await api.get(`/applications/job/${jobId}`);
    return response.data;
  },

  // Update application status (recruiter only)
  updateApplicationStatus: async (applicationId, status, notes = '') => {
    const response = await api.patch(`/applications/${applicationId}/status`, {
      status,
      notes
    });
    return response.data;
  },

  // Withdraw application (job seeker only)
  withdrawApplication: async (applicationId) => {
    const response = await api.delete(`/applications/${applicationId}`);
    return response.data;
  },

  // Get application details
  getApplicationById: async (applicationId) => {
    const response = await api.get(`/applications/${applicationId}`);
    return response.data;
  },

  // Download resume
  downloadResume: async (applicationId) => {
    const response = await api.get(`/applications/${applicationId}/resume`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default applicationService;
