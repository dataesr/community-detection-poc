export default {
  logger: {
    logLevel: process.env.LOG_LEVEL || "info",
  },
  scanr: {
    apiUrl: process.env.SCANR_API_URL,
    apiToken: process.env.SCANR_API_TOKEN,
  },
};
