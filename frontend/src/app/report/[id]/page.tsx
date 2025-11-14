'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
// import { consultantAPI } from '@/lib/api';
import { useProgress } from '@/app/hooks/useProgress';
import { Session } from '@/app/lib/types';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Textarea } from '@/app/components/ui/Textarea';
import { ProgressTracker } from '@/app/components/ui/ProgressTracker';
import { SocialProof } from '@/app/components/ui/SocialProof';
import { Download, RefreshCw, ExternalLink, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { consultantAPI } from '@/app/lib/api';
import { FileDown } from 'lucide-react';
import { Logo } from '@/app/components/ui/Logo';

export default function ReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const isGenerating = searchParams.get('generating') === 'true';

  const [report, setReport] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState('requirements');
  const [isRefining, setIsRefining] = useState(false);
  const [refinementText, setRefinementText] = useState('');
  const [refinementError, setRefinementError] = useState('');

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);


  const { progress, isPolling, startPolling, stopPolling } = useProgress(
    sessionId,
    isGenerating
  );

  useEffect(() => {
    if (isGenerating) {
      startPolling();
    }
  }, [isGenerating, startPolling]);

  useEffect(() => {
    if (progress && progress.progress_percentage >= 100) {
      stopPolling();
      loadReport();
    }
  }, [progress, stopPolling]);

  useEffect(() => {
    if (!isGenerating) {
      loadReport();
    }
  }, [isGenerating]);

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      await consultantAPI.downloadReportPDF(sessionId);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const loadReport = async () => {
    try {
      const data = await consultantAPI.getReport(sessionId);
      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
    }
  };

  const handleRefine = async () => {
    if (!refinementText.trim() || refinementText.length < 10) {
      setRefinementError('Please provide more details (at least 10 characters)');
      return;
    }

    setIsRefining(true);
    setRefinementError('');

    try {
      const result = await consultantAPI.refineReport(sessionId, refinementText);

      if (result.success) {
        setRefinementText('');
        await loadReport();
        
        // Show success message
        alert(`Report updated successfully!\n\n${result.changes_summary}\n\nRefinements left: ${result.refinements_left}`);
      } else {
        setRefinementError(result.message || 'Failed to refine report');
      }
    } catch (error) {
      setRefinementError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsRefining(false);
    }
  };

  const handleDownload = (format: 'json' | 'txt') => {
    if (!report) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(report.context, null, 2);
      filename = `ai-agent-report-${sessionId.substring(0, 8)}.json`;
      mimeType = 'application/json';
    } else {
      content = `
AI AGENT STRATEGIC REPORT
=========================

REQUIREMENTS ANALYSIS
--------------------
${report.context.requirement_gathering || 'N/A'}

TECHNICAL ARCHITECTURE
---------------------
${report.context.technical_architecture || 'N/A'}

UX DESIGN
---------
${report.context.ux_design || 'N/A'}

BUSINESS STRATEGY
----------------
${report.context.business_strategy || 'N/A'}
      `.trim();
      filename = `ai-agent-report-${sessionId.substring(0, 8)}.txt`;
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Show generating screen
  if (isGenerating && (!progress || progress.progress_percentage < 100)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className='flex'>            
            <div className="max-w-5xl mx-auto px-4 py-4 flex flex-row gap-14 items-center">
              <div className='flex'>
                <Logo size="lg" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Generating Your Report...</h1>
              </div>
              
            </div>
          </div>
          
        </header>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="p-8 mb-8">
            <ProgressTracker
              percentage={progress?.progress_percentage || 0}
              currentStage={progress?.current_stage}
            />
          </Card>

          <SocialProof />

          <div className="text-center mt-8">
            <p className="text-gray-600">
              This usually takes 1-2 minutes. We're crafting a detailed strategic analysis just for you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show report
  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'requirements', label: 'Requirements', icon: '📋' },
    { id: 'architecture', label: 'Architecture', icon: '🏗️' },
    { id: 'ux', label: 'UX Design', icon: '🎨' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'refine', label: 'Refine', icon: '🔄' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className='flex mb-4'>
              <Logo size="lg" />
          </div>
          <div className="flex md:items-center justify-between flex-col md:flex-row">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Your Strategic Report</h1>
              <p className="text-sm text-gray-600">Complete AI agent analysis</p>
            </div>
            <div className="flex md:items-center gap-3 flex-col md:flex-row">
              {report.refinements_left > 0 && (
                <Badge variant="success">
                  {report.refinements_left} refinement{report.refinements_left > 1 ? 's' : ''} left
                </Badge>
              )}
              
              {/* PDF Download Button - NEW */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadPDF}
                isLoading={isDownloadingPDF}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download PDF
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload('json')}
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload('txt')}
              >
                <Download className="w-4 h-4 mr-2" />
                TXT
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>


      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'requirements' && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Requirements Analysis</h2>
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown>
                {report.context.requirement_gathering || 'No requirements available'}
              </ReactMarkdown>
            </div>
          </Card>
        )}

        {activeTab === 'architecture' && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🏗️ Technical Architecture</h2>
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown>
                {report.context.technical_architecture || 'No architecture available'}
              </ReactMarkdown>
            </div>
          </Card>
        )}

        {activeTab === 'ux' && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🎨 UX Design & User Flows</h2>
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown>
                {report.context.ux_design || 'No UX design available'}
              </ReactMarkdown>
            </div>
          </Card>
        )}

        {activeTab === 'business' && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">💼 Business Strategy</h2>
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown>
                {report.context.business_strategy || 'No business strategy available'}
              </ReactMarkdown>
            </div>
          </Card>
        )}

        {activeTab === 'refine' && (
          <div className="space-y-6">
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🔄 Refine Your Report</h2>
              
              {report.refinements_left > 0 ? (
                <>
                  <p className="text-gray-600 mb-6">
                    You have <strong>{report.refinements_left}</strong> refinement
                    {report.refinements_left > 1 ? 's' : ''} available. Add any additional 
                    information or changes you'd like to see in your report.
                  </p>

                  <div className="space-y-4">
                    <Textarea
                      label="What would you like to add or change?"
                      placeholder="Example: I forgot to mention it should also integrate with Instagram Reels and support scheduling for different time zones..."
                      value={refinementText}
                      onChange={(e) => setRefinementText(e.target.value)}
                      rows={6}
                      error={refinementError}
                    />

                    <Button
                      onClick={handleRefine}
                      isLoading={isRefining}
                      disabled={!refinementText.trim()}
                      size="lg"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Update Report
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    You've Used All Your Refinements
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Want unlimited refinements and personalized implementation guidance? 
                    Book a free consultation with our team.
                  </p>
                  <Button size="lg">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Book Free Consultation
                  </Button>
                </div>
              )}
            </Card>

            {/* Tips Card */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3">💡 Tips for Better Refinements</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Be specific about what you want to change or add</li>
                <li>• Mention any technical constraints or preferences</li>
                <li>• Include details about integrations or third-party services</li>
                <li>• Specify target platforms or deployment requirements</li>
              </ul>
            </Card>
          </div>
        )}

        {/* CTA Section */}
        <Card className="mt-8 p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your AI Agent?</h2>
          <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
            We've helped 50+ companies turn their AI ideas into reality. 
            Let's discuss how we can build this for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://calendly.com/muddassirkhanani/cipherslab" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="lg">
                Schedule Free Consultation
              </Button>
            </a>
            <a href="https://cipherslab.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                <FileText className="w-4 h-4 mr-2" />
                View Case Studies
              </Button>
            </a>
            
          </div>
          <p className="text-sm text-gray-400 mt-6">
            No commitment required • 30-minute strategy session
          </p>
        </Card>
      </div>
    </div>
  );
}