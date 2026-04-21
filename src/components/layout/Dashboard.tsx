import React from 'react';
import { ArrowLeft, Image, Download, IdCard, Save, Coins, HelpCircle } from 'lucide-react';

interface DashboardProps {
  profile: any;
  generations: any[];
  onUpdate: (e: React.FormEvent) => void;
  onOpenShop: () => void;
  onOpenSupport: (tab?: string) => void;
  onOpenGallery: () => void;
  onDownloadAll: () => void;
  formFields: {
    name: string;
    setName: (val: string) => void;
    phone: string;
    setPhone: (val: string) => void;
  };
  isSaving: boolean;
  onBack: () => void;
  previewsUsed: number;
  MAX_FREE_PREVIEWS: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  generations,
  onUpdate,
  onOpenShop,
  onOpenSupport,
  onOpenGallery,
  onDownloadAll,
  formFields,
  isSaving,
  onBack,
  previewsUsed,
  MAX_FREE_PREVIEWS
}) => {
  const isGuest = profile?.id === 'guest' || profile?.email === 'Guest User';
  const displayName = isGuest ? 'Guest' : (profile?.full_name || (profile?.email ? profile.email.split('@')[0] : 'User'));

  return (
    <div className="flex-grow bg-[#fbfbfd] p-6 lg:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-studio-emerald text-[10px] font-black tracking-tight mb-3 uppercase">
              Studio Workspace
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">
              Welcome back, <span className="text-studio-emerald">{displayName}</span>.
            </h1>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:border-studio-emerald hover:text-studio-emerald transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Studio
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* My Gallery Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                    <Image className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={onDownloadAll} className="text-xs font-semibold text-slate-500 hover:text-studio-emerald flex items-center gap-1">
                      <Download className="w-3 h-3" /> Download All
                    </button>
                    <button onClick={onOpenGallery} className="text-xs font-semibold text-studio-emerald hover:underline">View All</button>
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">My Gallery</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">Access all your generated professional headshots in one place.</p>
                <div className="grid grid-cols-3 gap-2">
                  {generations.length > 0 ? (
                    generations.slice(0, 3).map(gen => (
                      <div key={gen.id} className="aspect-square rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
                        <img src={gen.image_data} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))
                  ) : (
                    [1, 2, 3].map(i => (
                      <div key={i} className="aspect-square rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Account Profile Card */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-studio-emerald">
                  <IdCard className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Account Profile</h3>
              </div>

              <form onSubmit={onUpdate} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent outline-none font-bold text-sm text-slate-700 focus:border-studio-emerald focus:bg-white transition-all shadow-sm"
                      value={formFields.name}
                      onChange={e => formFields.setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                    <input
                      type="email"
                      disabled
                      className="w-full p-4 rounded-2xl bg-slate-100 border-2 border-transparent outline-none font-bold text-sm text-slate-500 cursor-not-allowed"
                      value={profile?.email || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter phone"
                      className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent outline-none font-bold text-sm text-slate-700 focus:border-studio-emerald focus:bg-white transition-all shadow-sm"
                      value={formFields.phone}
                      onChange={e => formFields.setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Your Balance Card */}
            <div className="bg-white rounded-3xl p-8 text-slate-900 shadow-xl border border-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/10 transition-all" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-[#16A34A]" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-[#16A34A] uppercase tracking-widest mb-1">Active Balance</p>
                    <p className="text-3xl font-black tracking-tighter text-slate-900">{profile?.tokens ?? 0} <span className="text-xs font-medium text-slate-500">Credits</span></p>
                  </div>
                </div>

                {(() => {
                  const totalAvailable = MAX_FREE_PREVIEWS + (profile?.previews_remaining ?? 0);
                  const remaining = Math.max(0, totalAvailable - previewsUsed);
                  return (
                    <div className="flex justify-between items-center mb-8 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Preview Balance</p>
                        <p className="text-xl font-black tracking-tight text-slate-900">{remaining} <span className="text-[10px] font-medium text-slate-500">Free Left</span></p>
                      </div>
                      <div className={`h-2 w-2 rounded-full animate-pulse ${remaining > 0 ? 'bg-[#16A34A]' : 'bg-red-500'}`} />
                    </div>
                  );
                })()}

                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">Use your credits to generate high-resolution professional headshots with our advanced AI models.</p>
                <button
                  onClick={onOpenShop}
                  className="btn-primary w-full"
                >
                  Add Credits
                </button>
              </div>
            </div>

            {/* Need Assistance Card */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 mb-6">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">Need assistance?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">Our support team is here to help you with any questions or technical issues.</p>
              <button
                onClick={() => onOpenSupport('support')}
                className="w-full py-2.5 rounded-lg bg-slate-50 text-slate-600 text-sm font-semibold border border-slate-200 hover:bg-slate-100 transition-all active:scale-[0.98]"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
