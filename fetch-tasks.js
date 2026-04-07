const http = require('http');

const url = 'http://127.0.0.1:3100/api/companies/7fbb2529-7d69-4177-bb6b-988404c35965/issues?assigneeAgentId=a3558240-0ce6-437e-988f-40c92bf45851&status=todo,in_progress,blocked';

http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', console.error);