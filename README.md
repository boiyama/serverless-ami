# Automate AMI operation with Serverless Framework

* [Install Serverless Framework](https://serverless.com/framework/docs/providers/aws/guide/installation/) and [set-up credentials](https://serverless.com/framework/docs/providers/aws/guide/credentials/)
* Run `serverless install --url https://github.com/boiyaa/serverless-ami` to install this service
* Run `cd serverless-ami`
* Run `npm install`
* Configure `constants.js`
* Tag target instances `Key:Backup, Value:yes` on your AWS
* To check the functions,
  * Run `serverless webpack invoke --function createAMI`
  * Run `serverless webpack invoke --function deleteAMI`
  * Run `serverless webpack invoke --function createAndDeleteAMI`
* Run `serverless deploy`
* To check the deployed functions,
  * Run `serverless invoke --function createAMI --log`
  * Run `serverless invoke --function deleteAMI --log`
  * Run `serverless invoke --function createAndDeleteAMI --log`
