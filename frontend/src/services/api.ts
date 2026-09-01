import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary').then((res) => res.data),
};

export const costApi = {
  getTimeseries: (days: number = 30, granularity: string = 'daily', env?: string, service?: string) =>
    api.get('/cost/timeseries', { params: { days, granularity, environment: env, service } }).then((res) => res.data),
  getBreakdown: (days: number = 30) =>
    api.get('/cost/breakdown', { params: { days } }).then((res) => res.data),
};

export const anomaliesApi = {
  list: (severity?: string, service?: string, status?: string) =>
    api.get('/anomalies', { params: { severity, service, status } }).then((res) => res.data),
  getDetail: (id: string) => api.get(`/anomalies/${id}`).then((res) => res.data),
  explain: (id: string, forceRefresh: boolean = false) =>
    api.post(`/anomalies/${id}/explain`, null, { params: { force_refresh: forceRefresh } }).then((res) => res.data),
};

export const aiApi = {
  investigate: (anomalyId: string, forceRefresh: boolean = false) =>
    api.post('/ai/investigate', { anomaly_id: anomalyId, force_refresh: forceRefresh }).then((res) => res.data),
};

export const carbonApi = {
  getSummary: (region: string = 'ap-south-1') =>
    api.get('/carbon/summary', { params: { region } }).then((res) => res.data),
  getRegions: () => api.get('/carbon/regions').then((res) => res.data),
};

export const schedulerApi = {
  getJobs: () => api.get('/scheduler/jobs').then((res) => res.data),
  optimize: (payload: {
    job_name: string;
    job_type: string;
    duration_hours: number;
    compute_units: number;
    current_schedule_hour: number;
    deadline_hour: number;
    preferred_region: string;
    optimization_goal: string;
  }) => api.post('/scheduler/optimize', payload).then((res) => res.data),
  whatIf: (payload: {
    workload_type: string;
    current_hour: number;
    target_hour: number;
    duration_hours: number;
    compute_units: number;
    region: string;
  }) => api.post('/scheduler/what-if', payload).then((res) => res.data),
};

export const recommendationsApi = {
  list: (category?: string, priority?: string, status?: string) =>
    api.get('/recommendations', { params: { category, priority, status } }).then((res) => res.data),
  apply: (id: string) => api.post(`/recommendations/${id}/apply`).then((res) => res.data),
  dismiss: (id: string) => api.post(`/recommendations/${id}/dismiss`).then((res) => res.data),
};

export const resourcesApi = {
  list: (params?: { service?: string; environment?: string; region?: string; status?: string; search?: string }) =>
    api.get('/resources', { params }).then((res) => res.data),
  getDetail: (id: string) => api.get(`/resources/${id}`).then((res) => res.data),
};

export const eventsApi = {
  list: (params?: { event_type?: string; service?: string; limit?: number }) =>
    api.get('/events', { params }).then((res) => res.data),
};

export const reportsApi = {
  list: () => api.get('/reports').then((res) => res.data),
  generate: (reportType: string, days: number = 30) =>
    api.post('/reports/generate', { report_type: reportType, date_range_days: days }).then((res) => res.data),
  getDownloadUrl: (entity: string = 'billing') => `/api/reports/export/csv?entity=${entity}`,
};

export const simulationApi = {
  simulateCostSpike: (service: string = 'EC2') =>
    api.post('/simulation/cost-spike', null, { params: { service } }).then((res) => res.data),
  triggerScenario: (scenarioId: string) =>
    api.post('/simulation/trigger-scenario', { scenario_id: scenarioId }).then((res) => res.data),
  resetDemoData: () => api.post('/simulation/reset').then((res) => res.data),
};

export const settingsApi = {
  get: () => api.get('/settings').then((res) => res.data),
  update: (payload: any) => api.post('/settings', payload).then((res) => res.data),
};

export default api;
