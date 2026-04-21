import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, ChevronDown, MessageSquare } from 'lucide-react';

interface SupportHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  initialTab?: 'how' | 'faq' | 'support';
  hideTabs?: boolean;
}

const safeFetch = async (url: string, options: RequestInit = {}, retries = 3, backoff = 1000) => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
};

export const SupportHubModal: React.FC<SupportHubModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onSuccess,
  onError,
  initialTab = 'how',
  hideTabs = false
}) => {
  const [activeTab, setActiveTab] = useState<'how' | 'faq' | 'support'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: userEmail || '',
    phone: '',
    cc: '',
    category: 'General',
    message: ''
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (userEmail) setFormData(prev => ({ ...prev, email: userEmail }));
    }
  }, [isOpen, initialTab, userEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      onError("Please fill in all required fields (Name, Email, Message).");
      return;
    }
    setLoading(true);
    try {
      const response = await safeFetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        onSuccess("Feedback sent! We will reach out to you within 2 working days.");
        onClose();
        setFormData({
          name: '',
          email: userEmail || '',
          phone: '',
          cc: '',
          category: 'General',
          message: ''
        });
      } else {
        const data = await response.json();
        onError(data.error || "Failed to send feedback. Please try again later.");
      }
    } catch (err) {
      console.error("Feedback error:", err);
      onError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (hideTabs) {
      if (activeTab === 'faq') return 'Frequently Asked Questions';
      if (activeTab === 'support') return 'Feedback & Support';
    }
    return 'Support Hub';
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-white/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-md shadow-2xl max-w-4xl w-full overflow-hidden relative border border-slate-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 lg:p-6 pr-14 lg:pr-16 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase mb-1">
              {getTitle()}
            </h2>
            <p className="text-slate-500 font-medium text-[9px] tracking-wider uppercase">
              {hideTabs ? (
                activeTab === 'faq' ? 'Find answers to common questions' : 'We value your input'
              ) : (
                'Everything you need in one place'
              )}
            </p>
          </div>
          {!hideTabs && (
            <div className="flex flex-wrap bg-slate-100 p-1 rounded-md">
              <button
                onClick={() => setActiveTab('how')}
                className={`px-4 py-2 rounded-md text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${activeTab === 'how' ? 'bg-white text-[#16A34A] shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}
              >
                How it Works
              </button>
              <button
                onClick={() => setActiveTab('faq')}
                className={`px-4 py-2 rounded-md text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${activeTab === 'faq' ? 'bg-white text-[#16A34A] shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}
              >
                FAQs
              </button>
              <button
                onClick={() => setActiveTab('support')}
                className={`px-4 py-2 rounded-md text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${activeTab === 'support' ? 'bg-white text-[#16A34A] shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}
              >
                Feedback & Support
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-md bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-[#16A34A] transition-all z-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8">
          {activeTab === 'how' && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-6">
                {[
                  { num: '1', title: 'Take Selfie', desc: 'Take a quick selfie. No professional equipment required.', color: 'bg-[#16A34A] text-slate-900', img: 'https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/step1.jpg?v=1' },
                  { num: '2', title: 'Upload Selfies', desc: 'Upload your photos to our platform. We’ll guide you on the best ones to use.', color: 'bg-emerald-100 text-[#16A34A]', img: 'https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/step2.jpg?v=1' },
                  { num: '3', title: 'Customize Style', desc: 'Choose your preferred clothing, background, and professional style.', color: 'bg-emerald-100 text-[#16A34A]', img: 'https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/hero1.png' },
                  { num: '4', title: 'Get Your Photos', desc: 'Our AI generates photorealistic portraits in under 2 hours.', color: 'bg-emerald-50 text-emerald-400', img: 'https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/step3.jpg?v=1' }
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-5 items-start relative p-4 rounded-md bg-slate-50/50 border border-slate-100 ">
                    <div className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${step.color} z-10`}>{step.num}</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-800 mb-1">{step.title}</h3>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-3">{step.desc}</p>
                      <div className="rounded-md overflow-hidden bg-white border border-slate-100 max-w-[200px]">
                        <img src={step.img} className="w-full h-auto object-contain max-h-[100px]" referrerPolicy="no-referrer" alt={step.title} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {[
                { q: "What is HeadshotStudioPro?", a: "HeadshotStudioPro is an AI-powered platform that delivers pro-grade executive portraits at a fraction of the cost. Built for CEOs and leaders who demand excellence." },
                { q: "How many photos do I need to upload?", a: "You only need to upload one clear, well-lit photo. Our AI is trained to understand your facial structure from a single image, though high-quality originals yield the best results." },
                { q: "How long does it take to get my photos?", a: "Preview generations are near-instant. Once you choose a style for a high-resolution portrait, our platform processes it live, taking approximately 2 to 4 minutes depending on your internet speed." },
                { q: "Can I use these for LinkedIn and professional profiles?", a: "Absolutely. Our portraits are specifically curated by art directors to meet the highest professional standards for lighting, attire, and composition." },
                { q: "Is my data and photo secure?", a: "Yes. We take privacy seriously. Your uploaded photos are used only for generation and are protected by industry-standard security protocols." },
                { q: "What is the difference between a Preview and a High-res Portrait?", a: "Previews allow you to test different styles and settings quickly. High-res Portraits are the final, polished assets optimized for large-scale use and printing." },
                { q: "Do I need a subscription?", a: "No. We believe in a transparent pay-as-you-go model. You only buy the credits you need, with no recurring monthly fees." },
                { q: "Can I change the attire or background?", a: "Yes! You can choose from various professional styles (Corporate, Creative, Formal), attire options (Suit & Tie, Shirt), and professional backdrops." },
                { q: "What if I'm not happy with the result?", a: "We provide tips and pro-settings to help you get the best result. If you still have issues, our support team is ready to assist you." },
                { q: "How do I get more credits?", a: "You can purchase credits directly in the 'Get Credits' section of the app. We offer various packages to suit your needs." },
                { q: "Is there a guest mode?", a: "Yes, you can sign in as a guest to explore the platform and see how it works before committing to a full account." },
                { q: "How can I contact support?", a: "You can reach us directly through the Feedback tab in this Support Hub for any technical or billing inquiries." }
              ].map((item, idx) => (
                <details key={idx} className="group bg-slate-50 rounded-md border border-slate-100 overflow-hidden">
                  <summary className="flex items-center justify-between p-4 lg:p-5 cursor-pointer list-none">
                    <span className="text-sm font-bold text-slate-800 ">{item.q}</span>
                    <span className="transition-transform duration-300 group-open:rotate-180"><ChevronDown className="w-4 h-4 text-slate-500" /></span>
                  </summary>
                  <div className="px-4 lg:px-5 pb-4 lg:pb-5">
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          )}

          {activeTab === 'support' && (
            <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="mb-6 text-center">
                <h3 className="text-base font-bold text-slate-800 mb-1">Need Help?</h3>
                <p className="text-[11px] text-slate-500 font-medium">Send us a message and our team will get back to you within 48 hours.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-1">Name *</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2.5 text-xs focus:outline-none focus:border-[#16A34A] transition-all" placeholder="Your Name" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-1">Email *</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2.5 text-xs focus:outline-none focus:border-[#16A34A] transition-all" placeholder="your@email.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-1">Phone</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2.5 text-xs focus:outline-none focus:border-[#16A34A] transition-all" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-1">Category</label>
                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2.5 text-xs focus:outline-none focus:border-[#16A34A] transition-all">
                      <option>General</option>
                      <option>Bug Report</option>
                      <option>Feature Request</option>
                      <option>Question</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-1">CC (Comma separated emails)</label>
                  <input type="text" value={formData.cc} onChange={e => setFormData({ ...formData, cc: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2.5 text-xs focus:outline-none focus:border-[#16A34A] transition-all" placeholder="colleague@email.com, boss@email.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-1">Message *</label>
                  <textarea required rows={3} value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2.5 text-xs focus:outline-none focus:border-[#16A34A] transition-all resize-none" placeholder="How can we help you?" />
                </div>
                <button disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><MessageSquare className="w-3.5 h-3.5" /><span>Send Feedback</span></>}
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
