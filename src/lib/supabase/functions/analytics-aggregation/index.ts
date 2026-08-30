import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { timeRange, courseId, teacherId } = await req.json()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Aggregate enrollment data
    let enrollmentQuery = supabaseClient
      .from('enrollments')
      .select('*, course:courses(*)')
      .gte('enrolled_at', startDate.toISOString())
      .lte('enrolled_at', endDate.toISOString())

    if (courseId) {
      enrollmentQuery = enrollmentQuery.eq('course_id', courseId)
    }

    if (teacherId) {
      enrollmentQuery = enrollmentQuery.eq('course.teacher_id', teacherId)
    }

    const { data: enrollments } = await enrollmentQuery

    // Aggregate assessment data
    let assessmentQuery = supabaseClient
      .from('student_assessments')
      .select('*, assessment:assessments(*, course:courses(*))')
      .gte('submitted_at', startDate.toISOString())
      .lte('submitted_at', endDate.toISOString())

    if (courseId) {
      assessmentQuery = assessmentQuery.eq('assessment.course_id', courseId)
    }

    const { data: assessments } = await assessmentQuery

    // Aggregate progress data
    let progressQuery = supabaseClient
      .from('progress_tracking')
      .select('*, course:courses(*)')
      .gte('updated_at', startDate.toISOString())
      .lte('updated_at', endDate.toISOString())

    if (courseId) {
      progressQuery = progressQuery.eq('course_id', courseId)
    }

    const { data: progress } = await progressQuery

    // Calculate analytics
    const analytics = {
      enrollments: {
        total: enrollments?.length || 0,
        byDay: {},
        byCourse: {}
      },
      assessments: {
        total: assessments?.length || 0,
        averageScore: assessments?.reduce((sum, a) => sum + a.score, 0) / (assessments?.length || 1),
        completionRate: 0,
        byDifficulty: {}
      },
      progress: {
        totalLessonsCompleted: progress?.filter(p => p.status === 'completed').length || 0,
        averageCompletionTime: 0,
        dropoffPoints: []
      },
      engagement: {
        activeUsers: new Set(progress?.map(p => p.student_id)).size,
        averageSessionTime: 0,
        retentionRate: 0
      }
    }

    // Group enrollments by day
    enrollments?.forEach(enrollment => {
      const day = new Date(enrollment.enrolled_at).toISOString().split('T')[0]
      analytics.enrollments.byDay[day] = (analytics.enrollments.byDay[day] || 0) + 1
    })

    // Group enrollments by course
    enrollments?.forEach(enrollment => {
      const courseTitle = enrollment.course?.title || 'Unknown'
      analytics.enrollments.byCourse[courseTitle] = (analytics.enrollments.byCourse[courseTitle] || 0) + 1
    })

    return new Response(
      JSON.stringify(analytics),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})