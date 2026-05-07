import React, { useState, useEffect } from 'react';
import { 
  export { default } from './brand/Dashboard';

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-8">
              {/* SENT REQUESTS CARD */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-[#0F172A]">Sent Requests</h3>
                  <span className="text-sm font-bold text-[#0067fc] cursor-pointer hover:underline">View all</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500 text-white font-bold text-xs flex items-center justify-center">
                      M
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0F172A] truncate">Mithun</p>
                      <p className="text-[11px] text-[#94A3B8] truncate">₹27.0K · Suma</p>
                    </div>
                    <div className="bg-green-50 text-green-600 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      Accepted
                    </div>
                  </div>
                </div>
              </div>

              {/* PERFORMANCE METRICS CARD */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#0F172A] mb-6">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm font-medium text-[#64748B]">Total Reach</span>
                    <span className="text-sm font-bold text-[#0F172A]">0</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm font-medium text-[#64748B]">Total Engagement</span>
                    <span className="text-sm font-bold text-[#0F172A]">0</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm font-medium text-[#64748B]">Revenue Generated</span>
                    <span className="text-sm font-bold text-green-600">₹0</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm font-medium text-[#64748B]">Cost Per Lead</span>
                    <span className="text-sm font-bold text-[#0F172A]">₹0</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Best Creator</p>
                    <button className="text-sm font-bold text-[#0067fc] hover:underline">No data yet — 0.0% ER</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
