import { supabase } from './supabase'

async function sendEmail(type, to, data) {
  const { error } = await supabase.functions.invoke('send-email', {
    body: { type, to, data },
  })
  if (error) console.error(`Email (${type}) failed:`, error)
  return !error
}

// Welcome email on signup
export const sendWelcomeEmail = (to, { name, credits = 5 }) =>
  sendEmail('welcome', to, {
    name,
    credits,
    dashboardUrl: `${window.location.origin}/dashboard`,
  })