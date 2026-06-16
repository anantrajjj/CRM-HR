'use client'

import { useEffect, useState } from 'react'
import { Menu, Bell, Search, User, ChevronDown, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/auth'

export function Header() {
  const { sidebarOpen, toggleSidebar, setCurrentUser, currentUser } = useAppStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'Admin',
        })
      }
    }

    getUser()
  }, [setCurrentUser])

  return (
    <header className="coda-header">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="p-2"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
          <input
            type="text"
            placeholder="Search across all modules..."
            className="coda-input pl-10 w-96"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-bone rounded-[9px] transition-colors">
          <Bell className="w-5 h-5 text-olive-slate" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 pl-4 border-l border-sage-mist hover:bg-bone rounded-[9px] p-2 transition-colors"
          >
            <div className="w-8 h-8 bg-mint-sprout rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-forest-depths" />
            </div>
            <div className="text-sm text-left">
              <p className="font-medium text-charcoal">
                {currentUser?.fullName || 'Guest User'}
              </p>
              <p className="text-xs text-pebble">
                {currentUser?.role || 'No role assigned'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-pebble" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-pure-white border border-sage-mist rounded-[13px] shadow-lg z-50">
              <div className="p-2">
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal hover:bg-bone rounded-[9px] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
