import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowRight, Bell, CalendarDays, Check, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, Clock3, FileText, HeartPulse, Home,
  LogOut, Menu, Search, Settings, ShieldCheck, Stethoscope, UserRound, Users,
  X, Plus, Star, CalendarCheck, LayoutDashboard, Sparkles, CircleHelp,
} from 'lucide-react'
import { apiRequest } from './api'

const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`
const prettyDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

function App() {
  const [page, setPage] = useState('Dashboard')
  const [mobileNav, setMobileNav] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('All specialties')
  const [modalDoctor, setModalDoctor] = useState(null)
  const [toast, setToast] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(() => !localStorage.getItem('mediflow_token'))
  const [authMode, setAuthMode] = useState('Login')
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localStorage.getItem('mediflow_token')))
  const [userName, setUserName] = useState(() => localStorage.getItem('mediflow_name') || 'Guest')
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('mediflow_email') || '')

  const filteredDoctors = useMemo(() => doctors.filter((doctor) => {
    const matchesQuery = `${doctor.name} ${doctor.specialty}`.toLowerCase().includes(query.toLowerCase())
    const matchesSpecialty = specialty === 'All specialties' || doctor.specialty === specialty
    return matchesQuery && matchesSpecialty
  }), [doctors, query, specialty])

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3200) }
  const navigate = (target) => { setPage(target); setMobileNav(false); setQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  // Load real doctor records from the Express API when the app starts.
  useEffect(() => {
    let active = true

    async function loadDoctors() {
      try {
        const response = await apiRequest('/api/doctors')
        const rows = Array.isArray(response) ? response : (response.data || [])
        const formattedDoctors = rows.map((doctor, index) => ({
          ...doctor,
          id: doctor._id || doctor.id,
          fee: doctor.consultationFee ?? doctor.fee ?? 0,
          initials: (doctor.name || 'Doctor').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase(),
          experience: doctor.experience ? `${doctor.experience} years experience` : '',
          rating: doctor.rating ?? '—',
          color: ['mint', 'lavender', 'peach', 'blue', 'rose', 'gold'][index % 6],
          available: doctor.available !== false,
          clinic: doctor.clinic || 'MediFlow Care Centre',
        }))
        if (active) setDoctors(formattedDoctors)
      } catch (error) {
        console.error('Could not load doctors:', error.message)
        if (active) notify(`Could not load doctors: ${error.message}`)
      }
    }

    loadDoctors()
    return () => { active = false }
  }, [])

  // Fetch only the signed-in user's appointments whenever authentication changes.
  useEffect(() => {
    let active = true

    async function loadAppointments() {
      if (!loggedIn || !localStorage.getItem('mediflow_token')) {
        setAppointments([])
        return
      }
      try {
        const response = await apiRequest('/api/appointments')
        const rows = Array.isArray(response) ? response : (response.data || [])
        const normalized = rows.map((item) => {
          const scheduled = new Date(item.scheduledAt)
          const pad = (n) => String(n).padStart(2, '0')
          const date = Number.isNaN(scheduled.getTime()) ? '' : `${scheduled.getFullYear()}-${pad(scheduled.getMonth() + 1)}-${pad(scheduled.getDate())}`
          const time = Number.isNaN(scheduled.getTime()) ? '' : `${pad(scheduled.getHours())}:${pad(scheduled.getMinutes())}`
          const rawStatus = String(item.status || 'pending').toLowerCase()
          const status = ({ booked: 'Confirmed', confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled', canceled: 'Cancelled', completed: 'Completed' })[rawStatus] || (rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1))
          const doctorValue = item.doctor
          return {
            id: item._id || item.id,
            doctorId: typeof doctorValue === 'object' ? (doctorValue?._id || doctorValue?.id) : doctorValue,
            date,
            time,
            reason: item.reason || '',
            status,
          }
        })
        if (active) setAppointments(normalized)
      } catch (error) {
        console.error('Could not load appointments:', error.message)
        if (active) notify(`Could not load appointments: ${error.message}`)
      }
    }

    loadAppointments()
    return () => { active = false }
  }, [loggedIn])

  const openBooking = (doctor) => {
    if (!loggedIn) {
      setAuthMode('Login')
      setShowAuth(true)
      notify('Please sign in before booking an appointment.')
      return
    }
    setModalDoctor(doctor)
  }

  const bookAppointment = async (form) => {
    if (!modalDoctor) throw new Error('Please choose a doctor first.')
    const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString()
    await apiRequest('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        doctor: modalDoctor.id,
        scheduledAt,
        reason: form.reason,
      }),
    })
    const response = await apiRequest('/api/appointments')
    const rows = Array.isArray(response) ? response : (response.data || [])
    const normalized = rows.map((item) => {
      const scheduled = new Date(item.scheduledAt)
      const pad = (n) => String(n).padStart(2, '0')
      const date = Number.isNaN(scheduled.getTime()) ? '' : `${scheduled.getFullYear()}-${pad(scheduled.getMonth() + 1)}-${pad(scheduled.getDate())}`
      const time = Number.isNaN(scheduled.getTime()) ? '' : `${pad(scheduled.getHours())}:${pad(scheduled.getMinutes())}`
      const rawStatus = String(item.status || 'pending').toLowerCase()
      const status = ({ booked: 'Confirmed', confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled', canceled: 'Cancelled', completed: 'Completed' })[rawStatus] || (rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1))
      const doctorValue = item.doctor
      return { id: item._id || item.id, doctorId: typeof doctorValue === 'object' ? (doctorValue?._id || doctorValue?.id) : doctorValue, date, time, reason: item.reason || '', status }
    })
    setAppointments(normalized)
    setModalDoctor(null)
    setPage('My Appointments')
    notify('Appointment booked successfully.')
  }

  // The current Express app does not expose a cancellation endpoint yet.
  const cancelAppointment = () => notify('Cancellation is not connected yet. Add a protected cancellation route to the backend first.')

  const handleAuth = async ({ name, email, password, mode }) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (mode === 'Register') {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password }),
      })
    }

    // Registration returns success only, so log in to obtain the JWT.
    const result = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail, password }),
    })
    localStorage.setItem('mediflow_token', result.token)
    localStorage.setItem('mediflow_name', result.user?.name || name || normalizedEmail.split('@')[0])
    localStorage.setItem('mediflow_email', result.user?.email || normalizedEmail)
    setUserName(result.user?.name || name || normalizedEmail.split('@')[0])
    setUserEmail(result.user?.email || normalizedEmail)
    setLoggedIn(true)
    setShowAuth(false)
    notify(mode === 'Register' ? 'Account created. You are signed in.' : 'Welcome back!')
  }

  const logout = () => {
    localStorage.removeItem('mediflow_token')
    localStorage.removeItem('mediflow_name')
    localStorage.removeItem('mediflow_email')
    setLoggedIn(false)
    setUserName('Guest')
    setUserEmail('')
    setAppointments([])
    setShowAuth(true)
    setAuthMode('Login')
    setProfileOpen(false)
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Find Doctors', icon: Stethoscope },
    { label: 'My Appointments', icon: CalendarDays },
  ]

  return (
    <div className="min-h-screen bg-[#f6f9f8] text-[#173b3a]">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-[#e7efec] bg-white px-5 py-6 transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f766e] text-white"><HeartPulse size={24} strokeWidth={2.4} /></div>
          <div><div className="display-font text-[21px] font-extrabold tracking-tight">MediFlow</div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-[#7d9993]">Care made simple</div></div>
          <button className="ml-auto rounded-lg p-2 lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button>
        </div>
        <div className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#9ab0ab]">Workspace</div>
        <nav className="mt-3 space-y-1">
          {navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => navigate(label)} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-semibold transition ${page === label ? 'bg-[#e8f6f3] text-[#087d72]' : 'text-[#6d8580] hover:bg-[#f4f8f7] hover:text-[#173b3a]'}`}><Icon size={18}/>{label}{label === 'My Appointments' && <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] text-[#55716b]">{appointments.filter(a => a.status !== 'Cancelled').length}</span>}</button>)}
        </nav>
        <div className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#9ab0ab]">Personal</div>
        <nav className="mt-3 space-y-1">
          <button onClick={() => { setProfileOpen(true); }} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-semibold text-[#6d8580] hover:bg-[#f4f8f7]"><UserRound size={18}/>My Profile</button>
          <button onClick={() => notify('Settings will be available when connected to your backend.')} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-semibold text-[#6d8580] hover:bg-[#f4f8f7]"><Settings size={18}/>Settings</button>
          <button onClick={() => notify('Help centre coming soon.')} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-semibold text-[#6d8580] hover:bg-[#f4f8f7]"><CircleHelp size={18}/>Help centre</button>
        </nav>
        <div className="mt-auto rounded-2xl bg-[#f0f8f6] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#0f8a7d]"><ShieldCheck size={19}/></div>
          <div className="mt-3 text-[13px] font-bold">Your health, your priority</div>
          <p className="mt-1 text-[11px] leading-5 text-[#718c86]">Keep your appointments and care details all in one place.</p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-[#138579]"><CheckCircle2 size={13}/> Private & secure</div>
        </div>
        <div className="mt-5 flex items-center gap-3 border-t border-[#edf2f0] px-1 pt-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f6d8c8] text-sm font-bold text-[#805542]">{userName.slice(0,1).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-bold">{loggedIn ? userName : 'Guest patient'}</div><div className="mt-0.5 text-[10px] text-[#8ba19c]">Patient account</div></div>
          <button onClick={logout} aria-label="Log out" className="rounded-lg p-2 text-[#8ba19c] hover:bg-white hover:text-[#0f766e]"><LogOut size={16}/></button>
        </div>
      </aside>

      {mobileNav && <button className="fixed inset-0 z-30 bg-[#123c38]/30 lg:hidden" aria-label="Close navigation overlay" onClick={() => setMobileNav(false)} />}
      <main className="min-h-screen lg:ml-[258px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#e8efed] bg-white/90 px-5 backdrop-blur-xl sm:px-8 xl:px-10">
          <div className="flex items-center gap-3"><button className="rounded-xl border border-[#e5eeeb] p-2.5 lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={18}/></button><div><div className="text-[11px] font-medium text-[#8aa19b]">Patient portal <span className="mx-1.5">/</span> <span className="text-[#41645e]">{page}</span></div><h1 className="display-font mt-0.5 text-[16px] font-extrabold sm:text-[18px]">{page === 'Dashboard' ? 'Overview' : page}</h1></div></div>
          <div className="flex items-center gap-2 sm:gap-4"><div className="hidden items-center gap-2 rounded-full bg-[#f4f8f7] px-3 py-2 text-[11px] font-semibold text-[#68847e] sm:flex"><span className={`h-2 w-2 rounded-full ${loggedIn ? 'bg-[#2bb79c]' : 'bg-[#d6a35a]'}`}/>{loggedIn ? 'Signed in' : 'Guest mode'}</div><button onClick={() => notify('You’re all caught up!')} className="relative rounded-xl border border-[#e8efed] p-2.5 text-[#65817b] hover:bg-[#f6faf9]" aria-label="Notifications"><Bell size={18}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f29b67] ring-2 ring-white"/></button><button onClick={() => setProfileOpen(true)} className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-[#f6f9f8]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8eee8] text-xs font-bold text-[#0f766e]">{userName.slice(0,1).toUpperCase()}</span><ChevronDown size={14} className="hidden text-[#77918b] sm:block"/></button></div>
        </header>

        <div className="mx-auto max-w-[1450px] px-5 py-7 sm:px-8 sm:py-9 xl:px-10">
          {page === 'Dashboard' && <Dashboard userName={userName} appointments={appointments} doctors={doctors} navigate={navigate} openBook={openBooking} />}
          {page === 'Find Doctors' && <DoctorsPage doctors={filteredDoctors} query={query} setQuery={setQuery} specialty={specialty} setSpecialty={setSpecialty} openBook={openBooking} />}
          {page === 'My Appointments' && <AppointmentsPage appointments={appointments} doctors={doctors} cancelAppointment={cancelAppointment} navigate={navigate} />}
          <footer className="mt-12 flex flex-col justify-between gap-2 border-t border-[#e7efec] py-5 text-[10px] text-[#91a59f] sm:flex-row sm:items-center"><span>© 2026 MediFlow Healthcare. Designed for better care.</span><span className="flex items-center gap-1"><ShieldCheck size={12}/> Your wellbeing, connected.</span></footer>
        </div>
      </main>

      {modalDoctor && <BookingModal doctor={modalDoctor} close={() => setModalDoctor(null)} submit={bookAppointment} />}
      {showAuth && <AuthModal mode={authMode} setMode={setAuthMode} close={() => setShowAuth(false)} submit={handleAuth} />}
      {profileOpen && <ProfileModal userName={userName} userEmail={userEmail} loggedIn={loggedIn} close={() => setProfileOpen(false)} onLogin={() => { setProfileOpen(false); setShowAuth(true); setAuthMode('Login') }} />}
      {toast && <div className="fixed bottom-5 right-5 z-[70] flex max-w-[calc(100%-40px)] items-center gap-2 rounded-2xl bg-[#153f3b] px-4 py-3 text-sm font-medium text-white shadow-2xl"><CheckCircle2 size={17} className="shrink-0 text-[#82e0c6]"/>{toast}<button onClick={() => setToast('')} className="ml-2 opacity-70 hover:opacity-100" aria-label="Dismiss"><X size={15}/></button></div>}
    </div>
  )
}

function SectionTitle({ eyebrow, title, subtitle, action, onAction }) {
  return <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div>{eyebrow && <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[.19em] text-[#0f9889]">{eyebrow}</div>}<h2 className="display-font text-[20px] font-extrabold tracking-[-.04em] sm:text-[23px]">{title}</h2>{subtitle && <p className="mt-1 text-[12px] text-[#819791]">{subtitle}</p>}</div>{action && <button onClick={onAction} className="flex items-center gap-2 self-start text-[12px] font-bold text-[#0f8b7e] hover:text-[#075e56] sm:self-auto">{action}<ArrowRight size={15}/></button>}</div>
}

function Dashboard({ userName, appointments, doctors, navigate, openBook }) {
  const upcoming = appointments.filter(a => a.status !== 'Cancelled').sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)).slice(0,2)
  return <div className="space-y-9">
    <section className="relative overflow-hidden rounded-[28px] bg-[#0f766e] px-6 py-7 text-white sm:px-9 sm:py-9 lg:px-11">
      <div className="pointer-events-none absolute -right-8 -top-24 h-72 w-72 rounded-full border-[36px] border-white/[.06]"/><div className="pointer-events-none absolute right-32 -bottom-28 h-64 w-64 rounded-full border-[30px] border-white/[.06]"/>
      <div className="relative z-10 max-w-[610px]"><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-[#d4f4e9]"><Sparkles size={13}/> YOUR PERSONAL HEALTH SPACE</div><h2 className="display-font mt-5 text-[29px] font-extrabold leading-[1.15] tracking-[-.05em] sm:text-[38px]">Good to see you, {userName}.<br/><span className="text-[#a8e9d7]">How are you feeling today?</span></h2><p className="mt-3 max-w-[420px] text-[12px] leading-6 text-[#d0e9e4] sm:text-[13px]">Your health journey, made a little simpler. Find trusted doctors and keep your care on track.</p><button onClick={() => navigate('Find Doctors')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[12px] font-extrabold text-[#0f766e] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#effbf7]">Book an appointment <ArrowRight size={16}/></button></div>
      <div className="relative mt-7 flex max-w-[520px] gap-3 sm:absolute sm:bottom-8 sm:right-8 sm:mt-0 sm:w-[43%] sm:flex-col sm:gap-3 lg:right-11 lg:w-[35%] xl:w-[31%]"><div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur sm:p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><CalendarCheck size={19}/></div><div><div className="text-[21px] font-extrabold">{appointments.filter(a => a.status !== 'Cancelled').length}</div><div className="text-[10px] text-[#c5e7df]">Active appointments</div></div></div><div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur sm:p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Stethoscope size={19}/></div><div><div className="text-[21px] font-extrabold">{doctors.length}</div><div className="text-[10px] text-[#c5e7df]">Specialist doctors</div></div></div></div>
    </section>

    <section><SectionTitle eyebrow="QUICK ACCESS" title="Your care at a glance" subtitle="Everything you need, right where you need it."/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><QuickCard icon={CalendarDays} title="Book a visit" desc="Find the right specialist" tint="mint" onClick={() => navigate('Find Doctors')}/><QuickCard icon={FileText} title="Appointments" desc="View your upcoming visits" tint="lavender" onClick={() => navigate('My Appointments')}/><QuickCard icon={Users} title="Find a doctor" desc="Browse trusted specialists" tint="peach" onClick={() => navigate('Find Doctors')}/><QuickCard icon={HeartPulse} title="Health profile" desc="Manage your details" tint="blue" onClick={() => navigate('My Appointments')}/></div></section>

    <section><SectionTitle eyebrow="COMING UP" title="Upcoming appointments" subtitle="Stay on top of your care schedule." action="View all appointments" onAction={() => navigate('My Appointments')}/>{upcoming.length ? <div className="grid gap-4 xl:grid-cols-2">{upcoming.map(item => <AppointmentCard key={item.id} appointment={item} doctor={doctors.find(d => d.id === item.doctorId)} compact />)}</div> : <EmptyState title="No appointments yet" desc="Book your first visit with one of our specialists." action="Find a doctor" onAction={() => navigate('Find Doctors')}/>}</section>

    <section><SectionTitle eyebrow="MEET OUR SPECIALISTS" title="Popular doctors" subtitle="Care from people who care." action="Explore all doctors" onAction={() => navigate('Find Doctors')}/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{doctors.slice(0,3).map(doctor => <DoctorCard key={doctor.id} doctor={doctor} onBook={() => openBook(doctor)} />)}</div></section>
    <div className="flex flex-col gap-4 rounded-2xl border border-[#e4efeb] bg-[#edf7f3] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0f8b7e]"><Activity size={21}/></div><div><div className="text-[13px] font-bold">Small steps make a big difference.</div><div className="mt-1 text-[11px] text-[#7c9690]">Schedule your check-ups and make time for your wellbeing.</div></div></div><button onClick={() => navigate('Find Doctors')} className="flex items-center gap-2 self-start rounded-xl bg-[#0f766e] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#095f58] sm:self-auto">Find a specialist <ArrowRight size={14}/></button></div>
  </div>
}

function QuickCard({ icon: Icon, title, desc, tint, onClick }) {
  const colors = { mint: 'bg-[#e3f6ef] text-[#0d8d78]', lavender: 'bg-[#efebff] text-[#7964cb]', peach: 'bg-[#fff0e4] text-[#c17b4a]', blue: 'bg-[#e5f0ff] text-[#4e85c7]' }
  return <button onClick={onClick} className="panel soft-shadow group flex items-center gap-3.5 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#c5e6dc]"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colors[tint]}`}><Icon size={21}/></div><div className="min-w-0 flex-1"><div className="text-[12px] font-extrabold">{title}</div><div className="mt-1 text-[10px] text-[#8aa09a]">{desc}</div></div><ArrowRight size={15} className="text-[#9bb0aa] transition group-hover:translate-x-1 group-hover:text-[#0f8b7e]"/></button>
}

function DoctorsPage({ doctors, query, setQuery, specialty, setSpecialty, openBook }) {
  const specialties = ['All specialties', ...new Set(doctors.map(d => d.specialty))]
  return <div><div className="mb-8 rounded-[24px] bg-[#e9f6f1] p-6 sm:p-8"><div className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0f9889]">CARE THAT FITS YOU</div><h2 className="display-font mt-2 text-[27px] font-extrabold tracking-[-.04em] sm:text-[32px]">Find your doctor</h2><p className="mt-2 max-w-lg text-[12px] leading-6 text-[#66847c]">Explore experienced specialists and book a visit at a time that works for you.</p><div className="mt-5 grid gap-3 sm:grid-cols-[1fr_230px]"><label className="relative block"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8aa49d]"/><input value={query} onChange={e => setQuery(e.target.value)} className="field h-[47px] border-white pl-11 text-[12px] shadow-sm" placeholder="Search doctor or specialty..."/></label><select value={specialty} onChange={e => setSpecialty(e.target.value)} className="field h-[47px] border-white text-[12px] shadow-sm">{specialties.map(s => <option key={s}>{s}</option>)}</select></div></div><SectionTitle eyebrow="OUR MEDICAL TEAM" title={`${doctors.length} specialists to choose from`} subtitle="Find care from doctors across a range of specialties."/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{doctors.map(doctor => <DoctorCard key={doctor.id} doctor={doctor} onBook={() => openBook(doctor)}/>)}</div>{doctors.length === 0 && <EmptyState title="No doctors found" desc="Try another name or specialty." action="Clear filters" onAction={() => {setQuery('');setSpecialty('All specialties')}}/>}</div>
}

function DoctorCard({ doctor, onBook }) {
  const colors = { mint: 'bg-[#dff3ea] text-[#167d69]', lavender: 'bg-[#ece7ff] text-[#7866bd]', peach: 'bg-[#ffeadb] text-[#b8754e]', blue: 'bg-[#e0edff] text-[#4d7eb9]', rose: 'bg-[#ffe5ed] text-[#b76580]', gold: 'bg-[#fff0c9] text-[#a47c24]' }
  return <div className="panel soft-shadow group p-5 transition hover:-translate-y-0.5 hover:border-[#c9e6dd] sm:p-5"><div className="flex items-start justify-between"><div className={`flex h-[58px] w-[58px] items-center justify-center rounded-[19px] text-[17px] font-extrabold ${colors[doctor.color]}`}>{doctor.initials}</div><div className="flex items-center gap-1 rounded-full bg-[#fff8e8] px-2.5 py-1.5 text-[10px] font-bold text-[#a47b25]"><Star size={12} fill="currentColor"/>{doctor.rating}</div></div><div className="mt-4 text-[15px] font-extrabold">{doctor.name}</div><div className="mt-1 text-[11px] font-semibold text-[#0d9183]">{doctor.specialty}</div><div className="mt-3 flex items-center gap-2 text-[10px] text-[#829992]"><Clock3 size={13}/>{doctor.experience}</div><div className="mt-1.5 flex items-center gap-2 text-[10px] text-[#829992]"><Stethoscope size={13}/>{doctor.clinic}</div><div className="my-4 border-t border-[#edf2f0]"/><div className="flex items-center justify-between gap-3"><div><div className="text-[9px] text-[#91a69f]">Consultation fee</div><div className="mt-0.5 text-[17px] font-extrabold">{money(doctor.fee)}</div></div><button onClick={onBook} disabled={!doctor.available} className="rounded-xl bg-[#0f766e] px-4 py-2.5 text-[11px] font-bold text-white transition hover:bg-[#095e57] disabled:cursor-not-allowed disabled:bg-[#e8efed] disabled:text-[#8aa09a]">{doctor.available ? 'Book visit' : 'Unavailable'}</button></div><div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold"><span className={`h-1.5 w-1.5 rounded-full ${doctor.available ? 'bg-[#25b58e]' : 'bg-[#d6a35a]'}`}/><span className={doctor.available ? 'text-[#3c9b7c]' : 'text-[#a17c47]'}>{doctor.available ? 'Accepting appointments' : 'Currently unavailable'}</span></div></div>
}

function AppointmentsPage({ appointments, doctors, cancelAppointment, navigate }) {
  const [filter, setFilter] = useState('All')
  const filtered = appointments.filter(a => filter === 'All' || a.status === filter).sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
  return <div><div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[.19em] text-[#0f9889]">YOUR CARE PLAN</div><h2 className="display-font text-[25px] font-extrabold tracking-[-.04em]">My appointments</h2><p className="mt-1.5 text-[12px] text-[#819791]">Keep track of your visits and appointment requests.</p></div><button onClick={() => navigate('Find Doctors')} className="flex items-center justify-center gap-2 self-start rounded-xl bg-[#0f766e] px-4 py-3 text-[11px] font-bold text-white hover:bg-[#095e57]"><Plus size={15}/> Book new appointment</button></div><div className="mb-5 flex flex-wrap gap-2">{['All','Confirmed','Pending','Cancelled','Completed'].map(f => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-[11px] font-bold transition ${filter === f ? 'bg-[#0f766e] text-white' : 'border border-[#e2ece8] bg-white text-[#6c8881] hover:border-[#a8d5c9]'}`}>{f}</button>)}</div>{filtered.length ? <div className="space-y-3">{filtered.map(item => <AppointmentCard key={item.id} appointment={item} doctor={doctors.find(d => d.id === item.doctorId)} cancelAppointment={cancelAppointment}/>)}</div> : <EmptyState title="Nothing to show here" desc={filter === 'All' ? 'You have no appointments yet. Find a doctor to get started.' : `You don't have any ${filter.toLowerCase()} appointments.`} action="Find a doctor" onAction={() => navigate('Find Doctors')}/>}<div className="mt-6 flex gap-3 rounded-2xl border border-[#e5efeb] bg-white p-4"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#0f9889]"/><p className="text-[11px] leading-5 text-[#7b938d]">Your appointments are loaded from the MediFlow backend. Cancellation will be available once the backend exposes a cancellation endpoint.</p></div></div>
}

function AppointmentCard({ appointment, doctor, compact = false, cancelAppointment }) {
  if (!doctor) return null
  const statusStyle = { Confirmed: 'bg-[#e5f7ed] text-[#21845d]', Pending: 'bg-[#fff5df] text-[#a4771e]', Cancelled: 'bg-[#fcebec] text-[#b6555b]' }
  return <div className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"><div className="flex h-[62px] w-[62px] shrink-0 flex-col items-center justify-center rounded-2xl bg-[#e8f6f1] text-[#0c8578]"><span className="text-[9px] font-extrabold uppercase">{new Date(`${appointment.date}T12:00:00`).toLocaleDateString('en-IN',{month:'short'})}</span><span className="display-font text-[23px] font-extrabold leading-7">{new Date(`${appointment.date}T12:00:00`).getDate()}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><div className="text-[13px] font-extrabold">{doctor.name}</div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${statusStyle[appointment.status] || statusStyle.Pending}`}>{appointment.status}</span></div><div className="mt-1 text-[11px] font-semibold text-[#0f9182]">{doctor.specialty}</div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#819791]"><span className="flex items-center gap-1.5"><CalendarDays size={12}/>{prettyDate(appointment.date)}</span><span className="flex items-center gap-1.5"><Clock3 size={12}/>{appointment.time}</span></div>{!compact && appointment.reason && <div className="mt-2 text-[10px] text-[#819791]">Reason: {appointment.reason}</div>}</div><div className="flex items-center justify-between gap-3 border-t border-[#edf2f0] pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0"><div className="text-[15px] font-extrabold">{money(doctor.fee)}</div>{appointment.status !== 'Cancelled' && cancelAppointment && <button onClick={() => cancelAppointment(appointment.id)} className="text-[10px] font-bold text-[#b65b5b] hover:underline">Cancel appointment</button>}</div></div>
}

function EmptyState({ title, desc, action, onAction }) {
  return <div className="panel flex flex-col items-center px-5 py-12 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f6f1] text-[#0f8b7e]"><CalendarDays size={24}/></div><h3 className="mt-4 text-[14px] font-extrabold">{title}</h3><p className="mt-2 max-w-sm text-[11px] leading-5 text-[#829992]">{desc}</p>{action && <button onClick={onAction} className="mt-5 rounded-xl bg-[#0f766e] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#095e57]">{action}</button>}</div>
}

function BookingModal({ doctor, close, submit }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const minDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,10)
  const onSubmit = async (event) => { event.preventDefault(); setError(''); if (!date || date < minDate) { setError('Please choose today or a future date.'); return } try { await submit({ date, time, reason: reason.trim() }) } catch (error) { setError(error.message || 'Could not book this appointment.') } }
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#153d38]/45 p-4 backdrop-blur-sm" onMouseDown={e => {if(e.target === e.currentTarget) close()}}><div className="my-auto w-full max-w-[500px] rounded-[26px] bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><div className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0f9889]">BOOK A CONSULTATION</div><h2 className="display-font mt-2 text-[23px] font-extrabold">Schedule your visit</h2><p className="mt-1 text-[11px] text-[#819791]">Choose a date and time that works for you.</p></div><button onClick={close} className="rounded-xl bg-[#f4f8f7] p-2 text-[#68847e] hover:bg-[#e8f2ef]" aria-label="Close booking"><X size={18}/></button></div><div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#eff8f4] p-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d8eee5] text-[13px] font-extrabold text-[#0f766e]">{doctor.initials}</div><div className="min-w-0 flex-1"><div className="text-[13px] font-extrabold">{doctor.name}</div><div className="mt-1 text-[10px] text-[#0f8b7e]">{doctor.specialty}</div></div><div className="text-right"><div className="text-[9px] text-[#829992]">Consultation</div><div className="text-[15px] font-extrabold">{money(doctor.fee)}</div></div></div><form onSubmit={onSubmit} className="mt-5 space-y-4"><label className="block"><span className="mb-1.5 block text-[11px] font-bold">Appointment date *</span><input required type="date" min={minDate} value={date} onChange={e => setDate(e.target.value)} className="field text-[12px]"/></label><label className="block"><span className="mb-1.5 block text-[11px] font-bold">Preferred time *</span><select value={time} onChange={e => setTime(e.target.value)} className="field text-[12px]"><option value="09:00">9:00 AM</option><option value="10:00">10:00 AM</option><option value="10:30">10:30 AM</option><option value="11:00">11:00 AM</option><option value="12:00">12:00 PM</option><option value="14:00">2:00 PM</option><option value="15:00">3:00 PM</option><option value="16:00">4:00 PM</option></select></label><label className="block"><span className="mb-1.5 block text-[11px] font-bold">Reason for visit <span className="font-normal text-[#9aaca7]">(optional)</span></span><textarea value={reason} onChange={e => setReason(e.target.value)} rows="3" maxLength={300} className="field resize-none text-[12px]" placeholder="Briefly tell us what you'd like help with..."/></label>{error && <p className="text-[11px] font-semibold text-red-600">{error}</p>}<div className="flex gap-3 pt-1"><button type="button" onClick={close} className="flex-1 rounded-xl border border-[#e0eae6] px-4 py-3 text-[11px] font-bold text-[#68847e] hover:bg-[#f7faf9]">Go back</button><button type="submit" className="flex-1 rounded-xl bg-[#0f766e] px-4 py-3 text-[11px] font-bold text-white hover:bg-[#095e57]">Request appointment <ArrowRight size={14} className="ml-1 inline"/></button></div><p className="text-center text-[9px] text-[#9aaca7]">Your request will be sent securely to the MediFlow backend.</p></form></div></div>
}

function AuthModal({ mode, setMode, close, submit }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const onSubmit = async (e) => { e.preventDefault(); setError(''); if (!email.includes('@')) {setError('Enter a valid email address.'); return} if (password.length < 6) {setError('Password must contain at least 6 characters.'); return} if (mode === 'Register' && !name.trim()) {setError('Please enter your name.'); return} try { await submit({ name: name.trim(), email: email.trim(), password, mode }) } catch (error) { setError(error.message || 'Authentication failed. Please try again.') } }
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#153d38]/45 p-4 backdrop-blur-sm" onMouseDown={e => {if(e.target===e.currentTarget) close()}}><div className="w-full max-w-[430px] rounded-[26px] bg-white p-7 shadow-2xl sm:p-8"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f766e] text-white"><HeartPulse size={20}/></div><span className="display-font font-extrabold">MediFlow</span></div><button onClick={close} className="rounded-lg p-2 text-[#78928b] hover:bg-[#f3f8f6]"><X size={18}/></button></div><h2 className="display-font mt-7 text-[25px] font-extrabold">{mode === 'Login' ? 'Welcome back' : 'Create your account'}</h2><p className="mt-1 text-[11px] text-[#819791]">{mode === 'Login' ? 'Sign in to manage your healthcare journey.' : 'Join MediFlow to keep your care connected.'}</p><form onSubmit={onSubmit} className="mt-6 space-y-4">{mode === 'Register' && <label className="block"><span className="mb-1.5 block text-[11px] font-bold">Full name</span><input value={name} onChange={e=>setName(e.target.value)} className="field text-[12px]" placeholder="Your name"/></label>}<label className="block"><span className="mb-1.5 block text-[11px] font-bold">Email address</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="field text-[12px]" placeholder="you@example.com" required/></label><label className="block"><span className="mb-1.5 block text-[11px] font-bold">Password</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="field text-[12px]" placeholder="At least 6 characters" required/></label>{error && <p className="text-[11px] text-red-600">{error}</p>}<button className="w-full rounded-xl bg-[#0f766e] py-3 text-[12px] font-bold text-white hover:bg-[#095e57]">{mode === 'Login' ? 'Sign in' : 'Create account'} <ArrowRight size={15} className="ml-1 inline"/></button></form><p className="mt-5 text-center text-[11px] text-[#819791]">{mode === 'Login' ? "Don't have an account?" : 'Already have an account?'} <button onClick={() => {setMode(mode === 'Login' ? 'Register' : 'Login');setError('')}} className="font-bold text-[#0f8b7e] hover:underline">{mode === 'Login' ? 'Sign up' : 'Sign in'}</button></p><div className="mt-5 rounded-xl bg-[#f4f8f7] p-3 text-[10px] leading-5 text-[#829992]">Your credentials are sent to the MediFlow backend. Passwords are handled by the server; this app stores the returned session token in your browser.</div></div></div>
}

function ProfileModal({ userName, userEmail, loggedIn, close, onLogin }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#153d38]/40 p-4 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget) close()}}><div className="w-full max-w-[380px] rounded-[24px] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="display-font text-[19px] font-extrabold">My profile</h2><button onClick={close} className="rounded-lg p-2 text-[#78928b] hover:bg-[#f3f8f6]" aria-label="Close"><X size={18}/></button></div><div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#eff8f4] p-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d8eee8] text-lg font-extrabold text-[#0f766e]">{userName.slice(0,1).toUpperCase()}</div><div><div className="text-[13px] font-extrabold">{userName}</div><div className="mt-1 text-[10px] text-[#819791]">{userEmail || 'Patient account'}</div></div></div><div className="mt-4 space-y-3"><div className="rounded-xl border border-[#e8efed] p-3"><div className="text-[10px] text-[#91a59f]">Account status</div><div className="mt-1 text-[12px] font-bold">{loggedIn ? 'Authenticated account' : 'Not signed in'}</div></div><div className="rounded-xl border border-[#e8efed] p-3"><div className="text-[10px] text-[#91a59f]">Data connection</div><div className="mt-1 text-[12px] font-bold">{loggedIn ? 'Connected to MediFlow API' : 'Sign in to access appointments'}</div></div></div>{loggedIn ? <button onClick={() => { localStorage.removeItem('mediflow_token'); localStorage.removeItem('mediflow_name'); localStorage.removeItem('mediflow_email'); window.location.reload() }} className="mt-5 w-full rounded-xl bg-[#0f766e] py-3 text-[11px] font-bold text-white">Sign out</button> : <button onClick={onLogin} className="mt-5 w-full rounded-xl bg-[#0f766e] py-3 text-[11px] font-bold text-white">Open login / registration</button>}</div></div>
}

export default App
