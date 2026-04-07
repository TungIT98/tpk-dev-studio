'use client'

import { useState } from 'react'

const inquiryTypes = [
  'New Game Development',
  'Game Redesign/Update',
  'Performance Optimization',
  'Monetization Consulting',
  'Other',
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    inquiryType: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would submit to an API endpoint
    setSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (submitted) {
    return (
      <div className="flex flex-col">
        <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900">
                Thank You!
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                We&apos;ve received your inquiry and will get back to you within 24-48 hours.
              </p>
              <a
                href="/"
                className="inline-block rounded-lg bg-primary-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-primary-700"
              >
                Back to Portfolio
              </a>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900">
              Get in Touch
            </h1>
            <p className="text-xl text-slate-600">
              Interested in working with us? Fill out the form below and we&apos;ll get back to you shortly.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <div className="mb-6">
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-900">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Your name"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-900">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="you@company.com"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="company" className="mb-2 block text-sm font-medium text-slate-900">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Your company name"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="inquiryType" className="mb-2 block text-sm font-medium text-slate-900">
                  Inquiry Type *
                </label>
                <select
                  id="inquiryType"
                  name="inquiryType"
                  required
                  value={formData.inquiryType}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">Select an option</option>
                  {inquiryTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-slate-900">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Tell us about your project..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-primary-700"
              >
                Send Inquiry
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Email</h3>
              <p className="text-slate-600">contact@tkpdevstudio.com</p>
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Location</h3>
              <p className="text-slate-600">Remote Worldwide</p>
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Response Time</h3>
              <p className="text-slate-600">24-48 hours</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
