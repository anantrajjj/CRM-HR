'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, LogIn, LogOut, Timer } from 'lucide-react'

interface AttendanceRecord {
  id: string
  date: string
  check_in?: string
  check_out?: string
  status: string
  hours_worked?: number
}

export function ClockWidget() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [punching, setPunching] = useState(false)
  const [elapsed, setElapsed] = useState('00:00:00')
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchTodayAttendance()
  }, [])

  useEffect(() => {
    if (todayRecord?.check_in && !todayRecord?.check_out) {
      const interval = setInterval(() => {
        const checkIn = new Date(todayRecord.check_in!)
        const now = new Date()
        const diff = now.getTime() - checkIn.getTime()
        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setElapsed(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        )
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [todayRecord])

  const getOrCreateEmployee = async (supabase: ReturnType<typeof createClient>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Try to find existing employee by user_id
    let { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (emp) return emp.id

    // Try by email
    const { data: empByEmail } = await supabase
      .from('employees')
      .select('id')
      .eq('email', user.email || '')
      .single()

    if (empByEmail) {
      // Link user_id to existing employee
      await supabase
        .from('employees')
        .update({ user_id: user.id })
        .eq('id', empByEmail.id)
      return empByEmail.id
    }

    // Auto-create employee record for this user
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
    const [firstName, ...rest] = name.split(' ')
    const lastName = rest.join(' ') || firstName

    const { data: newEmp } = await supabase
      .from('employees')
      .insert({
        employee_id: `EMP-${Date.now().toString(36).toUpperCase()}`,
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.email || '',
        hire_date: new Date().toISOString().split('T')[0],
        employment_type: 'full_time',
        status: 'active',
      })
      .select('id')
      .single()

    return newEmp?.id || null
  }

  const fetchTodayAttendance = async () => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const employeeId = await getOrCreateEmployee(supabase)
    if (!employeeId) { setLoading(false); return }

    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .single()

    setTodayRecord(data)
    setLoading(false)
  }

  const handlePunchIn = async () => {
    setPunching(true)
    setStatusMsg('')
    const supabase = createClient()
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0]

    const employeeId = await getOrCreateEmployee(supabase)
    if (!employeeId) {
      setStatusMsg('Could not find or create employee record')
      setPunching(false)
      return
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        employee_id: employeeId,
        date: today,
        check_in: `${today}T${timeStr}`,
        status: 'present',
      })
      .select()
      .single()

    if (error) {
      setStatusMsg(`Error: ${error.message}`)
    } else if (data) {
      setTodayRecord(data)
      setStatusMsg('Clocked in successfully!')
    }
    setPunching(false)
  }

  const handlePunchOut = async () => {
    if (!todayRecord) return
    setPunching(true)
    setStatusMsg('')
    const supabase = createClient()
    const now = new Date()
    const timeStr = now.toTimeString().split(' ')[0]

    const checkIn = new Date(todayRecord.check_in!)
    const hoursWorked = Math.round((now.getTime() - checkIn.getTime()) / 3600000 * 100) / 100

    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out: `${todayRecord.date}T${timeStr}`,
        hours_worked: hoursWorked,
      })
      .eq('id', todayRecord.id)
      .select()
      .single()

    if (error) {
      setStatusMsg(`Error: ${error.message}`)
    } else if (data) {
      setTodayRecord(data)
      setStatusMsg(`Clocked out! ${hoursWorked}h worked today.`)
    }
    setPunching(false)
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const isCheckedIn = !!todayRecord?.check_in
  const isCheckedOut = !!todayRecord?.check_out

  if (loading) {
    return (
      <Card variant="bordered">
        <CardContent>
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-12 h-12 bg-bone rounded-[13px]" />
            <div className="space-y-2">
              <div className="h-4 bg-bone rounded w-32" />
              <div className="h-3 bg-bone rounded w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="bordered">
      <CardContent>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-[13px] flex items-center justify-center ${isCheckedIn && !isCheckedOut ? 'bg-mint-sprout' : 'bg-bone'}`}>
              <Clock className={`w-7 h-7 ${isCheckedIn && !isCheckedOut ? 'text-forest-depths' : 'text-pebble'}`} />
            </div>
            <div>
              <p className="text-3xl font-bold text-charcoal font-mono tracking-wider">
                {formatTime(currentTime)}
              </p>
              <p className="text-sm text-olive-slate">{formatDate(currentTime)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isCheckedIn && !isCheckedOut && (
              <div className="text-center px-4">
                <p className="text-xs text-pebble uppercase tracking-wider">Elapsed</p>
                <p className="text-xl font-bold text-forest-depths font-mono">{elapsed}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              {(!isCheckedIn || isCheckedOut) && (
                <Badge variant={isCheckedOut ? 'success' : 'default'}>
                  {isCheckedOut ? 'Clocked Out' : 'Not Clocked In'}
                </Badge>
              )}
              {isCheckedIn && !isCheckedOut && (
                <Badge variant="success">Clocked In</Badge>
              )}
            </div>

            {!isCheckedIn ? (
              <Button onClick={handlePunchIn} disabled={punching} className="bg-forest-depths hover:bg-forest-depths/90">
                <LogIn className="w-4 h-4 mr-2" />
                {punching ? 'Punching...' : 'Punch In'}
              </Button>
            ) : !isCheckedOut ? (
              <Button onClick={handlePunchOut} disabled={punching} variant="danger">
                <LogOut className="w-4 h-4 mr-2" />
                {punching ? 'Punching...' : 'Punch Out'}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-olive-slate">
                <Timer className="w-4 h-4" />
                <span>{todayRecord.hours_worked?.toFixed(1)}h worked</span>
              </div>
            )}
          </div>
        </div>
        {statusMsg && (
          <p className={`text-sm mt-2 ${statusMsg.startsWith('Error') ? 'text-wine-shadow' : 'text-forest-depths'}`}>
            {statusMsg}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
