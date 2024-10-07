export default () => ({
  queueUrl: process.env.QUEUE_URL || '',
  queueName: process.env.QUEUE_NAME || '',
});
