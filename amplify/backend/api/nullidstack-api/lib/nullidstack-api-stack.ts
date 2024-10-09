import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class NullidstackApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an SNS topic for error notifications
    const errorTopic = new sns.Topic(this, 'ErrorTopic', {
      displayName: 'Lambda Error Notifications',
    });

    // Subscribe your email to the SNS topic
    errorTopic.addSubscription(new subscriptions.EmailSubscription('info@outeniquastudios.com'));

    // Define the Lambda function
    const apiLambda = new lambda.Function(this, 'NullidstackHandler', {
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'handler.handler',
      environment: {
        ERROR_TOPIC_ARN: errorTopic.topicArn,
        OUTPUT_PREFIX: 'anonymized/',
        LOG_LEVEL: 'INFO',
      },
      timeout: cdk.Duration.minutes(1),
      memorySize: 1024, // Adjust based on your needs
    });

    // Grant Lambda permissions to read and write to specific S3 buckets
    apiLambda.addToRolePolicy(new PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [
        'arn:aws:s3:::dataAnonymizationBucket/uploads/*',
        'arn:aws:s3:::dataAnonymizationBucket/anonymized/*',
      ],
    }));

    // Grant Lambda permissions to publish to SNS
    errorTopic.grantPublish(apiLambda);

    // Define the REST API
    const api = new apigateway.RestApi(this, 'NullidstackRestApi', {
      restApiName: 'nullidstack-api',
      description: 'API for nullidstack project.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Integrate Lambda with API Gateway
    const lambdaIntegration = new apigateway.LambdaIntegration(apiLambda, {
      requestTemplates: { 'application/json': '{"statusCode": "200"}' },
    });

    // Define /items resource
    const items = api.root.addResource('items');
    items.addMethod('GET', lambdaIntegration);   
    items.addMethod('POST', lambdaIntegration); 
    items.addMethod('PUT', lambdaIntegration);  
    items.addMethod('DELETE', lambdaIntegration);


    items.addProxy({
      anyMethod: true,
      defaultIntegration: lambdaIntegration,
    });
  }
}