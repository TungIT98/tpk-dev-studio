const { getMyTasks } = require('./paperclip-api.js');
getMyTasks()
  .then(t => console.log(JSON.stringify(t, null, 2)))
  .catch(e => console.error(e.message));