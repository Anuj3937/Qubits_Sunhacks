import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { tutorApi } from '../../services/tutor'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  Clock,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Volume2,
  RotateCcw,
  Trash2,
  Settings,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../common/LoadingSpinner'

function AITutor({ materialId, materialName }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const [conversationSettings, setConversationSettings] = useState({
    language: 'English',
    complexity: 'detailed'
  })

  // Fetch conversation history
  const { data: conversationData, isLoading } = useQuery(
    ['tutorConversation', materialId],
    () => tutorApi.getConversationHistory(materialId),
    {
      enabled: !!materialId,
      staleTime: 30 * 1000, // 30 seconds
    }
  )

  // Fetch suggested questions
  const { data: suggestionsData } = useQuery(
    ['tutorSuggestions', materialId, conversationSettings.language],
    () => tutorApi.getSuggestedQuestions(materialId, { language: conversationSettings.language }),
    {
      enabled: !!materialId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Send message mutation
  const sendMessageMutation = useMutation(tutorApi.askQuestion, {
    onMutate: () => {
      setIsTyping(true)
      setMessage('')
    },
    onSuccess: (data) => {
      setIsTyping(false)
      queryClient.invalidateQueries(['tutorConversation', materialId])
      toast.success(t('tutor.questionSent', 'Question sent successfully!'))
      
      // Scroll to bottom
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    },
    onError: (error) => {
      setIsTyping(false)
      toast.error(t('tutor.error', 'Failed to send question. Please try again.'))
      console.error('Tutor error:', error)
    }
  })

  // Clear conversation mutation
  const clearConversationMutation = useMutation(tutorApi.clearConversationHistory, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tutorConversation', materialId])
      toast.success(t('tutor.conversationCleared', 'Conversation cleared'))
    },
    onError: () => {
      toast.error(t('tutor.clearError', 'Failed to clear conversation'))
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversationData?.conversations])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim() || sendMessageMutation.isLoading) return

    sendMessageMutation.mutate({
      materialId,
      question: message.trim(),
      ...conversationSettings
    })
  }

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion)
    inputRef.current?.focus()
  }

  const handleClearConversation = () => {
    if (window.confirm(t('tutor.confirmClear', 'Are you sure you want to clear the conversation history?'))) {
      clearConversationMutation.mutate(materialId)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('tutor.copied', 'Copied to clipboard'))
    } catch (error) {
      toast.error(t('tutor.copyError', 'Failed to copy'))
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const conversations = conversationData?.conversations || []
  const suggestions = suggestionsData?.suggestions || {}

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" message={t('tutor.loadingConversation', 'Loading conversation...')} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto h-[700px] flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {t('tutor.title', 'AI Tutor')}
              </h2>
              <p className="text-blue-100 text-sm">
                {materialName || t('tutor.subtitle', 'Ask me anything about your study material')}
              </p>
            </div>
          </div>

          {/* Settings & Actions */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={conversationSettings.language}
              onChange={(e) => setConversationSettings(prev => ({ ...prev, language: e.target.value }))}
              className="bg-white/20 text-white text-sm rounded px-2 py-1 border border-white/30"
            >
              <option value="English">English</option>
              <option value="Hindi">हिन्दी</option>
              <option value="Spanish">Español</option>
              <option value="French">Français</option>
              <option value="German">Deutsch</option>
            </select>

            {/* Complexity Selector */}
            <select
              value={conversationSettings.complexity}
              onChange={(e) => setConversationSettings(prev => ({ ...prev, complexity: e.target.value }))}
              className="bg-white/20 text-white text-sm rounded px-2 py-1 border border-white/30"
            >
              <option value="simple">{t('tutor.complexity.simple', 'Simple')}</option>
              <option value="detailed">{t('tutor.complexity.detailed', 'Detailed')}</option>
              <option value="advanced">{t('tutor.complexity.advanced', 'Advanced')}</option>
            </select>

            {/* Clear Button */}
            {conversations.length > 0 && (
              <button
                onClick={handleClearConversation}
                disabled={clearConversationMutation.isLoading}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                title={t('tutor.clearConversation', 'Clear conversation')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {conversations.length === 0 && !isTyping && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('tutor.welcome', 'Welcome to your AI Tutor!')}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {t('tutor.welcomeMessage', 'I\'m here to help you understand your study material better. Ask me any question!')}
            </p>
          </div>
        )}

        <AnimatePresence>
          {conversations.map((conv, index) => (
            <div key={index} className="space-y-4">
              {/* User Message */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-end"
              >
                <div className="flex items-end gap-2 max-w-[80%]">
                  <div className="bg-primary-600 text-white rounded-2xl rounded-br-sm px-4 py-3">
                    <p className="text-sm">{conv.question}</p>
                  </div>
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* AI Response */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex justify-start"
              >
                <div className="flex items-start gap-2 max-w-[80%]">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{conv.answer}</p>
                    
                    {/* Message Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        {formatTime(conv.timestamp)}
                      </span>
                      
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={() => copyToClipboard(conv.answer)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title={t('tutor.copy', 'Copy')}
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                        
                        <button
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title={t('tutor.helpful', 'Helpful')}
                        >
                          <ThumbsUp className="w-3 h-3 text-gray-400" />
                        </button>
                        
                        <button
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title={t('tutor.notHelpful', 'Not helpful')}
                        >
                          <ThumbsDown className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200">
              <div className="flex items-center gap-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-xs text-gray-500 ml-2">
                  {t('tutor.thinking', 'Thinking...')}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {conversations.length === 0 && suggestions && Object.keys(suggestions).length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">
              {t('tutor.suggestedQuestions', 'Suggested Questions')}
            </span>
          </div>
          
          <div className="space-y-2">
            {Object.entries(suggestions).map(([category, questions]) => (
              <div key={category}>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  {t(`tutor.categories.${category}`, category)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {questions.slice(0, 2).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(question)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('tutor.askQuestion', 'Ask a question about your study material...')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows="2"
              maxLength={500}
              disabled={sendMessageMutation.isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                {message.length}/500
              </span>
              <span className="text-xs text-gray-500">
                {t('tutor.enterToSend', 'Enter to send, Shift+Enter for new line')}
              </span>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isLoading}
            className="p-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex-shrink-0"
          >
            {sendMessageMutation.isLoading ? (
              <RotateCcw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AITutor
