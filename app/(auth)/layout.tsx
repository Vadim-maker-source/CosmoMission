'use client'

import { ReactNode, useEffect } from 'react'
import { getCurrentUser } from '../lib/api/user'
import { useRouter } from 'next/navigation'

const AuthLayout = ({ children }: { children: ReactNode }) => {
  const router = useRouter()

  useEffect(() => {
          const checkAuth = async () => {
              const currentUser = await getCurrentUser()
              if(currentUser){
                  router.back()
              }
          }
  
          checkAuth()
      }, [])
  return (
    <div className="bg-[url('/images/submain-bg.jpg')] bg-no-repeat bg-center w-full h-screen bg-cover">
        {children}
    </div>
  )
}

export default AuthLayout