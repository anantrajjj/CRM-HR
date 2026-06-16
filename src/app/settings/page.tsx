'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { User, Mail, Lock, Bell, Palette } from 'lucide-react'

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
  })

  const [appearance, setAppearance] = useState({
    theme: 'light',
  })

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSaveProfile = () => {
    setSaving(true)
    setTimeout(() => {
      setMessage('Profile updated successfully')
      setSaving(false)
      setTimeout(() => setMessage(''), 3000)
    }, 500)
  }

  const handleSaveNotifications = () => {
    setSaving(true)
    setTimeout(() => {
      setMessage('Notification preferences saved')
      setSaving(false)
      setTimeout(() => setMessage(''), 3000)
    }, 500)
  }

  const handleSaveAppearance = () => {
    setSaving(true)
    setTimeout(() => {
      setMessage('Appearance settings saved')
      setSaving(false)
      setTimeout(() => setMessage(''), 3000)
    }, 500)
  }

  const handleChangePassword = () => {
    if (password.new !== password.confirm) {
      setMessage('Passwords do not match')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    if (!password.current || !password.new) {
      setMessage('Please fill in all password fields')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    setSaving(true)
    setTimeout(() => {
      setMessage('Password changed successfully')
      setPassword({ current: '', new: '', confirm: '' })
      setSaving(false)
      setTimeout(() => setMessage(''), 3000)
    }, 500)
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Page Header */}
        <div>
          <h1 className="coda-heading-monument text-3xl text-charcoal">
            Settings
          </h1>
          <p className="text-olive-slate mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div className="bg-mint-sprout text-forest-depths px-4 py-3 rounded-lg text-sm font-medium">
            {message}
          </div>
        )}

        {/* Profile Section */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-lilac-wash rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-plum-depth" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-charcoal">Profile</h2>
                <p className="text-sm text-pebble">Your personal information</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-sky-wash rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-cobalt-ink" />
              </div>
              <div>
                <p className="font-medium text-charcoal">{profile.name}</p>
                <p className="text-sm text-pebble">{profile.role}</p>
                <Button variant="ghost" size="sm" className="mt-2 text-cobalt-ink">
                  Change Avatar
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-sky-wash rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-cobalt-ink" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-charcoal">Notifications</h2>
                <p className="text-sm text-pebble">Configure how you receive notifications</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-charcoal">Email Notifications</p>
                  <p className="text-sm text-pebble">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.emailNotifications}
                    onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-wash rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cobalt-ink"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-charcoal">Push Notifications</p>
                  <p className="text-sm text-pebble">Receive push notifications in browser</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.pushNotifications}
                    onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-wash rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cobalt-ink"></div>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-lilac-wash rounded-full flex items-center justify-center">
                <Palette className="w-5 h-5 text-plum-depth" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-charcoal">Appearance</h2>
                <p className="text-sm text-pebble">Customize the look and feel</p>
              </div>
            </div>

            <div className="space-y-4">
              <Select
                label="Theme"
                value={appearance.theme}
                onChange={(e) => setAppearance({ ...appearance, theme: e.target.value })}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
              <div className="flex justify-end">
                <Button onClick={handleSaveAppearance} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Appearance'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-bone rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-wine-shadow" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-charcoal">Change Password</h2>
                <p className="text-sm text-pebble">Update your password regularly for security</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="Enter current password"
                value={password.current}
                onChange={(e) => setPassword({ ...password, current: e.target.value })}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                value={password.new}
                onChange={(e) => setPassword({ ...password, new: e.target.value })}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password"
                value={password.confirm}
                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
              />
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={saving}>
                  {saving ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
