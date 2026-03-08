import bcrypt from 'bcryptjs';

const password = 'password';
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

console.log('Hashed password for "password":');
console.log(hashedPassword);
