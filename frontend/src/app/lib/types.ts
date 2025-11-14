export interface Session {
    session_id: string;
    user_id: string;
    idea: string;
    stage: 'conversation' | 'preview' | 'generating' | 'report_complete';
    context: {
      requirement_gathering?: string;
      technical_architecture?: string;
      ux_design?: string;
      business_strategy?: string;
    };
    lead_captured: boolean;
    refinements_left: number;
    lead_score: number;
    conversation_history?: ConversationMessage[];
  }
  
  export interface ConversationMessage {
    role: 'user' | 'agent';
    content: string;
    timestamp: string;
  }
  
  export interface ConversationResponse {
    session_id: string;
    agent_response: string;
    requirements_complete: boolean;
    conversation_count?: number;
    next_step: string;
    social_proof?: SocialProof;
  }
  
  export interface SocialProof {
    testimonial: string;
    metric: string;
  }
  
  export interface PreviewResponse {
    session_id: string;
    preview: string;
    full_preview_available: boolean;
    next_step: string;
    social_proof?: SocialProof;
  }
  
  export interface ProgressResponse {
    session_id: string;
    stage: string;
    current_stage?: string;
    progress_percentage: number;
    testimonial: string;
    metric: string;
  }
  
  export interface RefinementResponse {
    success: boolean;
    updated_sections?: string[];
    changes_summary?: string;
    new_version?: number;
    refinements_left?: number;
    error?: string;
    message?: string;
    cta_url?: string;
  }
  
  export interface LeadCaptureData {
    session_id: string;
    email: string;
    name: string;
    phone?: string;
  }