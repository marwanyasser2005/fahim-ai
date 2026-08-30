import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { assessmentResults, userProfile } = await req.json()

    // Simple AI-like logic for generating personalized learning paths
    const generateLearningPath = (results: any[], profile: any) => {
      const skillLevels = {
        programming: 0,
        mathematics: 0,
        ai: 0,
        stem: 0
      }

      // Analyze assessment results
      results.forEach(result => {
        const category = result.category || 'programming'
        const score = result.score || 0
        skillLevels[category as keyof typeof skillLevels] = Math.max(
          skillLevels[category as keyof typeof skillLevels], 
          score
        )
      })

      // Generate recommendations based on skill levels
      const recommendations = []

      if (skillLevels.programming < 60) {
        recommendations.push({
          courseId: 'programming-basics',
          title: 'Programming Fundamentals',
          priority: 'high',
          reason: 'Build strong programming foundation'
        })
      }

      if (skillLevels.mathematics < 70) {
        recommendations.push({
          courseId: 'math-for-programming',
          title: 'Mathematics for Programming',
          priority: 'medium',
          reason: 'Strengthen mathematical concepts'
        })
      }

      if (skillLevels.programming >= 70 && skillLevels.ai < 50) {
        recommendations.push({
          courseId: 'ai-introduction',
          title: 'Introduction to AI',
          priority: 'high',
          reason: 'Ready for AI concepts'
        })
      }

      if (skillLevels.stem < 60) {
        recommendations.push({
          courseId: 'stem-basics',
          title: 'STEM Fundamentals',
          priority: 'medium',
          reason: 'Build STEM knowledge base'
        })
      }

      return {
        skillLevels,
        recommendations: recommendations.sort((a, b) => 
          a.priority === 'high' ? -1 : b.priority === 'high' ? 1 : 0
        ),
        estimatedDuration: recommendations.length * 8, // weeks
        difficultyProgression: 'gradual'
      }
    }

    const learningPath = generateLearningPath(assessmentResults, userProfile)

    return new Response(
      JSON.stringify(learningPath),
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