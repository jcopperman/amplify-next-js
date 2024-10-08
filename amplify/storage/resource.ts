import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'dataAnonymizationBucket',
  access: (allow) => ({
    'uploads/*': [
      allow.authenticated.to(['read', 'write']),
    ],
    'anonymized/{fileName}': [
      allow.authenticated.to(['read']),
    ],
    'logs/*': [
      allow.authenticated.to(['read', 'write']),
    ],
    lambdaFunctionAssociations: [
      {
        event: 's3:ObjectCreated:*',
        lambdaFunction: 'uploadHandler', 
      },
    ],
  }),
});