import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from './actions'
import IntrusionXNavbar from '@/components/layout/IntrusionXNavbar'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pt-32">
      <IntrusionXNavbar />
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-600">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Logged in as {user.email}</p>
          </div>
          <form action={logout} className="mt-4 sm:mt-0">
            <button className="bg-gray-900 border border-gray-800 hover:bg-gray-800 rounded-md px-4 py-2 text-white transition-all text-sm">
              Sign Out
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl flex flex-col items-center justify-center text-center h-48">
             <h2 className="text-4xl font-bold text-teal-400 mb-2">0</h2>
             <p className="text-gray-400 text-sm">Credits Remaining</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl flex flex-col items-center justify-center text-center h-48">
             <h2 className="text-4xl font-bold text-emerald-400 mb-2">0</h2>
             <p className="text-gray-400 text-sm">Total Scans</p>
          </div>
        </div>
      </div>
    </div>
  )
}
