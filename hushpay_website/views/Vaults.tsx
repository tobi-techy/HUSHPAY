import React, { useState } from 'react';
import { PixelButton, PixelCard, PixelInput } from '../components/RetroUI';
import { MOCK_VAULTS } from '../services/mockData';
import { Lock, Unlock, Plus, TrendingUp, Wallet, Shield } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const CHART_DATA = [
  { name: 'Jan', amt: 2400 },
  { name: 'Feb', amt: 3100 },
  { name: 'Mar', amt: 3800 },
  { name: 'Apr', amt: 4200 },
  { name: 'May', amt: 4800 },
  { name: 'Jun', amt: 6200 },
];

export const Vaults: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 font-pixel-body h-full overflow-y-auto">
      
      {/* Overview Stats */}
      <div className="col-span-1 lg:col-span-2">
        <PixelCard title="Net Worth Privacy Layer" className="mb-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
             <div className="border-2 border-gray-700 bg-gray-900/50 p-4 flex flex-row md:flex-col items-center justify-between md:justify-center relative overflow-hidden group hover:border-green-500 transition-colors">
                <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                    <Lock size={40} />
                </div>
                <span className="text-gray-400 uppercase text-sm mb-0 md:mb-2 tracking-widest">Total Locked</span>
                <span className="text-4xl text-green-400 font-bold drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">$6,200</span>
             </div>
             <div className="border-2 border-gray-700 bg-gray-900/50 p-4 flex flex-row md:flex-col items-center justify-between md:justify-center relative overflow-hidden group hover:border-white transition-colors">
                 <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                    <TrendingUp size={40} />
                </div>
                <span className="text-gray-400 uppercase text-sm mb-0 md:mb-2 tracking-widest">Reputation</span>
                <span className="text-4xl text-white font-bold">784</span>
             </div>
             <div className="border-2 border-gray-700 bg-gray-900/50 p-4 flex flex-row md:flex-col items-center justify-between md:justify-center relative overflow-hidden group hover:border-blue-500 transition-colors">
                 <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                    <Shield size={40} />
                </div>
                <span className="text-gray-400 uppercase text-sm mb-0 md:mb-2 tracking-widest">Active Proofs</span>
                <span className="text-4xl text-blue-400 font-bold">3</span>
             </div>
          </div>
        </PixelCard>
      </div>

      {/* Chart */}
      <div className="col-span-1">
        <PixelCard title="Growth History (Encrypted)" className="h-[350px] flex flex-col border-green-500/30">
            <div className="mt-6 flex-1 w-full h-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CHART_DATA}>
                        <defs>
                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontFamily: 'VT323', fontSize: 14}} />
                        <YAxis stroke="#666" tick={{fill: '#666', fontFamily: 'VT323', fontSize: 14}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#000', border: '2px solid #22c55e', fontFamily: 'VT323', color: '#fff' }}
                            itemStyle={{ color: '#22c55e' }}
                        />
                        <Area type="monotone" dataKey="amt" stroke="#22c55e" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-gray-500 mt-2 font-mono">
                DATA IS STORED LOCALLY AND ENCRYPTED
            </div>
        </PixelCard>
      </div>

      {/* Vault List */}
      <div className="col-span-1">
        <PixelCard title="Active Vaults" className="h-full min-h-[350px] relative">
            {!showCreate && (
                 <div className="absolute top-4 right-4 z-10">
                    <PixelButton onClick={() => setShowCreate(true)} className="text-sm py-1 px-3 bg-green-900 border-green-500 text-green-100 hover:bg-green-500 hover:text-black">
                        <Plus size={14} className="inline mr-2" /> NEW VAULT
                    </PixelButton>
                </div>
            )}
            
            {showCreate ? (
                <div className="mb-4 p-6 border-2 border-green-500 bg-black animate-in fade-in zoom-in-95 duration-200 relative">
                    <h3 className="mb-4 uppercase text-green-500 text-xl border-b border-green-900 pb-2">Create Time-Lock</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Vault Name</label>
                            <PixelInput placeholder="e.g. Apartment Deposit" autoFocus />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Amount (USDC)</label>
                            <PixelInput placeholder="0.00" type="number" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Unlock Date</label>
                            <PixelInput placeholder="Unlock Date" type="date" />
                        </div>
                        <div className="flex gap-2 justify-end mt-4 pt-2 border-t border-gray-800">
                            <PixelButton variant="secondary" onClick={() => setShowCreate(false)}>Cancel</PixelButton>
                            <PixelButton className="border-green-500 text-green-500 hover:bg-green-500 hover:text-black">Lock Funds</PixelButton>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 mt-8 h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {MOCK_VAULTS.map(vault => (
                        <div key={vault.id} className="border-2 border-gray-800 p-4 hover:border-white transition-all group bg-gray-950">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xl uppercase font-bold tracking-wide">{vault.name}</h3>
                                {vault.status === 'locked' ? (
                                    <div className="flex items-center text-red-500 gap-1 text-xs border border-red-900 bg-red-900/20 px-2 py-0.5">
                                        <Lock size={12} /> LOCKED
                                    </div>
                                ) : (
                                    <div className="flex items-center text-green-500 gap-1 text-xs border border-green-900 bg-green-900/20 px-2 py-0.5">
                                        <Unlock size={12} /> UNLOCKED
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 uppercase">Current Balance</span>
                                    <span className="text-green-400 font-bold text-2xl">${vault.amount.toLocaleString()}</span>
                                </div>
                                <div className="text-right">
                                     <div className="text-xs text-gray-500 uppercase">Unlocks</div>
                                     <div className="text-white">{vault.unlockDate}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add a placeholder empty vault to suggest more space */}
                    <div className="border-2 border-dashed border-gray-800 p-4 flex items-center justify-center opacity-30">
                        <span className="uppercase text-sm">Empty Slot</span>
                    </div>
                </div>
            )}
        </PixelCard>
      </div>
    </div>
  );
};