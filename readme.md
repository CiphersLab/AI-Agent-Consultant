# 🤖 AI Agent Consultant - Complete System

A sophisticated lead generation system that turns user ideas into comprehensive AI agent strategic reports. Built with FastAPI, Next.js, CrewAI, and modern AI tools.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![Next.js](https://img.shields.io/badge/next.js-14-black)

---

## 🎯 What This System Does

This is a **complete lead generation funnel** that:

1.  ✅ Captures user's AI agent idea
2.  ✅ Has conversational refinement with an AI agent
3.  ✅ Generates a free preview (requirements analysis)
4.  ✅ Gates full report behind email capture
5.  ✅ Generates complete strategic report (4 sections)
6.  ✅ Allows 2 free refinements
7.  ✅ Scores leads automatically (0-100)
8.  ✅ AI agent to write email based generated report
9.  ✅ Sends emails via Resend
10. ✅ Notifies sales team of high-value leads

---

## 🎨 Features

### For Users
- **Conversational Interface**: Natural chat with AI consultant
- **Free Preview**: See quality before providing email
- **Complete Report**: 4 detailed sections covering all aspects
- **Refinements**: Improve report with additional information
- **Modern UI**: Clean, simple, and professional design
- **Mobile Responsive**: Works on all devices

### For Business
- **Lead Scoring**: Automatic 0-100 scoring based on engagement and complexity
- **Email Capture**: Two-stage funnel maximizes conversion
- **Sales Notifications**: Real-time alerts for high-quality leads
- **Analytics Dashboard**: Track leads, scores, and conversions
- **Export Options**: Download reports as PDF or JSON or TXT

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- FastAPI (REST API)
- CrewAI (Multi-agent orchestration)
- LangChain + Groq (LLM integration)
- MongoDB (Database)
- Resend (Email)

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Axios (API client)

**Deployment:**
- Vercel (Frontend)
- Render (Backend)
- MongoDB Atlas (Database)

---

## 📦 Quick Start (5 Minutes)

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB (local or Atlas)
- API Keys: Groq, Resend

### Installation Dependencies

```bash
# Clone
cd ai-agent-consultant

# Setup Backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup Frontend
cd frontend
npm install
```

### Configuration

**Backend `.env`:**
```env
GROQ_API_KEY=gsk_your_key
GROQ_MODEL=mixtral-8x7b-32768
MONGO_URI=mongodb://localhost:27017
MONGO_DB=multiagent_system
Resend_API_KEY=SG.your_key
FROM_EMAIL=noreply@youragency.com
SALES_EMAIL=sales@youragency.com
MAX_TOKEN_EMAIL=2000
MAX_TOKEN_REPORT=2000
PORT=8000
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ADMIN_EMAIL=admin@youragency.com
NEXT_PUBLIC_ADMIN_PASSWORD=YourPassword@99!
```

### Run

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python -m uvicorn index:app --reload --log-level debug #Ubuntu
python -m uvicorn index:app --loop asyncio --reload --log-level debug #Windows

# http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# http://localhost:3000
```

**Terminal 3 - MongoDB, If you want to run it locally:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

---

## 📁 Project Structure

```
ai-agent-consultant/
└── backend/
│   ├── agents/
│   │   ├── ai_consultant_system.py  # Core multi-agent system
│   │   ├── email_generator.py       # Email Writer agent   
│   ├── index.py                     # FastAPI REST API
│   ├── pdf_generator.py             # PDF generator for report
│   └── requirements.txt             # Python dependencies
│   └── .env.example                 # Environment variables
│
└── frontend/
    └── src/
    │   ├── app/
    │   │   ├── layout.tsx          # Root layout
    │   │   ├── page.tsx            # Landing page
    │   │   ├── conversation/       # Chat interface
    │   │   ├── preview/            # Preview + lead capture
    │   │   └── report/[id]/        # Full report view
    │   ├── components/
    │   │   ├── ui/                 # Reusable UI components
    │   │   ├── SocialProof.tsx
    │   │   ├── ProgressTracker.tsx
    │   │   └── ...
    │   ├── admin/                  # Admin Panel    
    │   │   └── ...
    │   ├── conversation/
    │   │   ├── Page.tsx
    │   ├── lib/
    │   │   ├── types.ts            # TypeScript interfaces
    │   │   ├── api.ts              # API client
    │   │   └── utils.ts            # Helper functions
    │   ├── hooks/
    │   │   ├── useSession.ts
    │   │   ├── useProgress.ts
    │   │   └── useSocialProof.ts
    ├── package.json
    ├── .env.local
    └── next.config.js
```

---

## 🚀 User Flow

```
1. Landing Page
   ↓ [User enters idea]
   
2. Conversation (Refinement)
   ↓ [AI asks questions]
   ↓ [User answers]
   ↓ [Requirements complete]
   
3. Preview Page
   ↓ [User sees free preview]
   ↓ [User enters email]
   
4. Generating Report (1-2 min)
   ↓ [Shows progress: 0% → 100%]
   ↓ [Displays social proof]
   
5. Full Report
   ↓ [4 tabs: Requirements, Architecture, UX, Business]
   ↓ [User can refine (2x)]
   
6. Sales Conversion
   → [CTA: Book consultation]
```

---

## 🎨 Design Philosophy

### Minimal & Modern
- Monochromatic color scheme (grays + black)
- Generous whitespace
- Clean typography
- Subtle animations
- Mobile-first responsive

### User Experience
- No overwhelming colors or gradients
- Clear visual hierarchy
- Fast loading times
- Smooth transitions
- Accessible design

### Example Color Palette
```css
--gray-50: #fafafa;   /* Backgrounds */
--gray-900: #18181b;  /* Text & primary actions */
--white: #ffffff;     /* Cards */
--accent: #3b82f6;    /* Optional accent (minimal use) */
```

---

## 📊 Lead Scoring Algorithm

Leads are scored 0-100 based on:

- **Engagement (0-25)**: Number of conversation exchanges
- **Complexity (0-30)**: Keywords like API, integration, video, automation
- **Technical Sophistication (0-20)**: AI, ML, NLP mentions
- **Business Clarity (0-15)**: Target audience, pricing mentions
- **Detail Level (0-10)**: Length of requirements

**Example Scores:**
- **90+**: Enterprise-level, complex AI agent with clear business model
- **70-89**: Well-defined project with technical requirements
- **50-69**: Good idea but needs more refinement
- **Below 50**: Vague or early-stage concept

---

## 📧 Email Flow

### User Email (Report Delivery)

## Email Writer Agent

AI agent takes generated reports + customer idea and below template, to generated unique email for each customer.

```
Subject: Your AI Agent Strategy Report is Ready, [Name]! 🚀

Hi [Name],

Your complete AI agent strategic report is ready! 🎉

We've analyzed your idea and created a comprehensive blueprint including:
✅ Detailed Requirements Analysis
✅ Complete Technical Architecture
✅ UX Design Framework & User Flows
✅ Business Model & Pricing Strategy

[VIEW FULL REPORT]

Based on our analysis:
• Development Timeline: 8-12 weeks
• Technical Complexity: Medium-High  
• Estimated Investment: $35,000 - $55,000

Want to discuss bringing this to life?
[BOOK FREE CONSULTATION]
```

### Sales Notification
```
Subject: 🔥 HIGH PRIORITY New Lead: [Name] - $50K Potential

Lead Score: 85/100
Name: John Doe
Email: john@example.com

Project Overview:
AI agent for enterprise video generation with automation...

Estimated Project Value: $50,000

Recommended Action:
🎯 Contact within 24 hours - High quality lead!

[VIEW SESSION DETAILS]
```

---

## 🔧 API Endpoints

### Public Endpoints

```
POST   /conversation/start
POST   /conversation/continue
POST   /preview/generate
POST   /lead/capture
GET    /progress/{session_id}
POST   /report/get
POST   /report/refine
GET    /social-proof
```

### Admin Endpoints

```
GET    /analytics/overview
GET    /analytics/top-leads
GET    /session/{session_id}/full
```

Full API documentation: `http://localhost:8000/docs`

---

### 🚀 Deployment to Render (Backend)


## 🚀 Deployment to Render (Backend)

Deploying the **FastAPI backend** to Render.com is simple and fully automated.

# 1. Create a Render Account
Login at https://render.com → “New → Web Service”.

# 2. Connect GitHub Repo
Select your repo and choose the **backend/** folder.

# 3. Configuration

**Build Command**
```
pip install -r requirements.txt
```

**Start Command**
```
uvicorn api:app --host 0.0.0.0 --port $PORT
```
# 4. Environment Variables

```
GROQ_API_KEY=your_key
GROQ_MODEL=mixtral-8x7b-32768
MONGO_URI=your_mongodb_atlas_uri
MONGO_DB=multiagent_system
RESEND_API_KEY=your_resend_key
FROM_EMAIL=noreply@youragency.com
SALES_EMAIL=sales@youragency.com
MAX_TOKEN_EMAIL=2000
MAX_TOKEN_REPORT=2000
PORT=8000
```

# 5. Deploy
Click **Deploy Web Service**.

---

## 🚀 Deployment to Vercel

# Deploy frontend

```
cd ../frontend
vercel
```

```
- `NEXT_PUBLIC_API_URL` (your backend URL)

See [Vercel Deployment Guide](./DEPLOYMENT.md) for detailed instructions.

---

## 🔒 Security

- ✅ Environment variables (never in code)
- ✅ Input validation (Pydantic)
- ✅ CORS configuration
- ✅ Rate limiting ready
- ✅ MongoDB connection pooling
- ✅ Error handling
- ❌ No hardcoded secrets
- ❌ No SQL injection (using MongoDB)

---

## 📈 Performance

- **Report Generation**: 1-2 minutes (4 AI agents sequential)
- **Preview Generation**: 20-30 seconds (1 AI agent)
- **Conversation**: 3-5 seconds per message
- **Page Load**: < 1 second (Next.js optimization)

---

## 💰 Cost Breakdown

### Free Tier (Testing)
- Vercel: Free (100GB bandwidth)
- MongoDB Atlas: Free (512MB)
- Groq: Free tier available
- Resend: Free (100 emails/day)

**Total: $0/month**

### Production (Scale)
- Vercel Pro: $20/month
- MongoDB M10: $9/month
- Resend: $15/month (40K emails)
- Groq: Pay-as-you-go

**Total: ~$44/month + usage**

---

## 📚 Documentation

- [API Documentation](http://localhost:8000/docs) - Interactive API docs
- [Deployment Guide](./DEPLOYMENT.md) - Vercel deployment steps
- [Architecture Overview](./ARCHITECTURE.md) - System design
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
docker ps

# Restart MongoDB
docker restart mongodb
```

### Groq API Timeout
```python
# Increase timeout in consultant_system.py
llm = ChatGroq(
    ...,
    request_timeout=120,  # 2 minutes
)
```

### CORS Error
```python
# Update allowed origins in api.py
allow_origins=[
    "http://localhost:3000",
    "https://your-frontend.vercel.app",
]
```

---

## 👥 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📄 License

MIT License - feel free to use for commercial projects!

---

## 🙏 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [Next.js](https://nextjs.org/)
- [CrewAI](https://www.crewai.com/)
- [LangChain](https://www.langchain.com/)
- [Groq](https://groq.com/)

---

## 📞 Support

- 📧 Email: hello@cipherslab.com


- 🐦 Twitter: [@ciphersLab](#)

---

## ⭐ Star Us!

If this project helped you, please star it on GitHub!

---

**Built with ❤️ for innovators and entrepreneurs**

*Ready to turn your AI agent idea into reality? Get started now!* 🚀