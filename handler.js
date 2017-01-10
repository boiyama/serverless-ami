import AWS from 'aws-sdk';
import { constants } from './constants';

const { AWS_REGION, AMI_RETENTION_PERIOD } = constants();

AWS.config.region = AWS_REGION;
const ec2 = new AWS.EC2();

/**
 * List EC2 instances
 * @return {Promise.<Array>} instances
 */
const listInstances = () => {
  console.log('listInstances');

  // describeInstances
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeInstances-property
  return ec2.describeInstances({
    Filters: [{ Name: 'tag:Backup', Values: ['yes'] }],
  }).promise()
  .then((data) => {
    const instances = data.Reservations.length === 0 ? data.Reservations : data.Reservations
    .map(reservation => reservation.Instances.map(instance => ({
      InstanceId: instance.InstanceId,
      Tags: instance.Tags,
    })))
    .reduce((previousValue, currentValue) => previousValue.concat(currentValue));

    return instances;
  });
};

/**
 * Create AMIs
 * @param {Array} instances
 * @returns {Promise.<Array>} AMIs
 */
const createImages = (instances) => {
  console.log('createImages target instances =', JSON.stringify(instances));

  return Promise.all(instances.map((instance) => {
    const name = instance.Tags.some((tag) => {
      if (tag.Key === 'Name') {
        return true;
      }
      return false;
    }) ? instance.Tags.find((tag) => {
      if (tag.Key === 'Name') {
        return true;
      }
      return false;
    }).Value : instance.InstanceId;

    // createImage
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#createImage-property
    return ec2.createImage({
      InstanceId: instance.InstanceId,
      Name: `${name} on ${new Date().toDateString()}`,
      NoReboot: true,
    }).promise();
  }));
};

/**
 * Create Tags
 * @param {array} images - AMIs
 * @returns {Promise.<Array>} null
 */
const createTags = (images) => {
  console.log('createTags target images =', JSON.stringify(images));

  // createTags
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#createTags-property
  return Promise.all(images.map(image => ec2.createTags({
    Resources: [image.ImageId],
    Tags: [{ Key: 'Delete', Value: 'yes' }],
  }).promise()));
};

/**
 * List expired AMIs
 * @return {Promise.<Array>} AMIs
 */
const listExpiredImages = () => {
  console.log('listExpiredImages');

  // describeImages
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeImages-property
  return ec2.describeImages({
    Owners: ['self'],
    Filters: [{ Name: 'tag:Delete', Values: ['yes'] }],
  }).promise()
  .then((data) => {
    const expiredImages = data.Images
    .filter((image) => {
      const creationDate = new Date(image.CreationDate);
      const expirationDate = new Date(Date.now() - (86400000 * AMI_RETENTION_PERIOD));

      if (creationDate < expirationDate) {
        return true;
      }
      return false;
    })
    .map(image => ({
      ImageId: image.ImageId,
      CreationDate: image.CreationDate,
      BlockDeviceMappings: image.BlockDeviceMappings.map(mapping => ({
        Ebs: { SnapshotId: mapping.Ebs.SnapshotId },
      })),
    }));

    return expiredImages;
  });
};

/**
 * Delete AMIs
 * @param {Array} images - AMIs
 * @returns {Promise.<Array>} block device mappings
 */
const deleteImages = (images) => {
  console.log('deleteImages target images =', JSON.stringify(images));

  // deregisterImage
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeImages-property
  return Promise.all(images.map(image => ec2.deregisterImage({
    ImageId: image.ImageId,
  }).promise()))
  .then(() => {
    const mappings = images.length === 0 ? images :
    images
    .map(image => image.BlockDeviceMappings)
    .reduce((previousValue, currentValue) => previousValue.concat(currentValue));

    return mappings;
  });
};

/**
 * Delete Snapshots
 * @param {Array} mappings - block device mappings
 * @returns {Promise.<Array>} null
 */
const deleteSnapshots = (mappings) => {
  console.log('deleteSnapshots target mappings =', JSON.stringify(mappings));

  // deleteSnapshot
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#deleteSnapshot-property
  return Promise.all(mappings.map(mapping => ec2.deleteSnapshot({
    SnapshotId: mapping.Ebs.SnapshotId,
  }).promise()));
};

/**
 * Lambda function: create AMIs
 */
const createAMI = () => {
  listInstances()
  .then(instances => createImages(instances))
  .then(images => createTags(images))
  .then(() => console.log('Done'))
  .catch(err => console.error(err));
};

/**
 * Lambda function: delete expired AMIs
 */
const deleteAMI = () => {
  listExpiredImages()
  .then(images => deleteImages(images))
  .then(mappings => deleteSnapshots(mappings))
  .then(() => console.log('Done'))
  .catch(err => console.error(err));
};

/**
 * Lambda function: create AMIs and delete expired AMIs
 */
const createAndDeleteAMI = () => {
  listInstances()
  .then(instances => createImages(instances))
  .then(images => createTags(images))
  .then(() => listExpiredImages())
  .then(images => deleteImages(images))
  .then(mappings => deleteSnapshots(mappings))
  .then(() => console.log('Done'))
  .catch(err => console.error(err));
};

export { createAMI, deleteAMI, createAndDeleteAMI };
