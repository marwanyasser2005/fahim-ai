import React, { useState, useEffect } from 'react'
import { getCourses, createCourse } from "@/lib/courses";
import { getProjects } from "@/lib/projects";
import { BookOpen, Users, FileText, Plus, Eye, Edit, Trash2 } from 'lucide-react'

interface TeacherDashboardProps {
  language: 'ar' | 'en'
  user: any
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ language, user }) => {
  const [courses, setCourses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'programming',
    level: 'beginner',
    duration_weeks: 8,
    price: 0
  })

  const content = {
    ar: {
      title: 'لوحة تحكم المدرس',
      welcome: 'مرحباً',
      myCourses: 'دوراتي',
      studentProjects: 'مشاريع الطلاب',
      createCourse: 'إنشاء دورة جديدة',
      courseTitle: 'عنوان الدورة',
      courseDescription: 'وصف الدورة',
      category: 'الفئة',
      level: 'المستوى',
      duration: 'المدة (أسابيع)',
      price: 'السعر',
      create: 'إنشاء',
      cancel: 'إلغاء',
      students: 'طالب',
      lessons: 'درس',
      published: 'منشورة',
      draft: 'مسودة',
      view: 'عرض',
      edit: 'تعديل',
      delete: 'حذف',
      programming: 'البرمجة',
      ai: 'الذكاء الاصطناعي',
      stem: 'العلوم والتقنية',
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      advanced: 'متقدم'
    },
    en: {
      title: 'Teacher Dashboard',
      welcome: 'Welcome',
      myCourses: 'My Courses',
      studentProjects: 'Student Projects',
      createCourse: 'Create New Course',
      courseTitle: 'Course Title',
      courseDescription: 'Course Description',
      category: 'Category',
      level: 'Level',
      duration: 'Duration (weeks)',
      price: 'Price',
      create: 'Create',
      cancel: 'Cancel',
      students: 'students',
      lessons: 'lessons',
      published: 'Published',
      draft: 'Draft',
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
      programming: 'Programming',
      ai: 'Artificial Intelligence',
      stem: 'STEM',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    }
  }

  const isRTL = language === 'ar'

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [coursesRes, projectsRes] = await Promise.all([
        getCourses(false), // Get all courses including unpublished
        getProjects() // Get projects for review
      ])

      if (coursesRes.data) {
        // Filter courses by current teacher
        const teacherCourses = coursesRes.data.filter(course => course.teacher_id === user.id)
        setCourses(teacherCourses)
      }
      if (projectsRes.data) setProjects(projectsRes.data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await createCourse({
        ...newCourse,
        teacher_id: user.id
      })
      
      if (error) throw error
      
      setCourses([data, ...courses])
      setShowCreateCourse(false)
      setNewCourse({
        title: '',
        description: '',
        category: 'programming',
        level: 'beginner',
        duration_weeks: 8,
        price: 0
      })
    } catch (error) {
      console.error('Error creating course:', error)
    }
  }

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {content[language].title}
            </h1>
            <p className="text-lg text-gray-600">
              {content[language].welcome}, {user?.full_name || user?.email}
            </p>
          </div>
          <button
            onClick={() => setShowCreateCourse(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {content[language].createCourse}
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                <p className="text-sm font-medium text-gray-600">{content[language].myCourses}</p>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                <p className="text-sm font-medium text-gray-600">{content[language].studentProjects}</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Courses */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {content[language].myCourses}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {course.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.is_published
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {course.is_published ? content[language].published : content[language].draft}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="text-gray-900">{content[language][course.category as keyof typeof content[typeof language]]}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Level:</span>
                    <span className="text-gray-900">{content[language][course.level as keyof typeof content[typeof language]]}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Duration:</span>
                    <span className="text-gray-900">{course.duration_weeks} weeks</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    ${course.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Projects */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {content[language].studentProjects}
          </h2>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {project.student?.full_name} • {project.course?.title}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'submitted'
                        ? 'bg-blue-100 text-blue-800'
                        : project.status === 'reviewed'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Course Modal */}
        {showCreateCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {content[language].createCourse}
              </h3>
              
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {content[language].courseTitle}
                  </label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {content[language].courseDescription}
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {content[language].category}
                    </label>
                    <select
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="programming">{content[language].programming}</option>
                      <option value="ai">{content[language].ai}</option>
                      <option value="stem">{content[language].stem}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {content[language].level}
                    </label>
                    <select
                      value={newCourse.level}
                      onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="beginner">{content[language].beginner}</option>
                      <option value="intermediate">{content[language].intermediate}</option>
                      <option value="advanced">{content[language].advanced}</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {content[language].duration}
                    </label>
                    <input
                      type="number"
                      value={newCourse.duration_weeks}
                      onChange={(e) => setNewCourse({ ...newCourse, duration_weeks: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {content[language].price}
                    </label>
                    <input
                      type="number"
                      value={newCourse.price}
                      onChange={(e) => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 rtl:space-x-reverse pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {content[language].create}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateCourse(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    {content[language].cancel}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherDashboard