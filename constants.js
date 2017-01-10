module.exports.constants = () => ({
  AWS_REGION: 'us-east-1',

  // Days
  AMI_RETENTION_PERIOD: 7,

  // CloudWatch Events expressions
  // http://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html
  INVOCATION_SCHEDULE: 'cron(0 0 * * ? *)',
});
