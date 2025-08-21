import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Mail, Twitter, Github, Heart } from 'lucide-react'

function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { name: t('footer.features', 'Features'), href: '#features' },
      { name: t('footer.pricing', 'Pricing'), href: '#pricing' },
      { name: t('footer.changelog', 'Changelog'), href: '#changelog' },
    ],
    support: [
      { name: t('footer.help', 'Help Center'), href: '/help' },
      { name: t('footer.contact', 'Contact Us'), href: '/contact' },
      { name: t('footer.status', 'Status'), href: '/status' },
    ],
    legal: [
      { name: t('footer.privacy', 'Privacy Policy'), href: '/privacy' },
      { name: t('footer.terms', 'Terms of Service'), href: '/terms' },
      { name: t('footer.cookies', 'Cookie Policy'), href: '/cookies' },
    ],
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-8 h-8 text-primary-400" />
              <span className="text-2xl font-bold">StudyGenie</span>
            </div>
            <p className="text-gray-400 mb-6">
              {t('footer.description', 'AI-powered personalized study guides that help you learn faster and remember better.')}
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="mailto:support@studygenie.com"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/studygenie"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/studygenie"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.product', 'Product')}</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.support', 'Support')}</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.legal', 'Legal')}</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8 mt-12 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} StudyGenie. {t('footer.rights', 'All rights reserved.')}
          </p>
          
          <div className="flex items-center gap-1 text-gray-400 text-sm mt-4 md:mt-0">
            <span>{t('footer.madeWith', 'Made with')}</span>
            <Heart className="w-4 h-4 text-red-500" />
            <span>{t('footer.forLearners', 'for learners worldwide')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
