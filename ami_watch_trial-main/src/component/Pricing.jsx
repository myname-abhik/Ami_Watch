import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ami_watch_subscription');
      if (saved) {
        setActivePlan(JSON.parse(saved));
      }
    } catch {
      setActivePlan(null);
    }
  }, []);

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const sub = {
        plan: selectedPlan.name,
        price: selectedPlan.price,
        activatedAt: new Date().toLocaleDateString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000).toLocaleDateString(),
      };
      localStorage.setItem('ami_watch_subscription', JSON.stringify(sub));
      setActivePlan(sub);
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedPlan(null);
      }, 2500);
    }, 1200);
  };

  const plans = [
    {
      name: '3-Month Plan',
      price: '$9.99',
      billing: 'Billed every 3 months ($3.33/mo)',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-teal-500',
      features: [
        'Access to full HD library',
        'Download up to 10 titles / month',
        'Single Device Access',
        'Standard Audio (Stereo)',
        'Cancel anytime',
      ],
    },
    {
      name: '6-Month Plan',
      price: '$17.99',
      billing: 'Billed every 6 months ($2.99/mo)',
      badge: 'Most Popular',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-orange-500',
      features: [
        'Stream on 2 screens simultaneously',
        'Download up to 25 titles / month',
        'Early access to weekly anime releases',
        'Ad-Free HD & 4K Streaming',
        '5.1 Surround Sound support',
      ],
    },
    {
      name: '12-Month Plan',
      price: '$29.99',
      billing: 'Billed annually ($2.49/mo)',
      badge: 'Best Value',
      gradientFrom: 'from-red-600',
      gradientTo: 'to-orange-600',
      features: [
        'All exclusive content & VIP premiers',
        'Unlimited offline downloads',
        'Stream on up to 4 devices simultaneously',
        'Ultra HD 4K + Dolby Atmos',
        'Priority customer support',
      ],
    },
  ];

  return (
    <>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover -z-10 brightness-40 blur-md pointer-events-none"
      >
        <source src="https://videos.pexels.com/video-files/3129540/3129540-uhd_2560_1440_30fps.mp4" type="video/mp4" />
      </video>

      <div className="min-h-screen flex flex-col items-center justify-center pt-28 pb-20 px-4 font-sans text-white">
        {/* Header */}
        <div className="text-center max-w-2xl mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">
            Subscription Plans
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            Simple, Transparent <span className="text-orange-500">Pricing</span>
          </h1>
          <p className="text-neutral-300 text-sm md:text-base">
            Choose the subscription that fits your lifestyle. Upgrade, downgrade, or cancel at any time.
          </p>

          {activePlan && (
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold px-4 py-1.5 rounded-full">
              <i className="material-icons text-sm">check_circle</i>
              Active Plan: {activePlan.plan} (Activated on {activePlan.activatedAt})
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full max-w-6xl">
          {plans.map((p) => {
            const isCurrentActive = activePlan?.plan === p.name;
            return (
              <div
                key={p.name}
                className={`relative w-full max-w-sm rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 border bg-gradient-to-br ${p.gradientFrom} ${p.gradientTo} shadow-2xl hover:scale-105 hover:shadow-orange-500/20 ${
                  p.badge ? 'border-orange-400/60 ring-2 ring-orange-400/40' : 'border-white/20'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3.5 right-6 px-3 py-1 bg-black text-orange-400 border border-orange-500 rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg">
                    {p.badge}
                  </span>
                )}

                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{p.name}</h2>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black text-white">{p.price}</span>
                  </div>
                  <p className="text-xs text-white/80 mb-6">{p.billing}</p>

                  <div className="border-t border-white/20 pt-6 mb-8">
                    <ul className="space-y-3">
                      {p.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-white/95">
                          <i className="material-icons text-base text-white flex-shrink-0 mt-0.5">check_circle</i>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlan(p)}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all ${
                    isCurrentActive
                      ? 'bg-emerald-500 text-white cursor-default'
                      : 'bg-white text-neutral-900 hover:bg-neutral-100 hover:scale-[1.02]'
                  }`}
                >
                  {isCurrentActive ? '✓ Currently Active' : 'Subscribe Now'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Modal Checkout */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative">
              <button
                onClick={() => setSelectedPlan(null)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white"
              >
                <i className="material-icons">close</i>
              </button>

              {isSuccess ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <i className="material-icons text-3xl">check_circle</i>
                  </div>
                  <h3 className="text-xl font-bold">Subscription Activated!</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Welcome to Ami Watch Premium. Enjoy unlimited HD & 4K streaming.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-1">Confirm Subscription</h3>
                  <p className="text-xs text-neutral-400 mb-6">
                    Unlock full access to {selectedPlan.name} for {selectedPlan.price}.
                  </p>

                  <div className="bg-neutral-800/80 p-4 rounded-2xl mb-6">
                    <div className="flex justify-between items-center text-sm font-semibold mb-1">
                      <span>{selectedPlan.name}</span>
                      <span className="text-orange-400 text-base">{selectedPlan.price}</span>
                    </div>
                    <div className="text-xs text-neutral-400">{selectedPlan.billing}</div>
                  </div>

                  <div className="mb-6">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                      Select Payment Method (Simulation)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'card', label: 'Credit Card', icon: 'credit_card' },
                        { id: 'gpay', label: 'Google Pay', icon: 'account_balance_wallet' },
                        { id: 'paypal', label: 'PayPal', icon: 'payments' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                            paymentMethod === m.id
                              ? 'border-orange-500 bg-orange-500/10 text-white'
                              : 'border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:border-neutral-600'
                          }`}
                        >
                          <i className="material-icons text-lg">{m.icon}</i>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>Pay {selectedPlan.price} & Activate</>
                    )}
                  </button>

                  <p className="text-[11px] text-neutral-500 text-center mt-3">
                    Mock transaction. No real payment will be charged.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Pricing;
