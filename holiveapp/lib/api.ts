const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

type ApiAction = 
  | 'signUp' 
  | 'signIn' 
  | 'signOut' 
  | 'getDashboardData'
  | 'getProfile'
  | 'updateProfile'
  | 'initializeTransaction'
  | 'verifyPayment'
  | 'getTransactionHistory'

interface ApiResponse<T = any> {
  newBalance(newBalance: any): unknown
  data?: T
  error?: string
  status?: string
  message?: string
  
}

export const fetchTransactionHistory = async (
  accessToken: string,
  pagination: {
    page: number
    limit: number
  }
) => {
  return supabaseGateway('getTransactionHistory', {
    access_token: accessToken,
    ...pagination
  })
}

export const supabaseGateway = async <T = any>(
  action: ApiAction, 
  payload: any
): Promise<ApiResponse<T>> => {
  try {
    console.log(`Making API call to ${API_BASE}/api/supabase-gateway with action: ${action}`)
    
    const response = await fetch(`${API_BASE}/api/supabase-gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, payload }),
    })

    console.log('API response status:', response.status)
    
    if (!response.ok) {
      // Try to get error details
      let errorData
      try {
        errorData = await response.json()
      } catch (e) {
        errorData = { error: 'Request failed' }
      }
      console.error('API Error:', errorData.error)
      throw new Error(errorData.error || 'Request failed')
    }
    
    const data = await response.json()
    console.log('API response data:', data)
    
    return data
  } catch (error) {
    console.error('Network Error:', error)
    throw error
  }
}

// Helper functions for specific actions
export const fetchProfile = async (accessToken: string) => {
  return supabaseGateway('getProfile', { access_token: accessToken })
}

export const updateProfile = async (accessToken: string, profileData: {
  username: string
  location: string
}) => {
  return supabaseGateway('updateProfile', {
    access_token: accessToken,
    ...profileData
  })
}

export const initializePayment = async (accessToken: string, paymentData: {
  email: string
  amount: number
  userId: string
}) => {
  return supabaseGateway('initializeTransaction', {
    access_token: accessToken,
    ...paymentData
  })
}

export const verifyPayment = async (accessToken: string, verificationData: {
  reference: string
  userId: string
  email: string
  amount: number
}) => {
  return supabaseGateway('verifyPayment', {
    access_token: accessToken,
    ...verificationData
  })
}