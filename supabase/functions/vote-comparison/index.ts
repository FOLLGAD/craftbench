
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Database } from '../_shared/database.types.ts'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Supabase client setup
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// ELO calculation constants
const K_FACTOR = 32 // Standard K-factor for ELO

/**
 * Calculate new Elo ratings after a match
 * @param winnerElo Current Elo of the winner
 * @param loserElo Current Elo of the loser
 * @returns New Elo ratings for both models
 */
function calculateElo(winnerElo: number, loserElo: number) {
  // Calculate expected scores
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400))
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400))
  
  // Calculate new ratings
  const newWinnerElo = winnerElo + K_FACTOR * (1 - expectedWinner)
  const newLoserElo = loserElo + K_FACTOR * (0 - expectedLoser)
  
  return {
    winnerElo: Math.round(newWinnerElo),
    loserElo: Math.round(newLoserElo)
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get the request payload
    const { comparisonId, generationId } = await req.json()
    
    if (!comparisonId || !generationId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Verify the authenticated user
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const userId = user.id
    
    // Check if user has already voted on this comparison
    const { data: existingVotes, error: voteCheckError } = await supabase
      .from('mc-votes')
      .select('id')
      .eq('comparison_id', comparisonId)
      .eq('user_id', userId)
    
    if (voteCheckError) {
      console.error('Vote check error:', voteCheckError)
      return new Response(JSON.stringify({ error: 'Failed to check existing votes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (existingVotes && existingVotes.length > 0) {
      return new Response(JSON.stringify({ error: 'User has already voted on this comparison' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Get comparison to find which models are involved
    const { data: comparison, error: comparisonError } = await supabase
      .from('mc-comparisons')
      .select(`
        id, 
        generation_a_id, 
        generation_b_id,
        generation_a:mc-generations!generation_a_id(id, model_name),
        generation_b:mc-generations!generation_b_id(id, model_name)
      `)
      .eq('id', comparisonId)
      .single()
    
    if (comparisonError || !comparison) {
      console.error('Comparison error:', comparisonError)
      return new Response(JSON.stringify({ error: 'Failed to retrieve comparison' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Determine winning and losing model
    const winningGeneration = generationId === comparison.generation_a_id 
      ? comparison.generation_a 
      : comparison.generation_b
      
    const losingGeneration = generationId === comparison.generation_a_id 
      ? comparison.generation_b 
      : comparison.generation_a
    
    if (!winningGeneration || !losingGeneration) {
      return new Response(JSON.stringify({ error: 'Invalid generation ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const winningModelName = winningGeneration.model_name
    const losingModelName = losingGeneration.model_name
    
    // Get current ELO ratings
    const { data: models, error: modelsError } = await supabase
      .from('mc-models')
      .select('model_name, elo')
      .in('model_name', [winningModelName, losingModelName])
    
    if (modelsError || !models) {
      console.error('Models error:', modelsError)
      return new Response(JSON.stringify({ error: 'Failed to retrieve model ratings' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const winnerModel = models.find(m => m.model_name === winningModelName)
    const loserModel = models.find(m => m.model_name === losingModelName)
    
    if (!winnerModel || !loserModel) {
      return new Response(JSON.stringify({ error: 'Models not found in ratings table' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Calculate new ELO ratings
    const { winnerElo, loserElo } = calculateElo(winnerModel.elo, loserModel.elo)
    
    // Begin transaction
    const { error: transactionError } = await supabase.rpc('vote_and_update_elo', {
      p_comparison_id: comparisonId,
      p_generation_id: generationId,
      p_user_id: userId,
      p_winning_model: winningModelName,
      p_losing_model: losingModelName, 
      p_winner_new_elo: winnerElo,
      p_loser_new_elo: loserElo
    })
    
    if (transactionError) {
      console.error('Transaction error:', transactionError)
      
      // Fallback to individual operations if RPC fails
      console.log('Falling back to individual operations')
      
      // Record the vote
      const { error: voteError } = await supabase
        .from('mc-votes')
        .insert({
          comparison_id: comparisonId,
          generation_id: generationId,
          user_id: userId,
          vote: 1
        })
      
      if (voteError) {
        console.error('Vote insertion error:', voteError)
        return new Response(JSON.stringify({ error: 'Failed to record vote' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      // Update winner ELO
      const { error: winnerUpdateError } = await supabase
        .from('mc-models')
        .update({ elo: winnerElo })
        .eq('model_name', winningModelName)
      
      if (winnerUpdateError) {
        console.error('Winner update error:', winnerUpdateError)
        return new Response(JSON.stringify({ error: 'Failed to update winner rating' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      // Update loser ELO
      const { error: loserUpdateError } = await supabase
        .from('mc-models')
        .update({ elo: loserElo })
        .eq('model_name', losingModelName)
      
      if (loserUpdateError) {
        console.error('Loser update error:', loserUpdateError)
        return new Response(JSON.stringify({ error: 'Failed to update loser rating' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      winnerElo,
      loserElo,
      winningModelName,
      losingModelName
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
