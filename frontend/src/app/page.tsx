'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { consultantAPI } from './lib/api';
import { generateUserId } from './lib/utils';
import { Button } from './components/ui/Button';
import { Textarea } from './components/ui/Textarea';
import { Card } from './components/ui/Card';
import { 
  Sparkles, 
  CheckCircle, 
  Users, 
  Lightbulb,
  Code,
  Target,
  TrendingUp,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Logo } from './components/ui/Logo';

const EXAMPLE_IDEAS = [
  "AI chatbot for customer support with 24/7 availability",
  "Content generation tool for social media posts",
  "AI-powered email assistant that writes and schedules emails",
  "Voice AI agent for appointment booking",
  "Document analysis tool that extracts key insights",
  "AI video editor that auto-generates highlights",
  "Sales assistant that qualifies leads automatically",
  "Research agent that summarizes academic papers",
];

export default function LandingPage() {
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        console.log('⏳ Warming up API server...');
        await consultantAPI.healthCheck();
        console.log('✅ API server is awake!');
      } catch (err) {
        console.warn('⚠️ Failed to ping API server:', err);
      }
    };

    wakeUpServer();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (idea.trim().length < 10) {
      setError('Please provide more details about your idea (at least 10 characters)');
      return;
    }

    setIsLoading(true);

    try {
      const userId = generateUserId();
      const response = await consultantAPI.startConversation(userId, idea);
      
      localStorage.setItem('session_id', response.session_id);
      
      const initialMessages = [
        {
          role: 'agent',
          content: response.agent_response,
          timestamp: new Date().toISOString(),
        }
      ];
      localStorage.setItem('conversation_messages', JSON.stringify(initialMessages));
      
      if (response.requirements_complete) {
        router.push('/preview');
      } else {
        router.push('/conversation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleChipClick = (ideaText: string) => {
    setIdea(ideaText);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            {/* <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-sm">CIPHERSLAB</span> */}
            <Logo size="lg" />
          </div>
          {/* <Button variant="ghost" size="sm">
            Sign In
          </Button> */}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your AI Agent Idea Into{' '}
              <span className="text-blue-500">Strategic Reality</span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Get a comprehensive strategic report for your AI agent idea in minutes. 
              Our expert AI consultant analyzes your concept and delivers enterprise-grade 
              technical architecture, UX design, and business strategy.
            </p>

            {/* Form */}
            <div className="space-y-4">
              <Textarea
                placeholder="Describe your AI agent idea in a few sentences..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={4}
                className="w-full bg-white border-gray-200"
              />
              
              <Button 
                onClick={handleSubmit}
                size="lg" 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                isLoading={isLoading}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get My Free Analysis
              </Button>

              <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Free preview included
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Results in minutes
                </span>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Right Column - Visual */}
          <div className="relative hidden lg:block">
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              {/* Mockup of report */}
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-24 bg-blue-50 rounded-lg border-2 border-blue-200"></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-16 bg-gray-100 rounded"></div>
                  <div className="h-16 bg-gray-100 rounded"></div>
                  <div className="h-16 bg-gray-100 rounded"></div>
                </div>
              </div>
              
              {/* Floating icon */}
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example Ideas Marquee */}
      <section className="py-8 bg-white border-y border-gray-200 overflow-hidden">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Need Inspiration? Click any idea</p>
        </div>
        
        <div className="relative">
          <div className="flex gap-3 animate-marquee">
            {[...EXAMPLE_IDEAS, ...EXAMPLE_IDEAS].map((idea, index) => (
              <button
                key={index}
                onClick={() => handleChipClick(idea)}
                className="flex-shrink-0 px-4 py-2 rounded-full bg-gray-100 hover:bg-blue-500 hover:text-white text-sm text-gray-700 whitespace-nowrap transition-all cursor-pointer border border-gray-200 hover:border-blue-500"
              >
                <Lightbulb className="w-4 h-4 inline mr-2" />
                {idea}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What's Included in Your Strategic Report
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Three comprehensive sections that give you everything you need to build and launch
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 text-center hover:shadow-xl transition-shadow bg-white">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Requirements Analysis
            </h3>
            <p className="text-gray-600">
              Technical feasibility assessment and user need validation
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-xl transition-shadow bg-white">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Architecture Design
            </h3>
            <p className="text-gray-600">
              System design recommendations and technology stack
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-xl transition-shadow bg-white">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Business Strategy
            </h3>
            <p className="text-gray-600">
              Market positioning and monetization recommendations
            </p>
          </Card>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="bg-white py-16 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-center text-xl font-semibold text-gray-900 mb-12">
            Trusted by entrepreneurs worldwide
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500 mb-2">500+</div>
              <div className="text-sm text-gray-600">Entrepreneurs Helped</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500 mb-2">4.9/5</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500 mb-2">24hrs</div>
              <div className="text-sm text-gray-600">Average Turnaround</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500 mb-2">95%</div>
              <div className="text-sm text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our AI Development Services
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            End-to-end AI agent development from concept to deployment
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 bg-white">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Custom AI Agents</h3>
            <p className="text-gray-600 mb-4">
              Built with LangChain, CrewAI, and cutting-edge AI frameworks
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Multi-agent orchestration</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Natural language processing</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>API integrations</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6 bg-white">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Automation Solutions</h3>
            <p className="text-gray-600 mb-4">
              Intelligent workflows that adapt to your business
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Document processing</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Email automation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Data extraction</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6 bg-white">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Conversational AI</h3>
            <p className="text-gray-600 mb-4">
              24/7 intelligent customer experiences
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Support chatbots</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Voice assistants</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Multi-language support</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Proven Process
            </h2>
            <p className="text-lg text-gray-600">
              From idea to launch in 6-8 weeks
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Discovery', desc: 'Requirements & planning', time: '1-2 weeks' },
              { step: '02', title: 'Design', desc: 'Architecture & UX design', time: '1-2 weeks' },
              { step: '03', title: 'Development', desc: 'Build & test iteratively', time: '4-6 weeks' },
              { step: '04', title: 'Launch', desc: 'Deploy & support', time: 'Ongoing' },
            ].map((phase, index) => (
              <div key={index} className="relative">
                <Card className="p-6 bg-white h-full">
                  <div className="text-4xl font-bold text-blue-500 mb-3">{phase.step}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{phase.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{phase.desc}</p>
                  <div className="text-xs font-medium text-gray-500">{phase.time}</div>
                </Card>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-blue-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Your AI Agent?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get your free strategic report in minutes
          </p>
          <Button 
            variant="secondary"
            size="lg"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-white text-blue-500 hover:bg-gray-100"
          >
            Get Started Now →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-600">
          <p>© 2025 <a href='https://www.cipherslab.com' target='_blank'>CiphersLab</a>. Built with ❤️ for innovators.</p>
        </div>
      </footer>

      {/* Marquee Animation */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}