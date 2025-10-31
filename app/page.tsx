'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  Brain, 
  BarChart3, 
  Shield, 
  Users, 
  Zap, 
  ArrowRight, 
  Check,
  TrendingUp,
  Target,
  Sparkles
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Real-Time{' '}
              <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                AI Analytics
              </span>
              <br />
              for Solana
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A customizable dashboard for wallets, NFTs, and compliance — powered by AI and NLP.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to get started with AI-powered Solana analytics
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect Your Wallet',
                description: 'Securely connect your Solana wallet to access your personalized dashboard.',
                icon: Wallet,
                color: 'from-purple-500 to-indigo-500',
              },
              {
                step: '02',
                title: 'AI-Powered Dashboard Setup',
                description: 'Our AI automatically analyzes your portfolio and sets up personalized insights and alerts.',
                icon: Brain,
                color: 'from-indigo-500 to-cyan-500',
              },
              {
                step: '03',
                title: 'Get Real-Time Solana Insights',
                description: 'Monitor your portfolio, track NFTs, and receive intelligent recommendations in real-time.',
                icon: BarChart3,
                color: 'from-cyan-500 to-purple-500',
              },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="text-center"
                >
                  <div className="relative mb-6">
                    <div className={`w-20 h-20 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Key Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to monitor and optimize your Solana portfolio
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: BarChart3,
                title: 'Real-Time Analytics',
                description: 'Track your portfolio performance with live updates and detailed charts powered by Helius API.',
                color: 'from-purple-500 to-indigo-500',
              },
              {
                icon: Brain,
                title: 'AI Insights',
                description: 'Get intelligent recommendations powered by machine learning algorithms and NLP analysis.',
                color: 'from-indigo-500 to-cyan-500',
              },
              {
                icon: Zap,
                title: 'Smart Alerts',
                description: 'Never miss important events with customizable notifications for price changes and wallet activity.',
                color: 'from-cyan-500 to-purple-500',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Bank-grade security with multi-wallet monitoring and compliance features.',
                color: 'from-purple-500 to-pink-500',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-white rounded-xl hover:shadow-lg transition shadow-sm border border-gray-200"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Pricing Plans
            </h2>
            <p className="text-lg text-gray-600">Choose the plan that fits your needs</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              {
                name: 'Free',
                price: '$0',
                description: 'Perfect for getting started',
                features: [
                  'Basic portfolio tracking',
                  '1 wallet connected',
                  'Basic alerts',
                  'Community support',
                  'Real-time price data',
                ],
                cta: 'Get Started',
                href: '/login',
                popular: false,
                color: 'from-gray-500 to-gray-600',
              },
              {
                name: 'Pro',
                price: '$19',
                description: 'Unlimited access to all features',
                features: [
                  'Advanced analytics',
                  'Unlimited wallets',
                  'AI-powered insights',
                  'Priority support',
                  'Custom alerts',
                  'Export reports',
                  'NFT tracking',
                  'Team collaboration',
                  'Compliance tools',
                ],
                cta: 'Start Free Trial',
                href: '/login',
                popular: true,
                color: 'from-purple-500 to-indigo-500',
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-8 bg-white rounded-2xl ${
                  plan.popular ? 'ring-4 ring-purple-500 shadow-2xl' : 'shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    {plan.price !== 'Custom' && (
                      <span className="text-gray-500 ml-2">/month</span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Sparkles className="h-6 w-6 text-purple-400 mr-2" />
                Solana Analytics
              </h3>
              <p className="text-gray-400">
                Real-time AI-powered analytics for Solana users.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/admin" className="hover:text-white">Admin</Link></li>
                <li><Link href="/" className="hover:text-white">Home</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Docs</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
                <li><Link href="#" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms</Link></li>
                <li><Link href="#" className="hover:text-white">Security</Link></li>
                <li><Link href="#" className="hover:text-white">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Solana Analytics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}