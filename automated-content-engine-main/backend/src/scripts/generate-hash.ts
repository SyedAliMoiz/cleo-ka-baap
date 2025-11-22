import * as bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'ace_admin_4711';
  const saltRounds = 10;

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Generated hash:', hash);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash();
