#!pip install crewai crewai_tools langchain langchain_community langchain_groq streamlit duckduckgo-search sendgrid

from crewai import LLM
from langchain_groq import ChatGroq
from crewai import Crew, Process, Agent, Task
from crewai.tools import tool
from langchain_community.tools import DuckDuckGoSearchResults 
import json
from datetime import datetime
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import uuid
# from sendgrid import SendGridAPIClient
# from sendgrid.helpers.mail import Mail
import resend
from pdf_generator import generate_pdf_report
from agents.email_generator import generate_personalized_email

import random

load_dotenv()

# ==============================
# 🔹 CONFIGURATION
# ==============================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "groq/moonshotai/kimi-k2-instruct")
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "multiagent_system")
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@youragency.com")
resend.api_key = os.getenv("RESEND_API_KEY")
MAX_TOKEN = os.getenv("MAX_TOKEN_REPORT")


print("Using GROQ Model:", GROQ_MODEL)

# ==============================
# 🔹 DATABASE SETUP
# ==============================
mongo_client = MongoClient(MONGO_URI)
db = mongo_client[MONGO_DB]
sessions = db.sessions
leads = db.leads

print("Connected to MongoDB:", db.name)

# ==============================
# 🔹 LLM SETUP
# ==============================
llm = ChatGroq(
    temperature=0, 
    groq_api_key=GROQ_API_KEY, 
    model=GROQ_MODEL,
    max_tokens=MAX_TOKEN
)

# ==============================
# 🔹 SOCIAL PROOF DATA
# ==============================
TESTIMONIALS = [
    "John built a $50K/month AI agent with our help",
    "Sarah's AI tool reached 10K users in 3 months",
    "Mike raised $500K after implementing our architecture",
    "Emma's AI chatbot handles 1000+ conversations daily",
    "David cut operational costs by 60% with our solution"
]

SUCCESS_METRICS = [
    "95% client satisfaction rate",
    "Average project delivery: 6-8 weeks",
    "50+ AI agents deployed in production",
    "Clients across 15+ industries"
]

# ==============================
# 🔹 TOOLS
# ==============================
@tool
def search_web_tool(query: str):
    """Searches the web and returns results."""
    search_tool = DuckDuckGoSearchResults(num_results=10, verbose=True)
    return search_tool.run(query)

# ==============================
# 🔹 AGENTS
# ==============================
requirement_gathering_expert = Agent( 
    role="Requirement Gathering Expert",    
    goal="Understand user's AI agent idea through conversation and convert it into detailed requirements.",    
    backstory=(
        "You are a professional AI product consultant specializing in converting vague ideas "
        "into clear, structured product requirements. You ask insightful follow-up questions "
        "and know when you have enough information to proceed."
    ),
    verbose=True,
    max_iter=5,
    llm=llm,
    allow_delegation=False,
)

technical_architect = Agent(
    role="Technical Architect",
    goal=(
        "Design technical architecture using ONLY approved tech stack: "
        "Python, FastAPI, NextJS, React, React Native, TensorFlow, PyTorch, NumPy, Pandas, "
        "Hugging Face, Streamlit, CrewAI, LangChain, LangGraph, RAG, MongoDB, PostgreSQL, "
        "Redis, Pinecone, Prisma, Dizzle, AWS AI, Azure AI, Google Cloud AI, VAPI, Retell.AI, "
        "BotPress, Relevance.AI, Whisper, ElevenLabs, Twilio, Stripe, WhatsApp API. "
        "Keep architecture simple, lean, and efficient."
    ),
    backstory=(
        "You are a senior AI systems architect specializing in designing scalable production-grade "
        "agentic systems. You create practical, efficient architectures using only the approved tech stack."
    ),
    llm=llm,
    verbose=True,
    allow_delegation=False
)

ux_expert = Agent(
    role="UX / Product Design Expert",
    goal="Translate requirements into user flows and experience design structures.",
    backstory=(
        "You are a UX architect who transforms conceptual ideas into clear, intuitive interactions. "
        "You think in terms of user journey, mental models, and task efficiency."
    ),
    llm=llm,
    verbose=True,
    allow_delegation=False
)

business_strategist = Agent(
    role="Business Strategy Expert",
    goal=(
        "Develop practical business and monetization strategy including: ICP, pricing tiers, "
        "market size estimates, competitive positioning, CAC vs LTV, and go-to-market channels."
    ),
    backstory=(
        "You are a SaaS strategy consultant who builds business models based on revenue potential "
        "and cost efficiency. You present quantified assumptions to make plans investor-ready."
    ),
    llm=llm,
    verbose=True,
    allow_delegation=False
)

change_impact_analyzer = Agent(
    role="Change Impact Analyzer",
    goal="Determine which report sections are affected by new information during refinements.",
    backstory="You analyze how new requirements impact existing documentation and identify dependencies.",
    llm=llm,
    verbose=False,
    allow_delegation=False
)

change_summarizer = Agent(
    role="Change Summarizer",
    goal="Create clear summaries of report changes after refinements.",
    backstory="You explain technical changes in simple, user-friendly terms.",
    llm=llm,
    verbose=False,
    allow_delegation=False
)

# ==============================
# 🔹 SESSION MANAGEMENT
# ==============================
def create_session(user_id, idea):
    """Creates initial session with conversation support."""
    session = {
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "idea": idea,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "stage": "conversation",  # conversation -> preview -> full_report
        "context": {
            "requirement_gathering": None,
            "technical_architecture": None,
            "ux_design": None,
            "business_strategy": None,
        },
        "conversation_history": [],
        "refinement_history": [],
        "versions": [],
        "refinements_allowed": 2,
        "refinements_used": 0,
        "progress_percentage": 0,
        "current_stage": None,
        "lead_captured": False,
        "lead_score": 0,
    }
    sessions.insert_one(session)
    return session["session_id"]

def get_session(session_id):
    """Retrieves session by ID."""
    return sessions.find_one({"session_id": session_id})

def get_context(session_id):
    """Gets context for a session."""
    session = sessions.find_one({"session_id": session_id})
    return session["context"] if session else {}

# ==============================
# 🔹 SERIALIZATION HELPERS
# ==============================
def safe_serialize(obj):
    """Return JSON-safe string from CrewAI task result."""
    try:
        if hasattr(obj, "output") and obj.output:
            if hasattr(obj.output, "raw_output") and obj.output.raw_output:
                return str(obj.output.raw_output)
            if isinstance(obj.output, dict):
                return json.dumps(obj.output, indent=2)
            return str(obj.output)
        
        if hasattr(obj, "raw_output") and obj.raw_output:
            return str(obj.raw_output)
        
        if isinstance(obj, dict):
            return json.dumps(obj, indent=2)
        
        return str(obj)
    except Exception as e:
        print("[safe_serialize ERROR]", e)
        return repr(obj)

# ==============================
# 🔹 CONTEXT UPDATE WITH PROGRESS
# ==============================
def update_session_context(session_id, stage, content):
    """Store content and update progress."""    
    content_str = safe_serialize(content)
    saved_at = datetime.utcnow()    
    
    progress_map = {
        "requirement_gathering": 25,
        "technical_architecture": 50,
        "ux_design": 75,
        "business_strategy": 100
    }
    
    set_payload = {
        f"context.{stage}": content_str,
        "current_stage": stage,
        "progress_percentage": progress_map.get(stage, 0),
        "updated_at": saved_at,
    }

    history_entry = {
        "stage": stage,
        "content": content_str,
        "saved_at": saved_at,
    }

    sessions.update_one(
        {"session_id": session_id},
        {
            "$set": set_payload,
            "$push": {"context_history": history_entry}
        },
        upsert=False
    )

    print(f"[DB] Saved stage='{stage}' (progress={progress_map.get(stage, 0)}%) to session {session_id}")

# ==============================
# 🔹 CONVERSATIONAL REFINEMENT
# ==============================
def chat_with_requirement_agent(session_id: str, user_message: str):
    """Interactive Q&A to refine requirements."""
    session = get_session(session_id)
    conversation_history = session.get("conversation_history", [])
    
    # Add user message
    conversation_history.append({
        "role": "user",
        "content": user_message,
        "timestamp": datetime.utcnow()
    })
    
    # Build conversation context
    conversation_context = "\n".join([
        f"{msg['role'].upper()}: {msg['content']}" 
        for msg in conversation_history
    ])
    
    # Agent responds
    task = Task(
        description=f"""
        Conversation so far:
        {conversation_context}
        
        You are helping refine an AI agent idea. Based on the conversation:
        
        1. If you have enough information (target audience, key features, technical needs, business goals), 
           respond with: "REQUIREMENTS_COMPLETE" followed by a summary of all gathered requirements.
        
        2. If you need more info, ask 1-2 specific clarifying questions about:
           - Target audience and their pain points
           - Core features and capabilities needed
           - Technical constraints or integrations
           - Business model and goals
        
        Be conversational and encouraging. Don't overwhelm with too many questions at once.
        """,
        agent=requirement_gathering_expert,
        expected_output="Either complete requirements summary OR clarifying questions"
    )
    
    crew = Crew(
        agents=[requirement_gathering_expert], 
        tasks=[task],
        verbose=False
    )
    response = crew.kickoff()
    response_str = safe_serialize(response)
    
    # Add agent response
    conversation_history.append({
        "role": "agent",
        "content": response_str,
        "timestamp": datetime.utcnow()
    })
    
    # Check if requirements are complete
    requirements_complete = "REQUIREMENTS_COMPLETE" in response_str.upper()
    
    # Update session
    sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "conversation_history": conversation_history,
                "stage": "preview_ready" if requirements_complete else "conversation"
            }
        }
    )
    
    return {
        "response": response_str,
        "requirements_complete": requirements_complete,
        "conversation_count": len([m for m in conversation_history if m["role"] == "user"])
    }

# ==============================
# 🔹 PREVIEW GENERATION (FREE)
# ==============================
def generate_preview(session_id: str):
    """Generates requirement gathering preview (free, no email needed)."""
    session = get_session(session_id)
    idea = session["idea"]
    
    # Build enhanced idea from conversation
    conversation = session.get("conversation_history", [])
    conversation_text = "\n".join([
        f"{msg['role']}: {msg['content']}" 
        for msg in conversation
    ])
    
    enhanced_idea = f"{idea}\n\nConversation Context:\n{conversation_text}"
    
    task = requirement_gathering_task_func(enhanced_idea, session_id)
    
    crew = Crew(
        agents=[requirement_gathering_expert],
        tasks=[task],
        process=Process.sequential,
        verbose=False
    )
    
    result = crew.kickoff()
    
    # Update session stage
    sessions.update_one(
        {"session_id": session_id},
        {"$set": {"stage": "preview_generated"}}
    )
    
    return safe_serialize(result)

# ==============================
# 🔹 LEAD CAPTURE
# ==============================
def capture_lead(session_id: str, email: str, name: str, phone: str = None):
    """Captures lead information and triggers full report generation."""
    session = get_session(session_id)
    
    # Calculate lead score
    score = calculate_lead_score(session)
    
    # Create/update lead
    lead = {
        "lead_id": str(uuid.uuid4()),
        "session_id": session_id,
        "email": email,
        "name": name,
        "phone": phone,
        "captured_at": datetime.utcnow(),
        "idea": session["idea"],
        "conversation_history": session.get("conversation_history", []),
        "lead_score": score,
        "status": "new",  # new -> contacted -> qualified -> converted
        "notes": []
    }
    
    leads.insert_one(lead)
    
    # Update session
    sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "lead_captured": True,
                "lead_email": email,
                "lead_name": name,
                "lead_score": score,
                "stage": "generating_full_report"
            }
        }
    )
    
    print(f"[LEAD CAPTURED] {name} ({email}) - Score: {score}")
    
    return lead["lead_id"]

# ==============================
# 🔹 LEAD SCORING
# ==============================
def calculate_lead_score(session):
    """Calculates lead quality score (0-100)."""
    score = 0
    context = session.get("context", {})
    idea = session.get("idea", "").lower()
    conversation = session.get("conversation_history", [])
    
    # Engagement score (0-25)
    conversation_count = len([m for m in conversation if m["role"] == "user"])
    score += min(conversation_count * 5, 25)
    
    # Idea complexity (0-30)
    complexity_keywords = ["api", "integration", "video", "generation", "automation", 
                          "enterprise", "saas", "platform", "real-time"]
    complexity_score = sum(3 for keyword in complexity_keywords if keyword in idea)
    score += min(complexity_score, 30)
    
    # Technical sophistication (0-20)
    tech_keywords = ["ai", "machine learning", "nlp", "computer vision", "llm"]
    tech_score = sum(4 for keyword in tech_keywords if keyword in idea)
    score += min(tech_score, 20)
    
    # Business clarity (0-15)
    business_keywords = ["target audience", "pricing", "revenue", "market", "customers"]
    business_score = sum(3 for keyword in business_keywords if keyword in idea)
    score += min(business_score, 15)
    
    # Detailed requirements (0-10)
    req_content = context.get("requirement_gathering", "")
    if len(req_content) > 1000:
        score += 10
    elif len(req_content) > 500:
        score += 5
    
    return min(score, 100)

# ==============================
# 🔹 FULL REPORT GENERATION
# ==============================
def generate_full_report(session_id: str):
    """Generates complete report after lead capture."""
    session = get_session(session_id)
    idea = session["idea"]
    
    # Build enhanced idea from conversation
    conversation = session.get("conversation_history", [])
    conversation_text = "\n".join([
        f"{msg['role']}: {msg['content']}" 
        for msg in conversation
    ])
    enhanced_idea = f"{idea}\n\nConversation Context:\n{conversation_text}"
    
    # Generate all tasks with context passing
    requirement_task = requirement_gathering_task_func(enhanced_idea, session_id)
    technical_task = technical_architecture_task_func(requirement_task, session_id)
    ux_task = ux_task_func(requirement_task, technical_task, session_id)
    business_task = business_strategy_task_func(requirement_task, technical_task, ux_task, session_id)

    crew = Crew(
        agents=[
            requirement_gathering_expert,
            technical_architect,
            ux_expert,
            business_strategist
        ],
        tasks=[
            requirement_task,
            technical_task,
            ux_task,
            business_task
        ],
        process=Process.sequential,
        full_output=True,
        share_crew=False,
        verbose=True
    )

    result = crew.kickoff()
    
    # Update session
    sessions.update_one(
        {"session_id": session_id},
        {"$set": {"stage": "report_complete"}}
    )
    
    # Send email
    send_report_email(session_id)
    
    # Notify sales team
    notify_sales_team(session_id)
    
    return get_context(session_id)

# ==============================
# 🔹 TASK DEFINITIONS WITH CONTEXT
# ==============================
def requirement_gathering_task_func(user_input: str, session_id: str):
    return Task(
        description=f"Take the following idea: '{user_input}' and generate a detailed understanding document. "
                    f"Include: idea summary, target audience, key features, potential benefits, "
                    f"and suggested tech requirements.",
        agent=requirement_gathering_expert,
        expected_output="A structured detailed summary describing the idea, audience, key features, and tech needs.",
        callback=lambda result: update_session_context(session_id, "requirement_gathering", result)
    )

def technical_architecture_task_func(requirement_task, session_id: str):
    return Task(
        description=(
            "Using the requirements from the previous task, design a complete technical architecture. "
            "Include: system components, data flow, LangGraph nodes, CrewAI agent responsibilities, "
            "LangChain tools, and which MCP servers or external APIs are needed."
        ),
        agent=technical_architect,
        context=[requirement_task],  # ✅ Access to requirement output
        expected_output="A technical architecture blueprint in markdown format.",
        callback=lambda result: update_session_context(session_id, "technical_architecture", result)
    )

def ux_task_func(requirement_task, technical_task, session_id: str):
    return Task(
        description=(
            "Using the requirement and architecture reports as context, "
            "create user experience documentation including key user journeys, user flows, and interaction logic."
        ),
        agent=ux_expert,
        context=[requirement_task, technical_task],  # ✅ Access to both outputs
        expected_output="User flow & UX journey documentation.",
        callback=lambda result: update_session_context(session_id, "ux_design", result)
    )

def business_strategy_task_func(requirement_task, technical_task, ux_task, session_id: str):
    return Task(
        description=(
            "Using all previous deliverables as context, create a business strategy blueprint. "
            "Include: ideal customer profiles, monetization models, pricing tiers, go-to-market channels, "
            "and competitive advantage."
        ),
        agent=business_strategist,
        context=[requirement_task, technical_task, ux_task],  # ✅ Access to all outputs
        expected_output="Business Strategy Blueprint.",
        callback=lambda result: update_session_context(session_id, "business_strategy", result)
    )

# ==============================
# 🔹 REFINEMENT SYSTEM
# ==============================
class IdeaRefinementManager:
    """Manages iterative refinement of user ideas."""
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.session = get_session(session_id)
    
    def can_refine(self):
        """Check if user has refinements left."""
        used = self.session.get("refinements_used", 0)
        allowed = self.session.get("refinements_allowed", 2)
        return used < allowed
    
    def add_refinement(self, additional_info: str):
        """Main method to handle user refinements."""
        if not self.can_refine():
            return {
                "success": False,
                "error": "refinement_limit_reached",
                "message": "You've used all your refinements. Want more? Schedule a call to discuss your project!",
                "cta": "Book Free Consultation"
            }
        
        # Step 1: Update idea
        enhanced_idea = self._update_idea(additional_info)
        
        # Step 2: Detect affected sections
        affected = self._detect_affected_sections(additional_info)
        
        # Step 3: Create version snapshot
        version_num = self._create_version_snapshot("user_refinement")
        
        # Step 4: Regenerate affected sections
        results = self._regenerate_sections(enhanced_idea, affected)
        
        # Step 5: Generate change summary
        changes = self._summarize_changes(version_num, version_num + 1)
        
        # Step 6: Increment refinements used
        sessions.update_one(
            {"session_id": self.session_id},
            {"$inc": {"refinements_used": 1}}
        )
        
        refinements_left = self.session["refinements_allowed"] - (self.session.get("refinements_used", 0) + 1)
        
        return {
            "success": True,
            "updated_sections": affected,
            "changes_summary": changes,
            "new_version": version_num + 1,
            "refinements_left": refinements_left
        }
    
    def _update_idea(self, additional_info: str):
        """Appends new info to original idea."""
        original = self.session["idea"]
        enhanced = f"{original}\n\n**Additional Requirements:**\n{additional_info}"
        
        sessions.update_one(
            {"session_id": self.session_id},
            {
                "$set": {"idea": enhanced},
                "$push": {
                    "refinement_history": {
                        "timestamp": datetime.utcnow(),
                        "added_info": additional_info
                    }
                }
            }
        )
        return enhanced
    
    def _detect_affected_sections(self, new_info: str):
        """Uses LLM to detect which sections need updates."""
        task = Task(
            description=f"""
            User added new information: "{new_info}"
            
            Existing context: {json.dumps(self.session.get("context", {}), indent=2)[:500]}...
            
            Determine which sections need regeneration:
            - requirement_gathering: ALWAYS include
            - technical_architecture: Include if new features, tech stack, or integrations mentioned
            - ux_design: Include if new user interactions or flows mentioned
            - business_strategy: Include if target audience, pricing, or market changed
            
            Return ONLY a JSON array: ["section1", "section2"]
            """,
            agent=change_impact_analyzer,
            expected_output="JSON array of section names"
        )
        
        crew = Crew(agents=[change_impact_analyzer], tasks=[task], verbose=False)
        result = crew.kickoff()
        
        try:
            sections = json.loads(safe_serialize(result))
            return sections if isinstance(sections, list) else ["requirement_gathering"]
        except:
            return ["requirement_gathering"]
    
    def _regenerate_sections(self, enhanced_idea: str, sections: list):
        """Regenerates specified sections with dependencies."""
        # Ensure dependencies
        if "technical_architecture" in sections and "requirement_gathering" not in sections:
            sections.insert(0, "requirement_gathering")
        if "ux_design" in sections and "technical_architecture" not in sections:
            sections.insert(0, "technical_architecture")
        if "business_strategy" in sections:
            sections = ["requirement_gathering", "technical_architecture", "ux_design", "business_strategy"]
        
        # Sort by dependency order
        section_order = ["requirement_gathering", "technical_architecture", "ux_design", "business_strategy"]
        sections = [s for s in section_order if s in sections]
        
        # Build tasks
        tasks = []
        agents_list = []
        
        for i, section in enumerate(sections):
            if section == "requirement_gathering":
                task = requirement_gathering_task_func(enhanced_idea, self.session_id)
                agent = requirement_gathering_expert
            elif section == "technical_architecture":
                # Get previous task for context
                prev_task = tasks[i-1] if i > 0 else None
                task = Task(
                    description="Design complete technical architecture based on requirements.",
                    agent=technical_architect,
                    context=[prev_task] if prev_task else [],
                    expected_output="Technical architecture blueprint.",
                    callback=lambda result: update_session_context(self.session_id, "technical_architecture", result)
                )
                agent = technical_architect
            elif section == "ux_design":
                prev_tasks = [t for t in tasks if t]
                task = Task(
                    description="Create UX documentation with user journeys and flows.",
                    agent=ux_expert,
                    context=prev_tasks,
                    expected_output="UX journey documentation.",
                    callback=lambda result: update_session_context(self.session_id, "ux_design", result)
                )
                agent = ux_expert
            elif section == "business_strategy":
                prev_tasks = [t for t in tasks if t]
                task = Task(
                    description="Create business strategy blueprint.",
                    agent=business_strategist,
                    context=prev_tasks,
                    expected_output="Business Strategy Blueprint.",
                    callback=lambda result: update_session_context(self.session_id, "business_strategy", result)
                )
                agent = business_strategist
            
            tasks.append(task)
            agents_list.append(agent)
        
        # Run crew
        crew = Crew(
            agents=agents_list,
            tasks=tasks,
            process=Process.sequential,
            verbose=True
        )
        
        result = crew.kickoff()
        return result
    
    def _create_version_snapshot(self, trigger: str):
        """Creates version snapshot."""
        version_num = len(self.session.get("versions", [])) + 1
        
        version = {
            "version_number": version_num,
            "created_at": datetime.utcnow(),
            "trigger": trigger,
            "context_snapshot": self.session["context"].copy(),
            "idea_snapshot": self.session["idea"]
        }
        
        sessions.update_one(
            {"session_id": self.session_id},
            {"$push": {"versions": version}}
        )
        
        return version_num
    
    def _summarize_changes(self, old_version: int, new_version: int):
        """Generates summary of changes."""
        session = get_session(self.session_id)
        versions = session.get("versions", [])
        
        if len(versions) < 2:
            return "Initial report generated."
        
        v_old = next((v for v in versions if v["version_number"] == old_version), None)
        v_new = next((v for v in versions if v["version_number"] == new_version), None)
        
        if not v_old or not v_new:
            return "Changes summary not available."
        
        task = Task(
            description=f"""
            The user refined their AI agent idea. Summarize what changed:
            
            Original idea: {v_old['idea_snapshot'][:300]}...
            Updated idea: {v_new['idea_snapshot'][:300]}...
            
            Create a bullet-point summary of KEY changes (3-5 bullets max).
            Focus on: new features, tech changes, cost implications.
            """,
            agent=change_summarizer,
            expected_output="Bullet-point summary of changes"
        )
        
        crew = Crew(agents=[change_summarizer], tasks=[task], verbose=False)
        summary = crew.kickoff()
        
        return safe_serialize(summary)

# ==============================
# 🔹 EMAIL INTEGRATION
# ==============================
def send_report_email(session_id: str):
    """Sends report via email using Resend."""
    session = sessions.find_one({"session_id": session_id})
    lead_email = session.get("lead_email")
    lead_name = session.get("lead_name", "there")
    
    if not lead_email or not resend.api_key:
        print("[EMAIL] Skipping email - no email address or Resend key")
        return
    
    try:
        # Generate PDF
        pdf_bytes = generate_pdf_report(session)
        
        print(f"[EMAIL] Generating personalized email for {lead_name}...")
        email_data = generate_personalized_email(session)
        

        subject = email_data["subject"]
        html_content = email_data["html_content"]
        # Send email with Resend
        params = {
            "from": os.getenv("FROM_EMAIL", "noreply@youragency.com"),
            "to": [lead_email],
            "subject": subject,
            "html": html_content,
            "attachments": [
                {
                    "filename": f"ai-agent-report-{session_id[:8]}.pdf",
                    "content": list(pdf_bytes)  # Resend expects list of bytes
                }
            ]
        }
        
        email = resend.Emails.send(params)
        print(f"[EMAIL] Sent to {lead_email} - ID: {email['id']}")
        
        # Log email sent
        sessions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "report_email_sent": True,
                    "report_email_sent_at": datetime.utcnow(),
                    "email_id": email['id'],
                    "email_subject": subject 
                }
            }
        )
        
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        import traceback
        traceback.print_exc()


def notify_sales_team(session_id: str):
    """Sends notification to sales team about new lead using Resend."""
    session = sessions.find_one({"session_id": session_id})
    lead_email = session.get("lead_email")
    lead_name = session.get("lead_name")
    lead_score = session.get("lead_score", 0)
    idea = session.get("idea", "")[:200]
    
    # Estimate project value
    context = session.get("context", {})
    tech_content = context.get("technical_architecture", "")
    
    estimated_value = 25000
    if "video" in tech_content.lower() or "generation" in tech_content.lower():
        estimated_value += 20000
    if "real-time" in tech_content.lower():
        estimated_value += 15000
    if "enterprise" in idea.lower():
        estimated_value += 30000
    
    priority = "🔥 HIGH" if lead_score > 70 else "⚡ MEDIUM" if lead_score > 40 else "📌 LOW"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .priority-high {{ background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; }}
            .priority-medium {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; }}
            .priority-low {{ background: #e0e7ff; border-left: 4px solid #6366f1; padding: 20px; margin: 20px 0; }}
            .info-box {{ background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }}
            .button {{ display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🚨 New Qualified Lead</h2>
            
            <div class="priority-{'high' if lead_score > 70 else 'medium' if lead_score > 40 else 'low'}">
                <h3>Priority: {priority}</h3>
                <p><strong>Lead Score:</strong> {lead_score}/100</p>
            </div>
            
            <div class="info-box">
                <h3>Contact Information</h3>
                <p><strong>Name:</strong> {lead_name}</p>
                <p><strong>Email:</strong> {lead_email}</p>
            </div>
            
            <div class="info-box">
                <h3>Project Overview</h3>
                <p>{idea}...</p>
            </div>
            
            <div class="info-box">
                <p><strong>Estimated Project Value:</strong> ${estimated_value:,}</p>
            </div>
            
            <div style="margin: 30px 0;">
                <p><strong>Recommended Action:</strong></p>
                <p>{'🎯 Contact within 24 hours - High quality lead!' if lead_score > 70 else '📞 Follow up within 48-72 hours'}</p>
            </div>
            
            <div style="text-align: center;">
                <a href="http://localhost:3000/admin" class="button">View Full Session</a>
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Session ID: {session_id}
            </p>
        </div>
    </body>
    </html>
    """
    
    try:
        sales_email = os.getenv("SALES_EMAIL", "sales@youragency.com")
        
        params = {
            "from": os.getenv("FROM_EMAIL", "noreply@youragency.com"),
            "to": [sales_email],
            "subject": f"{priority} New Lead: {lead_name} - ${estimated_value:,} Potential",
            "html": html_content
        }
        
        email = resend.Emails.send(params)
        print(f"[SALES NOTIFICATION] Sent - ID: {email['id']}")
        
    except Exception as e:
        print(f"[SALES NOTIFICATION ERROR] {e}")
        import traceback
        traceback.print_exc()

# ==============================
# 🔹 PROGRESS TRACKING HELPERS
# ==============================
def get_progress(session_id: str):
    """Gets current progress for a session."""
    session = get_session(session_id)
    return {
        "session_id": session_id,
        "stage": session.get("stage"),
        "current_stage": session.get("current_stage"),
        "progress_percentage": session.get("progress_percentage", 0),
        "testimonial": random.choice(TESTIMONIALS),
        "metric": random.choice(SUCCESS_METRICS)
    }

def get_random_social_proof():
    """Returns random social proof for display during generation."""
    return {
        "testimonial": random.choice(TESTIMONIALS),
        "metric": random.choice(SUCCESS_METRICS)
    }

# ==============================
# 🔹 MAIN PIPELINE FUNCTIONS
# ==============================
def start_conversation(user_id: str, initial_idea: str):
    """
    Step 1: User submits initial idea, starts conversation.
    Returns session_id for tracking.
    """
    session_id = create_session(user_id, initial_idea)
    
    # Start conversation with requirement agent
    response = chat_with_requirement_agent(session_id, initial_idea)
    
    return {
        "session_id": session_id,
        "agent_response": response["response"],
        "requirements_complete": response["requirements_complete"],
        "next_step": "preview_ready" if response["requirements_complete"] else "continue_conversation"
    }

def continue_conversation(session_id: str, user_message: str):
    """
    Step 2: User continues conversation to refine idea.
    """
    response = chat_with_requirement_agent(session_id, user_message)
    
    return {
        "session_id": session_id,
        "agent_response": response["response"],
        "requirements_complete": response["requirements_complete"],
        "conversation_count": response["conversation_count"],
        "next_step": "preview_ready" if response["requirements_complete"] else "continue_conversation"
    }

def generate_preview_report(session_id: str):
    """
    Step 3: Generate free preview (requirements only).
    No email needed yet.
    """
    preview_content = generate_preview(session_id)
    
    return {
        "session_id": session_id,
        "preview": preview_content[:500] + "...",  # Show teaser
        "full_preview_available": True,
        "next_step": "request_email_for_full_report"
    }

def submit_lead_and_generate_full_report(session_id: str, email: str, name: str, phone: str = None):
    """
    Step 4: User provides email, generate full report.
    """
    # Capture lead
    lead_id = capture_lead(session_id, email, name, phone)
    
    # Generate full report (this takes 1-2 minutes)
    full_context = generate_full_report(session_id)
    
    return {
        "session_id": session_id,
        "lead_id": lead_id,
        "status": "report_complete",
        "email_sent": True,
        "context": full_context,
        "refinements_left": 2
    }

def refine_report(session_id: str, additional_info: str):
    """
    Step 5: User refines their idea after seeing report.
    """
    manager = IdeaRefinementManager(session_id)
    
    if not manager.can_refine():
        return {
            "success": False,
            "error": "refinement_limit_reached",
            "message": "You've used all your refinements. Want unlimited refinements? Book a call!",
            "cta_url": "https://calendly.com/youragency/consultation"
        }
    
    result = manager.add_refinement(additional_info)
    
    return result

def get_session_report(session_id: str):
    """
    Retrieves complete report for a session.
    """
    session = get_session(session_id)
    context = get_context(session_id)
    
    return {
        "session_id": session_id,
        "idea": session["idea"],
        "stage": session["stage"],
        "context": context,
        "lead_captured": session.get("lead_captured", False),
        "refinements_left": session.get("refinements_allowed", 2) - session.get("refinements_used", 0),
        "lead_score": session.get("lead_score", 0),
        "versions": session.get("versions", [])
    }

# ==============================
# 🔹 ANALYTICS & REPORTING
# ==============================
def get_lead_analytics():
    """Gets analytics for all leads."""
    total_leads = leads.count_documents({})
    high_score_leads = leads.count_documents({"lead_score": {"$gte": 70}})
    
    pipeline = [
        {
            "$group": {
                "_id": None,
                "avg_score": {"$avg": "$lead_score"}
            }
        }
    ]
    
    avg_result = list(leads.aggregate(pipeline))
    avg_score = avg_result[0]["avg_score"] if avg_result else 0
    
    return {
        "total_leads": total_leads,
        "high_quality_leads": high_score_leads,
        "average_lead_score": round(avg_score, 2),
        "conversion_rate": round((high_score_leads / total_leads * 100), 2) if total_leads > 0 else 0
    }

def get_top_leads(limit: int = 10):
    """Gets top quality leads."""
    top_leads = leads.find().sort("lead_score", -1).limit(limit)
    
    return [
        {
            "name": lead["name"],
            "email": lead["email"],
            "score": lead["lead_score"],
            "idea": lead["idea"][:100] + "...",
            "captured_at": lead["captured_at"]
        }
        for lead in top_leads
    ]

# ==============================
# 🔹 EXAMPLE USAGE / TESTING
# ==============================
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 AI AGENT CONSULTANT SYSTEM - COMPLETE IMPLEMENTATION")
    print("="*60 + "\n")
    
    # Example Flow
    user_id = "test_user_" + str(uuid.uuid4())[:8]
    initial_idea = "I want to build an AI agent that helps content creators come up with viral video ideas."
    
    print("📝 STEP 1: Starting conversation...")
    step1 = start_conversation(user_id, initial_idea)
    session_id = step1["session_id"]
    print(f"Session ID: {session_id}")
    print(f"Agent: {step1['agent_response'][:200]}...")
    
    # Simulate user response
    if not step1["requirements_complete"]:
        print("\n💬 STEP 2: Continuing conversation...")
        step2 = continue_conversation(
            session_id, 
            "It's for YouTubers and TikTok creators. Should also auto-generate and publish videos."
        )
        print(f"Agent: {step2['agent_response'][:200]}...")
    
    # Generate preview
    print("\n📊 STEP 3: Generating preview...")
    step3 = generate_preview_report(session_id)
    print(f"Preview: {step3['preview']}")
    
    # Capture lead and generate full report
    print("\n📧 STEP 4: Capturing lead and generating full report...")
    print("(This would normally take 1-2 minutes...)")
    
    # In production, you'd call:
    # step4 = submit_lead_and_generate_full_report(
    #     session_id, 
    #     "user@example.com", 
    #     "John Doe",
    #     "+1234567890"
    # )
    
    print("\n✅ System ready for production!")
    print("\nAvailable Functions:")
    print("  - start_conversation(user_id, idea)")
    print("  - continue_conversation(session_id, message)")
    print("  - generate_preview_report(session_id)")
    print("  - submit_lead_and_generate_full_report(session_id, email, name, phone)")
    print("  - refine_report(session_id, additional_info)")
    print("  - get_session_report(session_id)")
    print("  - get_progress(session_id)")
    print("  - get_lead_analytics()")
    print("  - get_top_leads(limit)")
    
    print("\n" + "="*60)
    print("📊 CURRENT ANALYTICS:")
    analytics = get_lead_analytics()
    print(f"  Total Leads: {analytics['total_leads']}")
    print(f"  High Quality Leads: {analytics['high_quality_leads']}")
    print(f"  Average Score: {analytics['average_lead_score']}")
    print("="*60 + "\n")