import 'dotenv/config'
import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

function generatePassword(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  
  // Ensure at least one number and one letter
  password += chars.charAt(Math.floor(Math.random() * 26)) // A-Z
  password += chars.charAt(Math.floor(Math.random() * 26) + 26) // a-z
  password += chars.charAt(Math.floor(Math.random() * 10) + 52) // 0-9
  
  // Fill remaining characters
  for (let i = 3; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

async function main() {
  const [,, email, name, providedPassword] = process.argv
  if (!email) throw new Error('Usage: tsx scripts/create-user.ts <email> [name] [password]')
  
  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email }
  })
  
  if (existingUser) {
    console.error('ERROR: User with this email already exists')
    process.exit(1)
  }
  
  // Generate or use provided password
  const password = providedPassword || generatePassword(8)
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 12)
  
  // Create user
  const user = await db.user.create({
    data: {
      email,
      name: name || null,
      passwordHash,
      role: 'VIEWER', // Default role - can be updated later
      brandId: null, // No brand assignment initially
    }
  })
  
  console.log('USER_CREATED')
  console.log('Email:', user.email)
  console.log('Name:', user.name || 'Not provided')
  console.log('Password:', password)
  console.log('User ID:', user.id)
  console.log('Role:', user.role)
  console.log('')
  console.log('⚠️  IMPORTANT: Save this password securely. It will not be shown again.')
  console.log('The user will need to use this password to log in.')
}

main().catch(e => { 
  console.error(e) 
  process.exit(1) 
})