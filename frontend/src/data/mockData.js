export const doctors = [
  { id: 'd1', name: 'Dr. Ananya Rao', specialty: 'Cardiologist', experience: '12 years experience', fee: 800, rating: '4.9', initials: 'AR', color: 'mint', available: true, clinic: 'MediFlow Care Centre' },
  { id: 'd2', name: 'Dr. Rohan Mehta', specialty: 'Dermatologist', experience: '8 years experience', fee: 600, rating: '4.8', initials: 'RM', color: 'lavender', available: true, clinic: 'MediFlow Care Centre' },
  { id: 'd3', name: 'Dr. Priya Nair', specialty: 'Pediatrician', experience: '10 years experience', fee: 700, rating: '4.9', initials: 'PN', color: 'peach', available: true, clinic: 'MediFlow Care Centre' },
  { id: 'd4', name: 'Dr. Arjun Shah', specialty: 'General Physician', experience: '7 years experience', fee: 500, rating: '4.7', initials: 'AS', color: 'blue', available: false, clinic: 'MediFlow Care Centre' },
  { id: 'd5', name: 'Dr. Meera Iyer', specialty: 'Neurologist', experience: '15 years experience', fee: 1000, rating: '5.0', initials: 'MI', color: 'rose', available: true, clinic: 'MediFlow Care Centre' },
  { id: 'd6', name: 'Dr. Kabir Singh', specialty: 'Orthopedic', experience: '9 years experience', fee: 750, rating: '4.8', initials: 'KS', color: 'gold', available: true, clinic: 'MediFlow Care Centre' },
]

export const initialAppointments = [
  { id: 'a1', doctorId: 'd1', date: '2026-10-25', time: '10:30', reason: 'Routine heart check-up', status: 'Confirmed' },
  { id: 'a2', doctorId: 'd2', date: '2026-10-29', time: '15:00', reason: 'Skin consultation', status: 'Pending' },
]
