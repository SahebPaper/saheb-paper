import React from 'react';
import { SlidersHorizontal, X, Check } from 'lucide-react';

interface RewinderFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductFilter: string;
  setSelectedProductFilter: (product: string) => void;
  setFilterProduct: (product: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  timeframe: string;
  setTimeframe: (timeframe: any) => void;
  selectedDate: string;
  activeCascadingFilterCount: number;
  setShowCascadingModal: (show: boolean) => void;
  handleClearFilters: () => void;
  reels: any[];
  availableProducts: string[];
  cleanProductName: (name: string) => string;
}

export const RewinderFilterModal: React.FC<RewinderFilterModalProps> = ({
  isOpen,
  onClose,
  selectedProductFilter,
  setSelectedProductFilter,
  setFilterProduct,
  statusFilter,
  setStatusFilter,
  timeframe,
  setTimeframe,
  selectedDate,
  activeCascadingFilterCount,
  setShowCascadingModal,
  handleClearFilters,
  reels,
  availableProducts,
  cleanProductName,
}) => {
  if (!isOpen) return null;

  const totalReelsCount = reels.filter(r => r.status !== 'DISPATCHED').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-h-[90vh] md:max-h-[85vh] md:max-w-[720px] bg-white dark:bg-[#11192e] rounded-t-[28px] md:rounded-[28px] shadow-2xl border border-[#DDE0EE] dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-150 font-['Inter',sans-serif]">
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-3 mb-1 md:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE0EE] dark:border-slate-800 bg-white dark:bg-[#11192e] shrink-0">
          <div className="flex items-center gap-2.5 text-[#1B1F3B] dark:text-white font-[800] text-[17px]">
            <SlidersHorizontal className="w-5 h-5 text-[#4B32C3]" strokeWidth={2.5} />
            <span>Filter Rewinder Reels</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F3F4FA] dark:bg-slate-800 text-[#4A5270] dark:text-slate-300 hover:text-[#1B1F3B] hover:bg-[#E8EBF5] dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Close filter modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-left">
          
          {/* Section 1: PAPER TYPE / PRODUCT */}
          <div>
            <h3 className="text-[11px] font-[800] text-[#1B1F3B] dark:text-slate-300 uppercase tracking-wider mb-2.5">
              PAPER TYPE / PRODUCT
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Option 1: All Paper Types */}
              {(() => {
                const isSelected = selectedProductFilter === 'all';
                return (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductFilter('all');
                      setFilterProduct('ALL');
                    }}
                    className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-[16px] border flex items-center justify-between transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#EDE9FD] dark:bg-indigo-950/50 border-[#4B32C3] dark:border-indigo-500 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 border-[#DDE0EE] dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center min-w-0 flex-1 mr-2">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mr-3 transition ${
                          isSelected
                            ? 'bg-[#4B32C3] text-white'
                            : 'border-2 border-[#DDE0EE] dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-[13px] font-[700] text-[#1B1F3B] dark:text-white leading-tight break-words">
                        All Paper Types
                      </span>
                    </div>
                    <span
                      className={`text-[12px] font-[800] px-2.5 py-0.5 rounded-full shrink-0 min-w-[32px] text-center ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 text-[#4B32C3] dark:text-indigo-300 shadow-xs'
                          : 'bg-[#F3F4FA] dark:bg-slate-700/60 text-[#4A5270] dark:text-slate-300'
                      }`}
                    >
                      {totalReelsCount}
                    </span>
                  </button>
                );
              })()}

              {/* Individual Products */}
              {availableProducts.map(p => {
                const count = reels.filter(
                  r => cleanProductName(r.product) === p && r.status !== 'DISPATCHED'
                ).length;
                const isSelected = selectedProductFilter === p;

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSelectedProductFilter(p);
                      setFilterProduct(p);
                    }}
                    className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-[16px] border flex items-center justify-between transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#EDE9FD] dark:bg-indigo-950/50 border-[#4B32C3] dark:border-indigo-500 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 border-[#DDE0EE] dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center min-w-0 flex-1 mr-2">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mr-3 transition ${
                          isSelected
                            ? 'bg-[#4B32C3] text-white'
                            : 'border-2 border-[#DDE0EE] dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span
                        className={`text-[13px] font-[700] leading-tight break-words ${
                          isSelected
                            ? 'text-[#1B1F3B] dark:text-white'
                            : count === 0
                            ? 'text-[#4A5270]/60 dark:text-slate-500'
                            : 'text-[#1B1F3B] dark:text-slate-200'
                        }`}
                      >
                        {p}
                      </span>
                    </div>
                    <span
                      className={`text-[12px] font-[800] px-2.5 py-0.5 rounded-full shrink-0 min-w-[32px] text-center ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 text-[#4B32C3] dark:text-indigo-300 shadow-xs'
                          : 'bg-[#F3F4FA] dark:bg-slate-700/60 text-[#4A5270] dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: QC STATUS */}
          <div>
            <h3 className="text-[11px] font-[800] text-[#1B1F3B] dark:text-slate-300 uppercase tracking-wider mb-2.5">
              QC STATUS
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {/* All */}
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`min-h-[44px] px-3 py-2 rounded-[16px] text-xs font-[800] text-center transition cursor-pointer border flex items-center justify-center ${
                  statusFilter === 'all'
                    ? 'bg-[#4B32C3] text-white border-[#4B32C3] shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 text-[#1B1F3B] dark:text-slate-200 border-[#DDE0EE] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <span>All</span>
              </button>

              {/* Grade A */}
              <button
                type="button"
                onClick={() => setStatusFilter('GRADE_A')}
                className={`min-h-[44px] px-3 py-2 rounded-[16px] text-xs font-[800] text-center transition cursor-pointer border flex items-center justify-center gap-2 ${
                  statusFilter === 'GRADE_A'
                    ? 'bg-[#4B32C3] text-white border-[#4B32C3] shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 text-[#1B1F3B] dark:text-slate-200 border-[#DDE0EE] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#0B6B3A] shrink-0" />
                <span>Grade A</span>
              </button>

              {/* Grade B */}
              <button
                type="button"
                onClick={() => setStatusFilter('GRADE_B')}
                className={`min-h-[44px] px-3 py-2 rounded-[16px] text-xs font-[800] text-center transition cursor-pointer border flex items-center justify-center gap-2 ${
                  statusFilter === 'GRADE_B'
                    ? 'bg-[#4B32C3] text-white border-[#4B32C3] shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 text-[#1B1F3B] dark:text-slate-200 border-[#DDE0EE] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#B7791F] shrink-0" />
                <span>Grade B</span>
              </button>
            </div>
          </div>

          {/* Section 3: DATE WINDOW */}
          <div>
            <h3 className="text-[11px] font-[800] text-[#1B1F3B] dark:text-slate-300 uppercase tracking-wider mb-2.5">
              DATE WINDOW
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTimeframe('day')}
                className={`min-h-[50px] px-4 py-2.5 rounded-[16px] text-center transition cursor-pointer border flex flex-col items-center justify-center ${
                  timeframe !== 'all'
                    ? 'bg-[#4B32C3] text-white border-[#4B32C3] shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 text-[#1B1F3B] dark:text-slate-200 border-[#DDE0EE] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <span className="text-[13px] font-[800] leading-tight block">Calendar Date</span>
                <span className="text-[11px] font-[600] opacity-90 leading-tight block mt-0.5">
                  {selectedDate.split('-').reverse().join('/')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('all')}
                className={`min-h-[50px] px-4 py-2.5 rounded-[16px] text-center transition cursor-pointer border flex flex-col items-center justify-center ${
                  timeframe === 'all'
                    ? 'bg-[#4B32C3] text-white border-[#4B32C3] shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 text-[#1B1F3B] dark:text-slate-200 border-[#DDE0EE] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <span className="text-[13px] font-[800] leading-tight block">All Dates</span>
                <span className="text-[11px] font-[600] opacity-90 leading-tight block mt-0.5">
                  All-Time
                </span>
              </button>
            </div>
          </div>

          {/* Section 4: Advanced Specs */}
          <div className="p-4 rounded-[18px] bg-white dark:bg-slate-800/60 border border-[#DDE0EE] dark:border-slate-700 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-[13px] font-[800] text-[#1B1F3B] dark:text-white leading-tight">
                Advanced Specs
              </h4>
              <p className="text-[11px] font-[500] text-[#4A5270] dark:text-slate-400 mt-0.5">
                Filter by GSM, Decal (cm) and Ply
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                setShowCascadingModal(true);
              }}
              className="px-4 py-2 rounded-[14px] bg-[#EDE9FD] dark:bg-indigo-950/60 text-[#4B32C3] dark:text-indigo-400 font-[800] text-[12px] hover:bg-[#DDD6FE] dark:hover:bg-indigo-900/50 transition cursor-pointer shrink-0 min-h-[40px] flex items-center"
            >
              <span>
                {activeCascadingFilterCount > 0
                  ? `Specs (${activeCascadingFilterCount})`
                  : 'Open Specs'}
              </span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#DDE0EE] dark:border-slate-800 bg-white dark:bg-[#11192e] shrink-0 gap-3">
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[13px] font-[700] text-[#4A5270] dark:text-slate-400 hover:text-[#B3261E] dark:hover:text-red-400 transition cursor-pointer min-h-[44px] flex items-center px-1"
          >
            Reset all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-7 py-3 rounded-[16px] bg-[#4B32C3] hover:bg-[#3B27B0] active:scale-95 text-white font-[800] text-[13px] tracking-wide transition shadow-md cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            APPLY &amp; CLOSE
          </button>
        </div>

      </div>
    </div>
  );
};
