# api.py
# FastAPI REST API for AI Agent Consultant System

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uvicorn
import os

# Import your core system
from agents.ai_consultant_system import (
    start_conversation,
    continue_conversation,
    generate_preview_report,
    submit_lead_and_generate_full_report,
    refine_report,
    get_session_report,
    get_progress,
    get_random_social_proof,
    get_lead_analytics,
    get_top_leads,
    get_session,
    IdeaRefinementManager
)
from pdf_generator import generate_pdf_report  # ADD THIS IMPORT
from io import BytesIO


# ==============================
# 🔹 FASTAPI APP SETUP
# ==============================
app = FastAPI(
    title="AI Agent Consultant API",
    description="Two-stage lead generation funnel with conversational refinement",
    version="1.0.0"
)

# CORS middleware for frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# 🔹 PYDANTIC MODELS (REQUEST/RESPONSE)
# ==============================

class IdeaSubmission(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    idea: str = Field(..., min_length=10, max_length=2000, description="Initial AI agent idea")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "idea": "I want to build an AI agent that helps content creators come up with viral video ideas"
            }
        }

class ConversationMessage(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    message: str = Field(..., min_length=1, max_length=1000, description="User's response")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "abc-123-def",
                "message": "It's for YouTubers and TikTok creators. Should also auto-generate videos."
            }
        }

class LeadCapture(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    email: EmailStr = Field(..., description="User's email address")
    name: str = Field(..., min_length=2, max_length=100, description="User's full name")
    phone: Optional[str] = Field(None, max_length=20, description="User's phone number")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "abc-123-def",
                "email": "john@example.com",
                "name": "John Doe",
                "phone": "+1234567890"
            }
        }

class RefinementRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    additional_info: str = Field(..., min_length=10, max_length=1000, description="Additional requirements")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "abc-123-def",
                "additional_info": "I forgot to mention it should also integrate with Instagram and auto-schedule posts"
            }
        }

class SessionQuery(BaseModel):
    session_id: str = Field(..., description="Session identifier")

# Response models
class ConversationResponse(BaseModel):
    session_id: str
    agent_response: str
    requirements_complete: bool
    conversation_count: Optional[int] = None
    next_step: str
    social_proof: Optional[Dict[str, str]] = None

class PreviewResponse(BaseModel):
    session_id: str
    preview: str
    full_preview_available: bool
    next_step: str
    social_proof: Optional[Dict[str, str]] = None

class FullReportResponse(BaseModel):
    session_id: str
    lead_id: str
    status: str
    email_sent: bool
    refinements_left: int
    message: str

class RefinementResponse(BaseModel):
    success: bool
    updated_sections: Optional[List[str]] = None
    changes_summary: Optional[str] = None
    new_version: Optional[int] = None
    refinements_left: Optional[int] = None
    error: Optional[str] = None
    message: Optional[str] = None
    cta_url: Optional[str] = None

class ProgressResponse(BaseModel):
    session_id: str
    stage: str
    current_stage: Optional[str]
    progress_percentage: int
    testimonial: str
    metric: str

class AnalyticsResponse(BaseModel):
    total_leads: int
    high_quality_leads: int
    average_lead_score: float
    conversion_rate: float

# ==============================
# 🔹 API ENDPOINTS
# ==============================

@app.get("")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "AI Agent Consultant API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check with system status."""
    try:
        # Test database connection
        from agents.ai_consultant_system import sessions
        sessions.find_one()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return JSONResponse(status_code=200, content={"status": "healthy", "database": db_status, "timestamp": datetime.utcnow().isoformat()})

    # return {
    #     "status": "healthy",
    #     "database": db_status,
    #     "timestamp": datetime.utcnow().isoformat()
    # }

# ==============================
# 🔹 CONVERSATION FLOW ENDPOINTS
# ==============================

@app.post("/conversation/start", response_model=ConversationResponse)
async def api_start_conversation(submission: IdeaSubmission):
    """
    Step 1: User submits initial idea and starts conversation.
    
    Returns session_id and first agent response.
    """
    try:
        result = start_conversation(submission.user_id, submission.idea)
        
        # Add social proof
        social_proof = get_random_social_proof()
        
        return ConversationResponse(
            session_id=result["session_id"],
            agent_response=result["agent_response"],
            requirements_complete=result["requirements_complete"],
            next_step=result["next_step"],
            social_proof=social_proof
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting conversation: {str(e)}")

@app.post("/conversation/continue", response_model=ConversationResponse)
async def api_continue_conversation(message: ConversationMessage):
    """
    Step 2: User continues conversation to refine requirements.
    
    Agent asks clarifying questions until requirements are complete.
    """
    try:
        # Verify session exists
        session = get_session(message.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        result = continue_conversation(message.session_id, message.message)
        
        # Add social proof
        social_proof = get_random_social_proof()
        
        return ConversationResponse(
            session_id=result["session_id"],
            agent_response=result["agent_response"],
            requirements_complete=result["requirements_complete"],
            conversation_count=result.get("conversation_count"),
            next_step=result["next_step"],
            social_proof=social_proof
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error continuing conversation: {str(e)}")

# ==============================
# 🔹 PREVIEW & LEAD CAPTURE ENDPOINTS
# ==============================

@app.post("/preview/generate", response_model=PreviewResponse)
async def api_generate_preview(query: SessionQuery):
    """
    Step 3: Generate FREE preview report (requirements only).
    
    No email required. Shows teaser to encourage email capture.
    """
    try:
        # Verify session exists
        session = get_session(query.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        result = generate_preview_report(query.session_id)
        
        # Add social proof
        social_proof = get_random_social_proof()
        
        return PreviewResponse(
            session_id=result["session_id"],
            preview=result["preview"],
            full_preview_available=result["full_preview_available"],
            next_step=result["next_step"],
            social_proof=social_proof
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating preview: {str(e)}")

@app.post("/lead/capture", response_model=FullReportResponse)
async def api_capture_lead(
    lead_data: LeadCapture,
    background_tasks: BackgroundTasks
):
    """
    Step 4: Capture lead and generate full report.
    
    This endpoint:
    1. Saves lead information
    2. Triggers full report generation (background task)
    3. Sends email to user
    4. Notifies sales team
    
    Note: Full report generation takes 1-2 minutes.
    """
    try:
        # Verify session exists
        session = get_session(lead_data.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Check if lead already captured for this session
        if session.get("lead_captured"):
            raise HTTPException(
                status_code=400, 
                detail="Lead already captured for this session"
            )
        
        # Run report generation in background
        background_tasks.add_task(
            submit_lead_and_generate_full_report,
            lead_data.session_id,
            lead_data.email,
            lead_data.name,
            lead_data.phone
        )
        
        return FullReportResponse(
            session_id=lead_data.session_id,
            lead_id="generating",  # Actual lead_id will be in DB once background task completes
            status="generating",
            email_sent=False,  # Will be true once background task completes
            refinements_left=2,
            message="Your report is being generated. You'll receive an email shortly!"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error capturing lead: {str(e)}")

# ==============================
# 🔹 REPORT RETRIEVAL & REFINEMENT
# ==============================

@app.post("/report/get")
async def api_get_report(query: SessionQuery):
    """
    Get complete report for a session.
    
    Returns all generated sections and metadata.
    """
    try:
        result = get_session_report(query.session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving report: {str(e)}")

@app.post("/report/refine", response_model=RefinementResponse)
async def api_refine_report(
    refinement: RefinementRequest,
    background_tasks: BackgroundTasks
):
    """
    Step 5: Refine report with additional information.
    
    Users get 2 free refinements. After that, they need to book a consultation.
    
    This regenerates affected sections based on new information.
    """
    try:
        # Verify session exists
        session = get_session(refinement.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Check if lead was captured
        if not session.get("lead_captured"):
            raise HTTPException(
                status_code=403,
                detail="You must complete the full report before refining"
            )
        
        # Check refinement limit
        manager = IdeaRefinementManager(refinement.session_id)
        if not manager.can_refine():
            return RefinementResponse(
                success=False,
                error="refinement_limit_reached",
                message="You've used all your refinements. Want unlimited refinements? Book a call!",
                cta_url="https://calendly.com/youragency/consultation"
            )
        
        # Run refinement in background
        result = refine_report(refinement.session_id, refinement.additional_info)
        
        return RefinementResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refining report: {str(e)}")

# ==============================
# 🔹 PROGRESS & STATUS ENDPOINTS
# ==============================

@app.get("/progress/{session_id}", response_model=ProgressResponse)
async def api_get_progress(session_id: str):
    """
    Get real-time progress for report generation.
    
    Use this endpoint to poll status while report is being generated.
    Recommended polling interval: 2-3 seconds.
    """
    try:
        progress = get_progress(session_id)
        
        if not progress:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return ProgressResponse(**progress)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting progress: {str(e)}")

@app.get("/social-proof")
async def api_get_social_proof():
    """
    Get random social proof for display during wait times.
    
    Returns a testimonial and success metric.
    """
    return get_random_social_proof()

# ==============================
# 🔹 ANALYTICS ENDPOINTS (INTERNAL/ADMIN)
# ==============================

@app.get("/analytics/overview", response_model=AnalyticsResponse)
async def api_get_analytics():
    """
    Get overall lead analytics.
    
    Admin endpoint for sales team dashboard.
    TODO: Add authentication in production.
    """
    try:
        analytics = get_lead_analytics()
        return AnalyticsResponse(**analytics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting analytics: {str(e)}")

@app.get("/analytics/top-leads")
async def api_get_top_leads(limit: int = 10):
    """
    Get top quality leads sorted by score.
    
    Admin endpoint for sales team.
    TODO: Add authentication in production.
    """
    try:
        top_leads = get_top_leads(limit)
        return {"leads": top_leads, "count": len(top_leads)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting top leads: {str(e)}")

@app.get("/session/{session_id}/full")
async def api_get_full_session(session_id: str):
    """
    Get complete session data including conversation history.
    
    Admin endpoint for detailed session inspection.
    TODO: Add authentication in production.
    """
    try:
        session = get_session(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Convert ObjectId to string for JSON serialization
        session['_id'] = str(session['_id'])
        
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting session: {str(e)}")

# ==============================
# 🔹 ANALYTICS ENDPOINTS (INTERNAL/ADMIN)
# ==============================

@app.get("/analytics/overview", response_model=AnalyticsResponse)
async def api_get_analytics():
    """
    Get overall lead analytics.
    
    Admin endpoint for sales team dashboard.
    TODO: Add authentication in production.
    """
    try:
        analytics = get_lead_analytics()
        return AnalyticsResponse(**analytics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting analytics: {str(e)}")

@app.get("/analytics/top-leads")
async def api_get_top_leads(limit: int = 10):
    """
    Get top quality leads sorted by score.
    
    Admin endpoint for sales team.
    TODO: Add authentication in production.
    """
    try:
        top_leads = get_top_leads(limit)
        return {"leads": top_leads, "count": len(top_leads)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting top leads: {str(e)}")

@app.get("/analytics/lead/{lead_id}")
async def api_get_lead_details(lead_id: str):
    """
    Get detailed information about a specific lead.
    
    Admin endpoint for sales team.
    TODO: Add authentication in production.
    """
    try:
        from agents.ai_consultant_system import leads
        
        lead = leads.find_one({"lead_id": lead_id})
        
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Convert ObjectId to string
        lead['_id'] = str(lead['_id'])
        
        return lead
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting lead details: {str(e)}")

@app.get("/session/{session_id}/full")
async def api_get_full_session(session_id: str):
    """
    Get complete session data including conversation history.
    
    Admin endpoint for detailed session inspection.
    TODO: Add authentication in production.
    """
    try:
        session = get_session(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Convert ObjectId to string for JSON serialization
        session['_id'] = str(session['_id'])
        
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting session: {str(e)}")

# ==============================
# 🔹 PDF Download
# ==============================

@app.get("/report/{session_id}/download-pdf")
async def api_download_report_pdf(session_id: str):
    """
    Downloads the complete report as a PDF file.
    
    Returns a PDF file for download.
    """
    try:
        # Get session data
        session = get_session(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Check if report is complete
        if not session.get("context", {}).get("business_strategy"):
            raise HTTPException(
                status_code=400, 
                detail="Report not complete yet. Please wait for generation to finish."
            )
        
        # Generate PDF
        pdf_bytes = generate_pdf_report(session)
        
        # Create filename
        filename = f"ai-agent-report-{session_id[:8]}.pdf"
        
        # Return PDF as downloadable file
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PDF ERROR] {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

# ==============================
# 🔹 WEBHOOK ENDPOINTS (OPTIONAL)
# ==============================

@app.post("/webhooks/report-complete")
async def webhook_report_complete(session_id: str):
    """
    Webhook endpoint that gets called when report generation completes.
    
    Can be used to trigger additional automation (Zapier, Make.com, etc.)
    """
    try:
        session = get_session(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "status": "acknowledged",
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook error: {str(e)}")

# ==============================
# 🔹 ERROR HANDLERS
# ==============================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    
    return JSONResponse(status_code=404, content={ "error": "Not Found", "message": str(exc.detail) if hasattr(exc, 'detail') else "Resource not found",})

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(status_code=500, content={  "error": "Internal Server Error", "message": "An unexpected error occurred. Please try again later.",})    

# ==============================
# 🔹 STARTUP/SHUTDOWN EVENTS
# ==============================

@app.on_event("startup")
async def startup_event():
    """Run on API startup."""
    print("🚀 AI Agent Consultant API starting up...")
    print("📊 Connecting to database...")
    print("✅ API ready to receive requests!")

@app.on_event("shutdown")
async def shutdown_event():
    """Run on API shutdown."""
    print("👋 AI Agent Consultant API shutting down...")

# ==============================
# 🔹 RUN SERVER
# ==============================

if __name__ == "__main__":
    # port = int(os.getenv("PORT",8000))  # Render sets PORT automatically
    uvicorn.run(
        "api:app",
        # host="0.0.0.0",
        # port=port,
        # reload=True,  # Auto-reload on code changes (dev only)
        log_level="info"
    )