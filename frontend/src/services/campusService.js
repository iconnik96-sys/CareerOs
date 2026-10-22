import axios from 'axios';

const FASTAPI_BASE_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: FASTAPI_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

function extractErrorMessage(err, defaultMsg = 'An unexpected campus service error occurred') {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.detail) {
      return err.response.data.detail;
    }
    if (err.response?.status === 404) {
      return 'The requested campus resource was not found.';
    }
    if (err.response?.status === 401 || err.response?.status === 403) {
      return 'Unauthorized: you do not have permission to access this campus resource.';
    }
  }
  return err?.message || defaultMsg;
}

export const campusService = {
  // Module 1: Executive Overview
  async getOverview(institutionId = null) {
    try {
      const res = await client.get('/api/campus/overview', {
        params: institutionId ? { institution_id: institutionId } : {}
      });
      return res.data;
    } catch (err) {
      console.error('Error fetching campus overview:', err);
      throw new Error(extractErrorMessage(err, 'Failed to fetch campus overview metrics'));
    }
  },

  // Module 2: Skill Gap Heatmap
  async getSkillsMatrix(institutionId = null) {
    try {
      const res = await client.get('/api/campus/skills-matrix', {
        params: institutionId ? { institution_id: institutionId } : {}
      });
      return res.data;
    } catch (err) {
      console.error('Error fetching skills matrix:', err);
      throw new Error(extractErrorMessage(err, 'Failed to fetch department skills matrix'));
    }
  },

  // Module 3 & 4: Filterable Students & Screener
  async getStudents(filters = {}) {
    try {
      const res = await client.get('/api/campus/students', { params: filters });
      return res.data;
    } catch (err) {
      console.error('Error fetching campus students:', err);
      throw new Error(extractErrorMessage(err, 'Failed to fetch candidate roster'));
    }
  },

  // Module 4: 360° Student Drilldown
  async getStudentDrilldown(studentId) {
    try {
      const res = await client.get(`/api/campus/students/${studentId}/drilldown`);
      return res.data;
    } catch (err) {
      console.error(`Error fetching drilldown for student ${studentId}:`, err);
      throw new Error(extractErrorMessage(err, 'Failed to load student analysis portfolio'));
    }
  },

  // TPO Tagging
  async updateStudentTag(studentId, tag, action = 'add') {
    try {
      const res = await client.post(`/api/campus/students/${studentId}/tag`, { tag, action });
      return res.data;
    } catch (err) {
      console.error('Error updating candidate tag:', err);
      throw new Error(extractErrorMessage(err, 'Failed to update candidate tag'));
    }
  },

  // 1-Click CSV Export URL
  getCsvExportUrl(filters = {}) {
    const params = new URLSearchParams();
    if (filters.branch && filters.branch !== 'all') params.append('branch', filters.branch);
    if (filters.min_cgpa) params.append('min_cgpa', filters.min_cgpa);
    if (filters.min_ats) params.append('min_ats', filters.min_ats);
    if (filters.readiness && filters.readiness !== 'all') params.append('readiness', filters.readiness);
    if (filters.institution_id) params.append('institution_id', filters.institution_id);
    return `${FASTAPI_BASE_URL}/api/campus/export-csv?${params.toString()}`;
  },

  // Method C: Admin Provisioning
  async adminInviteTpo(payload) {
    try {
      const res = await client.post('/api/campus/admin/invite-tpo', payload);
      return res.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to provision college invite'));
    }
  },

  async adminListColleges() {
    try {
      const res = await client.get('/api/campus/admin/colleges');
      return res.data;
    } catch (err) {
      console.error('Error fetching admin colleges list:', err);
      throw new Error(extractErrorMessage(err, 'Failed to list provisioned institutions'));
    }
  },

  async adminRevokeInvite(token) {
    try {
      const res = await client.delete(`/api/campus/admin/invites/${token}`);
      return res.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to revoke invite'));
    }
  },

  // TPO Invite Acceptance Flow
  async verifyInviteToken(token) {
    try {
      const res = await client.get(`/api/campus/verify-invite/${token}`);
      return res.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Invalid or expired invite link'));
    }
  },

  async acceptInvite(payload) {
    try {
      const res = await client.post('/api/campus/accept-invite', payload);
      return res.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to activate TPO account'));
    }
  },

  // Student Join Code
  async studentJoinByCode(inviteCode, studentDetails = {}) {
    try {
      const res = await client.post('/api/campus/join-by-code', {
        invite_code: inviteCode,
        ...studentDetails
      });
      return res.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to join college batch'));
    }
  }
};
