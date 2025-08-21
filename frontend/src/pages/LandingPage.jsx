import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Brain, 
  FileText, 
  MessageCircle, 
  BarChart3, 
  Languages,
  ArrowRight,
  Star,
  Users,
  CheckCircle
} from 'lucide-react'
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'

function LandingPage() {
  const { t } = useTranslation()

  const features = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: t('landing.features.upload.title', 'Smart Upload'),
      description: t('landing.features.upload.desc', 'Upload PDFs, images, or handwritten notes. Our AI extracts and processes all content automatically.')
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: t('landing.features.ai.title', 'AI-Powered Learning'),
      description: t('landing.features.ai.desc', 'Get personalized flashcards, quizzes, and study guides generated from your materials.')
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: t('landing.features.tutor.title', 'AI Tutor'),
      description: t('landing.features.tutor.desc', 'Ask questions about your study materials and get instant, detailed explanations.')
    },
    {
      icon: <Languages className="w-8 h-8" />,
      title: t('landing.features.multilingual.title', 'Multilingual Support'),
      description: t('landing.features.multilingual.desc', 'Study in your preferred language with support for 70+ languages.')
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: t('landing.features.analytics.title', 'Progress Tracking'),
      description: t('landing.features.analytics.desc', 'Track your learning progress with detailed analytics and insights.')
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: t('landing.features.spaced.title', 'Spaced Repetition'),
      description: t('landing.features.spaced.desc', 'Optimize your memory with scientifically-backed spaced repetition system.')
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Medical Student",
      content: "StudyGenie transformed my study routine. The AI-generated flashcards are spot-on!",
      rating: 5
    },
    {
      name: "Raj Patel",
      role: "Engineering Student",
      content: "Being able to study in Hindi really helped me understand complex concepts better.",
      rating: 5
    },
    {
      name: "Emma Wilson",
      role: "Law Student",
      content: "The AI tutor is like having a personal teacher available 24/7. Amazing!",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-blue-100 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('landing.hero.title', 'Transform Your Learning with')}
              <span className="text-primary-600 block">AI-Powered StudyGenie</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('landing.hero.subtitle', 'Upload your study materials and get personalized quizzes, flashcards, and an AI tutor that speaks your language.')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/signup" 
                className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
              >
                {t('landing.hero.getStarted', 'Get Started Free')}
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link 
                to="/login" 
                className="btn-secondary text-lg px-8 py-4"
              >
                {t('auth.login', 'Sign In')}
              </Link>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {t('landing.hero.free', 'Free to start')}
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {t('landing.hero.noCredit', 'No credit card required')}
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {t('landing.hero.multilingual', '70+ languages')}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('landing.features.title', 'Powerful Features for Effective Learning')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.features.subtitle', 'Everything you need to study smarter, not harder')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-hover text-center"
              >
                <div className="text-primary-600 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('landing.howItWorks.title', 'How StudyGenie Works')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('landing.howItWorks.subtitle', 'Get started in just 3 simple steps')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: t('landing.steps.upload.title', 'Upload Your Materials'),
                description: t('landing.steps.upload.desc', 'Upload PDFs, notes, or images. Our AI will extract and understand the content.')
              },
              {
                step: '2', 
                title: t('landing.steps.generate.title', 'AI Generates Study Tools'),
                description: t('landing.steps.generate.desc', 'Get personalized flashcards, quizzes, and summaries in seconds.')
              },
              {
                step: '3',
                title: t('landing.steps.learn.title', 'Study & Track Progress'),
                description: t('landing.steps.learn.desc', 'Use spaced repetition, ask the AI tutor, and track your learning progress.')
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('landing.testimonials.title', 'What Students Say')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('landing.testimonials.subtitle', 'Join thousands of successful learners')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card text-center"
              >
                <div className="flex justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              {t('landing.cta.title', 'Ready to Transform Your Learning?')}
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {t('landing.cta.subtitle', 'Join thousands of students who are already studying smarter with AI-powered tools.')}
            </p>
            
            <Link 
              to="/signup"
              className="bg-white text-primary-600 hover:bg-gray-100 font-semibold text-lg px-8 py-4 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              {t('landing.cta.button', 'Start Learning Today')}
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <div className="mt-6 flex items-center justify-center gap-4 text-blue-100 text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>10,000+ students</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Languages className="w-4 h-4" />
                <span>70+ languages</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>4.9/5 rating</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage
