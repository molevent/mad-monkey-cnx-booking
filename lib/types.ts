export type BookingStatus = 
  | 'PENDING_REVIEW'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_UPLOADED'
  | 'CONFIRMED'
  | 'CANCELLED'

export type RouteDifficulty = 'Easy' | 'Medium' | 'Hard'

export interface Participant {
  name: string
  height: string
  helmet_size: string
  dietary: string
}

export interface Route {
  id: string
  created_at: string
  updated_at: string
  title: string
  slug: string
  description: string | null
  difficulty: RouteDifficulty
  duration: string | null
  price: number
  cover_image_url: string | null
  komoot_iframe: string | null
  is_active: boolean
  discount_type: 'none' | 'fixed' | 'percentage'
  discount_value: number
  discount_from_pax: number
  distance_mi: number | null
  avg_speed_mph: number | null
  uphill_ft: number | null
  downhill_ft: number | null
}

export interface Customer {
  id: string
  created_at: string
  updated_at: string
  email: string
  full_name: string
  whatsapp: string | null
  passport_no: string | null
  nationality: string | null
  notes: string | null
  total_bookings: number
  last_booking_at: string | null
}

export interface Booking {
  id: string
  created_at: string
  updated_at: string
  tour_date: string
  start_time: string
  route_id: string
  customer_id: string | null
  customer_name: string
  customer_email: string
  customer_whatsapp: string | null
  pax_count: number
  participants_info: Participant[]
  status: BookingStatus
  admin_notes: string | null
  payment_slip_url: string | null
  waiver_signature_url: string | null
  waiver_pdf_url: string | null
  waiver_info: WaiverInfo[] | null
  custom_total: number | null
  payment_option: 'deposit_50' | 'full_100' | 'pay_at_venue' | null
  payment_status: 'unpaid' | 'deposit_paid' | 'fully_paid'
  amount_paid: number
  checked_in: boolean
  checked_in_at: string | null
  tracking_token: string
  route?: Route
  customer?: Customer
}

export interface WaiverInfo {
  participant_index: number
  signer_name: string
  passport_no: string
  date: string
  email: string
  signed: boolean
  signature_url?: string | null
}

export interface BookingFormData {
  tour_date: string
  start_time: string
  route_id: string
  customer_name: string
  customer_email: string
  customer_whatsapp: string
  pax_count: number
  participants_info: Participant[]
}
