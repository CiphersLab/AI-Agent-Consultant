'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { consultantAPI } from '../lib/api';
// import { isValidEmail } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { isValidEmail, isValidPhoneNumber } from '../lib/validation'; // ADD THIS
import { Logo } from '../components/ui/Logo'; // ADD THIS

export default function PreviewPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  useEffect(() => {
    const storedSessionId = localStorage.getItem('session_id');
    if (!storedSessionId) {
      router.push('/');
      return;
    }
    setSessionId(storedSessionId);
    loadPreview(storedSessionId);
  }, [router]);

  const loadPreview = async (sessionId: string) => {
    try {
      const response = await consultantAPI.generatePreview(sessionId);
      setPreview(response.preview);
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    const newErrors: { name?: string; email?: string, phone?: string } = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';

    if (!email.trim()) newErrors.email = 'Email is required';
    // else if (!isValidEmail(email)) newErrors.email = 'Invalid email address';
 
    const emailValidation = isValidEmail(email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error;
    }
    
    // Phone validation
    if (phone) {
      const phoneValidation = isValidPhoneNumber(phone);
      if (!phoneValidation.valid) {
        newErrors.phone = phoneValidation.error;
      }
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate() || !sessionId) return;

    setIsSubmitting(true);

    try {
      await consultantAPI.captureLead({
        session_id: sessionId,
        email,
        name,
        phone: phone || undefined,
      });

      // Redirect to generating page
      router.push(`/report/${sessionId}?generating=true`);
    } catch (error) {
      console.error('Error capturing lead:', error);
      setErrors({ email: error instanceof Error ? error.message : 'Something went wrong' });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
         <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-12 flex-col">            
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
              <p className="text-gray-600">Generating preview...</p>
            </div>
            <Logo size="lg" />
          </div>
        </header>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="w-full flex justify-between flex-col-reverse md:flex-row gap-2">
            <div className='flex flex-row justify-between items-center'>
              <Button variant="ghost" size="sm" onClick={() => router.push('/conversation')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-gray-900">Your Analysis is Ready!</h1>
              </div>
            </div>
            

            <div className='flex justify-center md:justify-normal'>
              <Logo size="lg" />
            </div>
          </div>
          
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📄 Requirements Analysis</h2>
              <Badge variant="success">FREE PREVIEW</Badge>
            </div>

            <Card className="p-6 prose prose-sm max-w-none">
              <ReactMarkdown>{preview}</ReactMarkdown>
              
              {/* Fade effect */}
              <div className="relative -mt-20 h-20 bg-gradient-to-t from-white to-transparent" />
            </Card>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <Lock className="w-4 h-4 inline mr-1" />
                This is a preview. Enter your email to unlock the complete report with technical architecture, UX design, and business strategy.
              </p>
            </div>
          </div>

          {/* Lead Capture Form */}
          <div>
            <div className="sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Your Complete Report</h2>
              <p className="text-gray-600 mb-6">
                Unlock instant access to your full strategic analysis
              </p>

              <Card className="p-6 mb-6">
                <div className="space-y-3 mb-6">
                  {[
                    'Complete Requirements Analysis',
                    'Full Technical Architecture Blueprint',
                    'UX Design & User Flow Documentation',
                    'Business Strategy & Pricing Model',
                    '2 Free Report Refinements',
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    error={errors.name}
                  />
                  
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john..example.com"
                    required
                    error={errors.email}
                  />
                  
                  <Input
                    label="Phone Number (Optional)"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />

                  <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                    Get Full Report (Free) →
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    We'll email you the complete report immediately
                  </p>
                </form>
              </Card>

              {/* <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Trusted by innovators at</p>
                <div className="flex items-center justify-center gap-6 text-gray-400">
                  <span className="font-semibold">Company A</span>
                  <span className="font-semibold">Company B</span>
                  <span className="font-semibold">Company C</span>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}