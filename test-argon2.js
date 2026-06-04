const argon2 = require('argon2');

async function test() {
  const hashFromSecurePassword = "$argon2id$v=19$m=65536,t=2,p=1$vv6Cov09nK+NzePV73IpOA$PJ+2sGt1+E6qa9jVMT+jih64P3PhE59UCqB36ExMdE4";
  
  try {
    const isValid = await argon2.verify(hashFromSecurePassword, "password123");
    console.log("Is valid?", isValid);
  } catch (err) {
    console.error(err);
  }
}
test();
