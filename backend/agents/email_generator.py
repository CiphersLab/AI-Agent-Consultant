from crewai import Agent, Task, Crew, Process
from langchain_groq import ChatGroq
import os

# Initialize LLM
llm = ChatGroq(
    temperature=0.7,  # Slightly higher for creative email writing
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model=os.getenv("GROQ_MODEL", "mixtral-8x7b-32768"),
    max_tokens=os.getenv("MAX_TOKEN_EMAIL"),
)

# Email Writer Agent
email_writer_agent = Agent(
    role="Professional Email Copywriter",
    goal="Create personalized, engaging emails that relate to the user's specific AI agent idea and make them excited about the report",
    backstory=(
        "You are an expert email copywriter who specializes in tech and AI products. "
        "You know how to write emails that are personal, engaging, and action-oriented. "
        "You always reference specific details from the user's project to make them feel "
        "like the email was written just for them. You balance professionalism with warmth."
    ),
    llm=llm,
    verbose=False,
    allow_delegation=False,
)

def generate_personalized_email(session_data: dict) -> dict:
    """
    Generates a personalized email based on the user's idea and report.
    Returns dict with subject and html_content.
    """
    
    # Extract key information
    lead_name = session_data.get("lead_name", "there")
    idea = session_data.get("idea", "")
    context = session_data.get("context", {})
    lead_score = session_data.get("lead_score", 0)
    
    # Extract key insights from report sections
    requirements = context.get("requirement_gathering", "")[:500]  # First 500 chars
    architecture = context.get("technical_architecture", "")[:500]
    business = context.get("business_strategy", "")[:500]
    
    # Determine project characteristics
    complexity = "high" if lead_score >= 70 else "medium" if lead_score >= 40 else "standard"
    
    # Check for specific features in the idea
    has_video = "video" in idea.lower()
    has_automation = "automat" in idea.lower() or "workflow" in idea.lower()
    has_chat = "chat" in idea.lower() or "conversation" in idea.lower()
    is_enterprise = "enterprise" in idea.lower() or "business" in idea.lower()
    
    features = []
    if has_video:
        features.append("video generation")
    if has_automation:
        features.append("automation")
    if has_chat:
        features.append("conversational AI")
    
    # Create the task for email generation
    task = Task(
        description=f"""
        Create a highly personalized email for {lead_name} about their AI agent idea.
        
        USER'S ORIGINAL IDEA:
        {idea}
        
        PROJECT CHARACTERISTICS:
        - Complexity Level: {complexity}
        - Key Features: {', '.join(features) if features else 'custom AI agent'}
        - Lead Score: {lead_score}/100
        
        REPORT HIGHLIGHTS (first 500 chars of each section):
        Requirements: {requirements}
        Architecture: {architecture}
        Business Strategy: {business}
        
        INSTRUCTIONS:
        1. Create a personalized subject line that references their specific idea
        2. Write an email that:
           - Opens with a personalized greeting mentioning their specific AI agent concept
           - Highlights 2-3 SPECIFIC insights from their report (not generic)
           - Mentions the key features they wanted (video, automation, etc.)
           - Includes realistic project estimates based on complexity
           - Has a clear call-to-action to schedule a consultation
           - Feels warm and personal, not templated
        
        3. Use HTML format with this structure:
           - Header with their project name
           - Personal introduction paragraph
           - "Key Insights from Your Report" section with 2-3 specific points
           - Project estimates (timeline, complexity, investment range)
           - Call-to-action button
           - Personal sign-off
        
        4. IMPORTANT: Reference SPECIFIC details from their idea and report. 
           Don't use generic phrases like "your AI agent" - use their actual concept.
        
        5. Keep the tone professional but warm. Make them excited about their project.
        
        OUTPUT FORMAT:
        Return ONLY a JSON object with two keys:
        {{
            "subject": "Your personalized subject line here",
            "html_content": "Your complete HTML email here"
        }}
        
        The HTML should be complete and ready to send, with inline CSS styling.
        Use the CiphersLab blue theme (#3b82f6) for buttons and accents.
        """,
        agent=email_writer_agent,
        expected_output="JSON object with subject and html_content keys"
    )
    
    # Create and run the crew
    crew = Crew(
        agents=[email_writer_agent],
        tasks=[task],
        process=Process.sequential,
        verbose=False
    )
    
    try:
        result = crew.kickoff()
        
        # Parse the result
        import json
        result_str = str(result)
        
        # Try to extract JSON from the result
        if "```json" in result_str:
            # Extract JSON from markdown code block
            json_start = result_str.find("```json") + 7
            json_end = result_str.find("```", json_start)
            json_str = result_str[json_start:json_end].strip()
        elif "{" in result_str and "}" in result_str:
            # Extract JSON directly
            json_start = result_str.find("{")
            json_end = result_str.rfind("}") + 1
            json_str = result_str[json_start:json_end]
        else:
            # Fallback to default if parsing fails
            return get_default_email(session_data)
        
        email_data = json.loads(json_str)
        
        # Validate the output
        if "subject" in email_data and "html_content" in email_data:
            return email_data
        else:
            return get_default_email(session_data)
            
    except Exception as e:
        print(f"[EMAIL GENERATOR ERROR] {e}")
        import traceback
        traceback.print_exc()
        # Fallback to default email
        return get_default_email(session_data)


def get_default_email(session_data: dict) -> dict:
    """
    Fallback email template if AI generation fails.
    """
    lead_name = session_data.get("lead_name", "there")
    idea = session_data.get("idea", "your AI agent")
    idea_summary = idea[:100] + "..." if len(idea) > 100 else idea
    
    subject = f"Your AI Agent Report is Ready, {lead_name}! 🚀"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }}
            .button {{ display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
            .insight {{ background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Your AI Agent Report is Ready! 🚀</h1>
            </div>
            <div class="content">
                <p>Hi {lead_name},</p>
                
                <p>We've completed the analysis of your idea: <strong>{idea_summary}</strong></p>
                
                <p>Your complete strategic report is attached to this email!</p>
                
                <div class="insight">
                    <strong>📊 What's Inside:</strong>
                    <ul>
                        <li>Complete Requirements Analysis</li>
                        <li>Technical Architecture Blueprint</li>
                        <li>UX Design Framework & User Flows</li>
                        <li>Business Model & Pricing Strategy</li>
                    </ul>
                </div>
                
                <p><strong>Next Steps:</strong></p>
                <p>Ready to bring this to life? Let's discuss how we can build this for you.</p>
                
                <div style="text-align: center;">
                    <a href="https://calendly.com/muddassirkhanani/cipherslab" class="button" style="color:white !important;">
                        Schedule Free Consultation
                    </a>
                </div>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                    Have questions about the report? Just reply to this email!
                </p>
            </div>
            <div class="footer">
                <p>Built with ❤️ by CiphersLab</p>
                <p>© 2025 CiphersLab. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return {
        "subject": subject,
        "html_content": html_content
    }
