const SecurePassword = require('secure-password');
const pwd = new SecurePassword();

async function test() {
  const hash = await pwd.hash(Buffer.from('password123'));
  console.log("Buffer:", hash);
  console.log("String utf8:", hash.toString('utf8'));
  console.log("String base64:", hash.toString('base64'));
}
test();
