import Bottombar from '@/components/Bottombar'
import Topbar2 from '@/components/Topbar2'
import { ReactNode } from 'react'

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="bg-black min-h-screen relative">
      <Topbar2 />
        {children}
        <Bottombar />
    </div>
  )
}

export default RootLayout