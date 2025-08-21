import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from 'react-query'
import { dashboardApi } from '../../services/dashboard'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Calendar, Target, Clock } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'

function ProgressChart() {
  const { t } = useTranslation()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [chartType, setChartType] = useState('line') // 'line' or 'bar'

  const { data: progressData, isLoading } = useQuery(
    ['progressChart', selectedPeriod],
    () => dashboardApi.getProgressByPeriod(selectedPeriod),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    if (selectedPeriod === 'week') {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else if (selectedPeriod === 'month') {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } else {
      return date.toLocaleDateString([], { month: 'short' })
    }
  }

  const chartData = progressData?.progressData?.map(item => ({
    ...item,
    date: formatDate(item.date),
    quizScore: Math.round(item.quizScore || 0),
    studyMinutes: item.studyMinutes || 0
  })) || []

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="medium" message={t('progress.loading', 'Loading progress data...')} />
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h3 className="text-xl font-bold text-gray-900">
            {t('dashboard.progressChart', 'Learning Progress')}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Chart Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('chart.line', 'Line')}
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('chart.bar', 'Bar')}
            </button>
          </div>

          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="week">{t('period.week', 'Last Week')}</option>
            <option value="month">{t('period.month', 'Last Month')}</option>
            <option value="quarter">{t('period.quarter', 'Last Quarter')}</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {t('progress.noData', 'No progress data yet')}
          </h4>
          <p className="text-gray-600">
            {t('progress.noDataDesc', 'Start studying to see your progress here')}
          </p>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  yAxisId="score"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ value: t('chart.quizScore', 'Quiz Score (%)'), angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="time"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ value: t('chart.studyTime', 'Study Time (min)'), angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                  labelFormatter={(label) => t('chart.date', 'Date: {{date}}', { date: label })}
                  formatter={(value, name) => [
                    name === 'quizScore' ? `${value}%` : `${value} min`,
                    name === 'quizScore' ? t('chart.quizScore', 'Quiz Score') : t('chart.studyTime', 'Study Time')
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="score"
                  type="monotone" 
                  dataKey="quizScore" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                  name={t('chart.quizScore', 'Quiz Score (%)')}
                />
                <Line 
                  yAxisId="time"
                  type="monotone" 
                  dataKey="studyMinutes" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#10b981' }}
                  name={t('chart.studyTime', 'Study Time (min)')}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  yAxisId="score"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ value: t('chart.quizScore', 'Quiz Score (%)'), angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="time"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ value: t('chart.studyTime', 'Study Time (min)'), angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                  labelFormatter={(label) => t('chart.date', 'Date: {{date}}', { date: label })}
                  formatter={(value, name) => [
                    name === 'quizScore' ? `${value}%` : `${value} min`,
                    name === 'quizScore' ? t('chart.quizScore', 'Quiz Score') : t('chart.studyTime', 'Study Time')
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="score"
                  dataKey="quizScore" 
                  fill="#3b82f6" 
                  name={t('chart.quizScore', 'Quiz Score (%)')}
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  yAxisId="time"
                  dataKey="studyMinutes" 
                  fill="#10b981" 
                  name={t('chart.studyTime', 'Study Time (min)')}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Stats */}
      {progressData?.summary && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{t('summary.activeDays', 'Active Days')}</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {progressData.summary.activeDays}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{t('summary.avgScore', 'Avg Score')}</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {progressData.summary.averageScore}%
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{t('summary.totalTime', 'Total Time')}</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(progressData.summary.totalStudyTime / 60)}h
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{t('summary.trend', 'Trend')}</span>
              </div>
              <div className={`text-lg font-semibold ${
                progressData.summary.averageScore >= 80 ? 'text-green-600' :
                progressData.summary.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {progressData.summary.averageScore >= 80 ? '📈' :
                 progressData.summary.averageScore >= 60 ? '📊' : '📉'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressChart
