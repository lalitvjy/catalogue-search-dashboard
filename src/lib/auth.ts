import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import bcrypt from 'bcryptjs'
import { db } from './db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      profile(p) { return { id: p.sub, email: p.email } as any }
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID, // Optional: specify tenant for org-only access
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid profile email User.Read"
        }
      },
      profile(profile) { 
        return { 
          id: profile.sub, 
          email: profile.email,
          name: profile.name
        } as any 
      }
    }),
    CredentialsProvider({
      name: 'Email & Password',
      credentials: { 
        email: {}, 
        password: {},
        rememberMe: {}
      },
      async authorize(creds) {
        const user = await db.user.findUnique({ where: { email: String(creds?.email) } })
        if (!user?.passwordHash) return null
        const ok = await bcrypt.compare(String(creds?.password), user.passwordHash)
        return ok ? { 
          id: user.id, 
          email: user.email,
          rememberMe: creds?.rememberMe === 'true'
        } as any : null
      },
    }),
  ],
  session: { strategy: 'jwt' },
  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30 days default
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'azure-ad') {
        if (!user.email) return false
        
        // For Azure AD, optionally validate company domain
        if (account?.provider === 'azure-ad') {
          // Add domain validation if needed
          // const allowedDomains = process.env.ALLOWED_MICROSOFT_DOMAINS?.split(',') || []
          // if (allowedDomains.length > 0) {
          //   const domain = user.email.split('@')[1]
          //   if (!allowedDomains.includes(domain)) {
          //     console.log('Domain not allowed:', domain)
          //     return false
          //   }
          // }
        }
        
        // Check if user exists
        let existingUser = await db.user.findUnique({ 
          where: { email: user.email } 
        })
        
        // If user doesn't exist, create them (without brand assignment)
        if (!existingUser) {
          try {
            const userData: any = {
              email: user.email,
              name: user.name || null,
              // brandId will be null initially - requires admin assignment
              brandId: null,
            }
            
            // Store provider-specific sub ID
            if (account?.provider === 'google') {
              userData.googleSub = profile?.sub
            } else if (account?.provider === 'azure-ad') {
              userData.microsoftSub = profile?.sub
            }
            
            existingUser = await db.user.create({ data: userData })
            console.log('Created new user:', existingUser.email, 'via', account?.provider)
          } catch (error) {
            console.error('Error creating user:', error)
            return false
          }
        }
        
        return true
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id
        token.rememberMe = (user as any).rememberMe
      }
      
      if (token.email) {
        const u = await db.user.findUnique({ where: { email: token.email } })
        if (u) { 
          token.uid = u.id; 
          token.brandId = u.brandId; 
          token.role = u.role 
        }
      }
      
      // Set session duration based on remember me
      if (token.rememberMe) {
        token.maxAge = 60 * 60 * 24 * 365 // 1 year
      } else {
        token.maxAge = 60 * 60 * 24 * 7 // 7 days
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session as any).uid = token.uid
        ;(session as any).brandId = token.brandId
        ;(session as any).role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
