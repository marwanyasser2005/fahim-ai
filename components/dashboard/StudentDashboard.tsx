import React, { useState, useEffect } from 'react'
import { getCourses, createCourse } from "../../lib/courses";
import { getStudentAssessments } from "../../lib/assessments";
import { getProjects } from "../../lib/projects";
import { BookOpen, Trophy, Clock, Target, TrendingUp, Award } from 'lucide-react'

interface StudentDashboardProps {
  language: 'ar' | 'en'
  user: any
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ language, user }) => {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const content = {
    ar: {
      title: 'لوحة تحكم الطالب',
      welcome: 'مرحباً',
      overview: 'نظرة عامة',
      enrolledCourses: 'الدورات المسجلة',
      recentAssessments: 'التقييمات الأخيرة',
      myProjects: 'مشاريعي',
      progress: 'التقدم',
      score: 'النتيجة',
      status: 'الحالة',
      viewCourse: 'عرض الدورة',
      viewProject: 'عرض المشروع',
      completedLessons: 'الدروس المكتملة',
      totalScore: 'إجمالي النقاط',
      averageScore: 'متوسط النقاط',
      projectsSubmitted: 'المشاريع المقدمة'
    },
    en: {
      title: 'Student Dashboard',
      welcome: 'Welcome',
      overview: 'Overview',
      enrolledCourses: 'Enrolled Courses',
      recentAssessments: 'Recent Assessments',
      myProjects: 'My Projects',
      progress: 'Progress',
      score: 'Score',
      status: 'Status',
      viewCourse: 'View Course',
      viewProject: 'View Project',
      completedLessons: 'Completed Lessons',
      totalScore: 'Total Score',
      averageScore: 'Average Score',
      projectsSubmitted: 'Projects Submitted'
    }
  }

  const isRTL = language === 'ar'

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [enrollmentsRes, assessmentsRes, projectsRes] = await Promise.all([
        getEnrollments(),
        getStudentAssessments(),
        getProjects()
      ])

      if (enrollmentsRes.data) setEnrollments(enrollmentsRes.data)
      if (assessmentsRes.data) setAssessments(assessmentsRes.data)
      if (projectsRes.data) setProjects(projectsRes.data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalScore = assessments.reduce((sum, assessment) => sum + assessment.score, 0)
  const averageScore = assessments.length > 0 ? Math.round(totalScore / assessments.length) : 0
  const completedLessons = enrollments.reduce((sum, enrollment) => sum + (enrollment.progress_percentage || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {content[language].title}
          </h1>
          <p className="text-lg text-gray-600">
            {content[language].welcome}, {user?.full_name || user?.email}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                <p className="text-sm font-medium text-gray-600">{content[language].enrolledCourses}</p>
                <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                <p className="text-sm font-medium text-gray-600">{content[language].completedLessons}</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(completedLessons / enrollments.length) || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                <p className="text-sm font-medium text-gray-600">{content[language].averageScore}</p>
                <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                <p className="text-sm font-medium text-gray-600">{content[language].projectsSubmitted}</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Enrolled Courses */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {content[language].enrolledCourses}
            </h2>
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {enrollment.course?.title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {enrollment.progress_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${enrollment.progress_percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {enrollment.course?.teacher?.full_name}
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      {content[language].viewCourse}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Assessments */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {content[language].recentAssessments}
            </h2>
            <div className="space-y-4">
              {assessments.slice(0, 5).map((assessment) => (
                <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {assessment.assessment?.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      assessment.score >= 80 
                        ? 'bg-green-100 text-green-800'
                        : assessment.score >= 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {assessment.score}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {assessment.assessment?.course?.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(assessment.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My Projects */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {content[language].myProjects}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {project.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {project.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : project.status === 'submitted'
                      ? 'bg-blue-100 text-blue-800'
                      : project.status === 'reviewed'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                  {project.grade && (
                    <span className="text-sm font-medium text-gray-900">
                      {project.grade}/100
                    </span>
                  )}
                </div>
                <button className="mt-3 w-full text-blue-600 hover:text-blue-700 text-sm font-medium">
                  {content[language].viewProject}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard