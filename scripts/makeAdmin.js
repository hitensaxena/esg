import { makeUserAdmin } from './adminUtils.js';

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a user ID');
  process.exit(1);
}

makeUserAdmin(userId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
