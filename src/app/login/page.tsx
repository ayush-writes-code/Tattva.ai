import { login, signup } from './actions'
import IntrusionXNavbar from '@/components/layout/IntrusionXNavbar'

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams
  return (
    <div className="min-h-screen bg-black text-white flex flex-col pt-32">
      <IntrusionXNavbar />
      <div className="flex-1 flex flex-col justify-center items-center px-4">
        <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-600 mb-2">Welcome Back</h1>
            <p className="text-gray-400 text-sm">Sign in to manage your scans and API credits.</p>
          </div>

          <label className="text-md text-gray-300" htmlFor="email">
            Email
          </label>
          <input
            className="rounded-md px-4 py-2 bg-gray-900 border border-gray-800 mb-4 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            name="email"
            placeholder="you@example.com"
            required
          />
          <label className="text-md text-gray-300" htmlFor="password">
            Password
          </label>
          <input
            className="rounded-md px-4 py-2 bg-gray-900 border border-gray-800 mb-6 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
          <button
            formAction={login}
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-md px-4 py-2 text-foreground mb-2 transition-all font-semibold"
          >
            Sign In
          </button>
          <button
            formAction={signup}
            className="border border-gray-700 hover:bg-gray-800 rounded-md px-4 py-2 text-white mb-2 transition-all"
          >
            Sign Up
          </button>
          {searchParams?.message && (
            <p className="mt-4 p-4 bg-gray-900 border border-gray-800 text-center text-sm text-gray-300 rounded-md">
              {searchParams.message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
