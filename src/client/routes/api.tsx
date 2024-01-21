import { getApiUrl } from '../utils';
const API_URL = getApiUrl();

export const processDataRoutes = {
  fetchUploadsFileName: `${API_URL}/processData/fetchUploadsFileName`,
  uploadTheFile: `${API_URL}/processData/uploadTheFile`,
  fetchFileContent: `${API_URL}/processData/fetchFileContent`,
  uploadProcessedFile: `${API_URL}/processData/uploadProcessedFile`,
  fetchProcessedContent: `${API_URL}/processData/fetchProcessedContent`,
  fetchProcessedContentByUser: `${API_URL}/processData/fetchProcessedContentByUser`,
  downloadProcessedFile: `${API_URL}/processData/downloadProcessedFile`,
  deleteFile: `${API_URL}/processData/deleteFile`,
  addExtractionLabel_all: `${API_URL}/processData/addExtractionLabel_all`,
  removeLabel_all: `${API_URL}/processData/removeLabel_all`,
  gptRetrieve: `${API_URL}/processData/gptRetrieve`,
  gptRetrieve_all: `${API_URL}/processData/gptRetrieve_all`,
  formatterProcessedContent: `${API_URL}/processData/formatterProcessedContent`,
  uploadFileSort: `${API_URL}/processData/uploadFileSort`,
  downloadExcel: `${API_URL}/processData/downloadExcel`,
  fetchUsers: `${API_URL}/processData/fetchUsers`,
  fetchComparatorProcessedContent: `${API_URL}/processData/fetchComparatorProcessedContent`,
};

export const loginRoutes = {
  checkAccountExist: `${API_URL}/login/checkExist`,
  accountList: `${API_URL}/login/accountList`,
};


/**

import { getApiUrl } from '../utils';
const API_URL = getApiUrl();

// 函數用於自動生成路由
const createRoute = (base, endpoint) => `${base}/${endpoint}`;

const processDataEndpoints = [
  'fetchUploadsFileName', 'uploadTheFile', 'fetchFileContent',
  'uploadProcessedFile', 'fetchProcessedContent', 'downloadProcessedFile',
  'deleteFile', 'addExtractionLabel_all', 'removeLabel_all',
  'gptRetrieve', 'gptRetrieve_all', 'formatterProcessedContent',
  'uploadFileSort', 'downloadCSV'
];

const loginEndpoints = [
  'checkAccountExist', 'accountList'
];

// 自動生成 processDataRoutes
export const processDataRoutes = processDataEndpoints.reduce((routes, endpoint) => {
  routes[endpoint] = createRoute(API_URL, `processData/${endpoint}`);
  return routes;
}, {});

// 自動生成 loginRoutes
export const loginRoutes = loginEndpoints.reduce((routes, endpoint) => {
  routes[endpoint] = createRoute(API_URL, `login/${endpoint}`);
  return routes;
}, {});

 */
