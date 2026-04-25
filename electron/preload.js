const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('solutionTicket', {
  version: '1.0.0',
  platform: process.platform,
});
