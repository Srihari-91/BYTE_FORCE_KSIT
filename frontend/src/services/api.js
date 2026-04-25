import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

/**
 * @param {string} query
 * @param {object} [options]
 * @param {string} [options.project_title]
 * @param {string} [options.project_description]
 */
export const conductResearch = async (query, options = {}) => {
  const body = {
    query: (query || '').trim(),
  };
  if (options.project_title) body.project_title = options.project_title;
  if (options.project_description) body.project_description = options.project_description;

  const response = await axios.post(`${API_URL}/research/`, body);
  return response.data;
};

export const exportReport = async (runId) => {
  const response = await axios.post(`${API_URL}/export/`, { run_id: runId }, { responseType: 'blob' });
  return response.data;
};
