import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'dataAnonymizationBucket',
  access: (allow) => ({
    'uploads/*': [
      allow.authenticated.to(['read', 'write']),
    ],
    'anonymized/*': [
      allow.authenticated.to(['read']),
    ],
    'logs/*': [
      allow.authenticated.to(['read', 'write']),
    ],
  }),
});