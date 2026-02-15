import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(time: string): string {
  if (!time || time === '00:00' || time === '00:00:00') return 'To be confirmed'
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  if (isNaN(hour)) return 'To be confirmed'
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(price)
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'bg-yellow-100 text-yellow-800'
    case 'AWAITING_PAYMENT':
      return 'bg-blue-100 text-blue-800'
    case 'PAYMENT_UPLOADED':
      return 'bg-purple-100 text-purple-800'
    case 'CONFIRMED':
      return 'bg-orange-100 text-orange-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'Pending Review'
    case 'AWAITING_PAYMENT':
      return 'Awaiting Payment'
    case 'PAYMENT_UPLOADED':
      return 'Payment Uploaded'
    case 'CONFIRMED':
      return 'Confirmed'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return status
  }
}

export function calculateTotalWithDiscount(
  pricePerPerson: number,
  paxCount: number,
  discountType: 'none' | 'fixed' | 'percentage' = 'none',
  discountValue: number = 0,
  discountFromPax: number = 2
): { total: number; breakdown: { rider: number; price: number }[] } {
  const breakdown: { rider: number; price: number }[] = []
  let total = 0

  for (let i = 1; i <= paxCount; i++) {
    let price = pricePerPerson
    if (discountType !== 'none' && i >= discountFromPax && discountValue > 0) {
      if (discountType === 'fixed') {
        price = Math.max(0, pricePerPerson - discountValue)
      } else if (discountType === 'percentage') {
        price = pricePerPerson * (1 - discountValue / 100)
      }
    }
    breakdown.push({ rider: i, price })
    total += price
  }

  return { total, breakdown }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}
