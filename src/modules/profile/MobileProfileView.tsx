import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  User,
  Edit3,
  Settings,
  Bell,
  Lock,
  KeyRound,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Users,
  Globe,
  Palette,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Building2,
  Phone,
  Mail,
  ShieldAlert,
  Sun,
  Moon,
  Info,
  RefreshCw,
} from 'lucide-react';
import { getCompanyConfig } from '../../config/company';
import { APP_VERSION } from '../../config/version';
import { AppUpdateModal } from '../../components/AppUpdateModal';
import { PrivacyPolicyModal } from '../../components/PrivacyPolicyModal';
import { getStoredTheme, applyTheme } from '../../utils/themeHelper';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useMobileBackHandler } from '../../hooks/useMobileBackHandler';
import { ROLE_LABELS } from '../../data/types';

interface MobileProfileViewProps {}

export const MobileProfileView: React.FC<MobileProfileViewProps> = () => {
  const { user, updateUserProfile, logout, hasAccess } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const companyConfig = getCompanyConfig();

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Modals & Bottom Sheets
  const [activeModal, setActiveModal] = useState<
    'edit' | 'security' | 'notifications' | 'language' | 'theme' | 'help' | 'privacy' | null
  >(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Lock background page scroll completely whenever any modal is open
  useBodyScrollLock(!!activeModal || logoutConfirmOpen || isUpdateModalOpen);

  // Intercept Android hardware Back and browser Back to close open modal first
  useMobileBackHandler(!!activeModal, () => setActiveModal(null), 'mobileProfileActiveModal');
  useMobileBackHandler(logoutConfirmOpen, () => setLogoutConfirmOpen(false), 'mobileProfileLogoutModal');
  useMobileBackHandler(isUpdateModalOpen, () => setIsUpdateModalOpen(false), 'mobileProfileUpdateModal');

  // Edit Profile Form State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pin, setPin] = useState(user?.pin || '');
  const [securityQuestion, setSecurityQuestion] = useState(
    user?.securityQuestion || 'What is your favorite color?'
  );
  const [securityAnswer, setSecurityAnswer] = useState(user?.securityAnswer || '');
  const [showPin, setShowPin] = useState(false);

  // Notification Toggles
  const [notifProd, setNotifProd] = useState(true);
  const [notifQc, setNotifQc] = useState(true);
  const [notifDispatch, setNotifDispatch] = useState(true);

  // Toast / Feedback
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  const [darkMode, setDarkMode] = useState<boolean>(() => getStoredTheme());

  // Real-time synchronization with global theme changes
  useEffect(() => {
    const syncTheme = (e?: any) => {
      if (e?.detail?.isDark !== undefined) {
        setDarkMode(e.detail.isDark);
      } else {
        setDarkMode(getStoredTheme());
      }
    };

    window.addEventListener('saheb_theme_changed', syncTheme);
    window.addEventListener('storage', syncTheme);
    return () => {
      window.removeEventListener('saheb_theme_changed', syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    applyTheme(next);
  };

  if (!user) return null;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast('Display Name cannot be empty', 'error');
      return;
    }

    if (!securityAnswer.trim() || securityAnswer.trim().toLowerCase() === 'blue') {
      showToast('A valid security answer is required (cannot be "blue")', 'error');
      return;
    }

    const updated = await updateUserProfile({
      displayName: displayName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
    });

    if (updated) {
      showToast('Profile updated successfully!', 'success');
      setActiveModal(null);
    } else {
      showToast('Failed to update profile', 'error');
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinTrimmed = pin.trim();
    if (pinTrimmed && (pinTrimmed.length !== 4 || isNaN(Number(pinTrimmed)))) {
      showToast('Security PIN must be exactly 4 numeric digits', 'error');
      return;
    }

    const payload = {
      displayName: user.displayName,
      email: user.email || '',
      phone: user.phone || '',
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
      ...(pinTrimmed ? { pin: pinTrimmed } : {}),
    };

    const updated = await updateUserProfile(payload);

    if (updated) {
      showToast('Security settings updated successfully!', 'success');
      setActiveModal(null);
      setPin('');
    } else {
      showToast('Failed to update security settings', 'error');
    }
  };

  const openEditModal = () => {
    setDisplayName(user.displayName);
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setActiveModal('edit');
  };

  const openSecurityModal = () => {
    setPin('');
    setSecurityQuestion(user.securityQuestion || 'What is your favorite color?');
    setSecurityAnswer(user.securityAnswer || '');
    setActiveModal('security');
  };

  const isAdmin = user.role === 'Admin';

  // Compute User Initials
  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  const todayFormatted = new Date().toLocaleDateString('en-GB');

  return (
    <div className="w-full min-h-screen bg-[#F3F4FA] dark:bg-slate-900 px-4 pt-3 pb-10 font-sans select-none max-w-[480px] mx-auto">
      {/* Scoped CSS for Uiverse.io JkHuger Sun/Moon Theme Toggle */}
      <style>{`
        .theme {
          display: flex;
          align-items: center;
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;
          user-select: none;
        }
        .theme__toggle-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          width: 58px;
          height: 32px;
        }
        .theme__toggle {
          background-color: #8FD5FF;
          border-radius: 9999px;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08) inset;
          cursor: pointer;
          width: 58px;
          height: 32px;
          -webkit-appearance: none;
          appearance: none;
          transition: background-color 0.35s ease-in-out;
          outline: none;
          margin: 0;
          display: block;
        }
        .theme__toggle:checked {
          background-color: #1E2238;
        }
        .theme__toggle:before {
          content: "";
          display: block;
          position: absolute;
          top: 4px;
          left: 4px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #FBBF24;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.35s ease-in-out;
        }
        .theme__toggle:checked:before {
          transform: translateX(26px);
          background-color: #F8FAFC;
        }
        .theme__icon {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
        }
        .theme__toggle:checked ~ .theme__icon {
          transform: translateX(26px);
        }
        .theme__icon-part {
          position: absolute;
          border-radius: 50%;
          top: calc(50% - 6px);
          left: calc(50% - 6px);
          width: 12px;
          height: 12px;
          transition: box-shadow 0.35s ease-in-out, opacity 0.35s ease-in-out, transform 0.35s ease-in-out;
          transform: scale(0.5);
        }
        .theme__icon-part ~ .theme__icon-part {
          background-color: #D97706;
          border-radius: 2px;
          top: 50%;
          left: calc(50% - 1px);
          transform: rotate(0deg) translateY(7px);
          transform-origin: 50% 0;
          width: 2px;
          height: 3px;
        }
        .theme__icon-part:nth-child(3) { transform: rotate(45deg) translateY(7px); }
        .theme__icon-part:nth-child(4) { transform: rotate(90deg) translateY(7px); }
        .theme__icon-part:nth-child(5) { transform: rotate(135deg) translateY(7px); }
        .theme__icon-part:nth-child(6) { transform: rotate(180deg) translateY(7px); }
        .theme__icon-part:nth-child(7) { transform: rotate(225deg) translateY(7px); }
        .theme__icon-part:nth-child(8) { transform: rotate(270deg) translateY(7px); }
        .theme__icon-part:nth-child(9) { transform: rotate(315deg) translateY(7px); }
        .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(1) {
          box-shadow: 4px -4px 0 2px #1E2238 inset;
          transform: scale(0.95);
          top: 1px;
          left: -1px;
        }
        .theme__toggle:checked ~ .theme__icon .theme__icon-part ~ .theme__icon-part {
          opacity: 0;
          transform: rotate(0deg) translateY(12px);
        }
        .theme__fill {
          display: none;
        }
      `}</style>
      
      {/* Toast Notification Alert */}
      {feedbackMsg && (
        <div className="fixed top-4 left-4 right-4 z-50 p-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          {feedbackType === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <Info className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{feedbackMsg}</span>
        </div>
      )}

      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-[14px] bg-white dark:bg-slate-800 border border-[#E8EBF5] dark:border-slate-700 flex items-center justify-center text-[#4B32C3] dark:text-indigo-400 shadow-xs active:scale-95 transition cursor-pointer shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <h1 className="text-[19px] font-[800] text-[#1B1F3B] dark:text-white tracking-tight leading-none">
            My Profile
          </h1>
        </div>
        <span className="text-[13px] font-[600] text-[#4A5270] dark:text-slate-400 tracking-wide">
          {todayFormatted}
        </span>
      </div>

      {/* 2. HERO CARD */}
      <div className="rounded-[24px] bg-gradient-to-br from-[#3B27B0] to-[#6B4DF0] p-5 text-white shadow-[0_12px_28px_rgba(75,50,195,0.28)] relative overflow-hidden mb-5">
        <div className="flex items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-[18px] bg-white text-[#3B27B0] font-[900] text-[22px] flex items-center justify-center shadow-md tracking-wider">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#10B981] border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0 pl-4">
            <h2 className="text-[18px] font-[800] text-white leading-tight break-words">
              {user.displayName}
            </h2>
            <p className="text-[12px] font-[500] text-white/85 mt-1 break-all">
              {user.email || `${user.username.toLowerCase()}@sahebpaper.com`}
            </p>
          </div>
        </div>

        {/* Chips */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="min-h-[30px] px-3.5 py-1 rounded-full bg-white text-[#3A25A8] text-[11px] font-[800] uppercase tracking-wider shadow-xs flex items-center">
            {ROLE_LABELS[user.role] || user.role}
          </span>
          <span className="min-h-[30px] px-3.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-[700] tracking-wide border border-white/20 backdrop-blur-xs flex items-center">
            {user.empId || 'EMP-001'}
          </span>
        </div>
      </div>

      {/* 3. SECTION: MY ACCOUNT */}
      <div className="mb-5">
        <h2 className="text-[15px] font-[800] text-[#1B1F3B] dark:text-white mb-3">
          My account
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Edit Profile */}
          <button
            type="button"
            onClick={openEditModal}
            className="w-full bg-white dark:bg-slate-800 rounded-[20px] p-4 border border-[#E8EBF5] dark:border-slate-700 shadow-[0_2px_8px_rgba(27,31,59,0.04)] flex flex-col justify-between text-left min-h-[116px] hover:border-[#4B32C3]/30 active:scale-[0.98] transition cursor-pointer"
          >
            <div className="w-11 h-11 rounded-[14px] bg-[#EDE9FD] dark:bg-indigo-950/60 text-[#4B32C3] dark:text-indigo-400 flex items-center justify-center mb-3 shrink-0">
              <Edit3 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[14px] font-[800] text-[#1B1F3B] dark:text-white leading-tight block">
                Edit Profile
              </span>
              <span className="text-[11px] font-[500] text-[#4A5270] dark:text-slate-400 mt-1 leading-snug block">
                Name, phone, email
              </span>
            </div>
          </button>

          {/* Account Settings */}
          <button
            type="button"
            onClick={openSecurityModal}
            className="w-full bg-white dark:bg-slate-800 rounded-[20px] p-4 border border-[#E8EBF5] dark:border-slate-700 shadow-[0_2px_8px_rgba(27,31,59,0.04)] flex flex-col justify-between text-left min-h-[116px] hover:border-[#4B32C3]/30 active:scale-[0.98] transition cursor-pointer"
          >
            <div className="w-11 h-11 rounded-[14px] bg-[#EDE9FD] dark:bg-indigo-950/60 text-[#4B32C3] dark:text-indigo-400 flex items-center justify-center mb-3 shrink-0">
              <Settings className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[14px] font-[800] text-[#1B1F3B] dark:text-white leading-tight block">
                Account Settings
              </span>
              <span className="text-[11px] font-[500] text-[#4A5270] dark:text-slate-400 mt-1 leading-snug block">
                Security PIN &amp; password
              </span>
            </div>
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => setActiveModal('notifications')}
            className="w-full bg-white dark:bg-slate-800 rounded-[20px] p-4 border border-[#E8EBF5] dark:border-slate-700 shadow-[0_2px_8px_rgba(27,31,59,0.04)] flex flex-col justify-between text-left min-h-[116px] hover:border-[#4B32C3]/30 active:scale-[0.98] transition cursor-pointer"
          >
            <div className="w-11 h-11 rounded-[14px] bg-[#EDE9FD] dark:bg-indigo-950/60 text-[#4B32C3] dark:text-indigo-400 flex items-center justify-center mb-3 shrink-0">
              <Bell className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[14px] font-[800] text-[#1B1F3B] dark:text-white leading-tight block">
                Notifications
              </span>
              <span className="text-[11px] font-[500] text-[#4A5270] dark:text-slate-400 mt-1 leading-snug block">
                Mill shifts &amp; stock alerts
              </span>
            </div>
          </button>

          {/* Privacy & Security */}
          <button
            type="button"
            onClick={() => setActiveModal('privacy')}
            className="w-full bg-white dark:bg-slate-800 rounded-[20px] p-4 border border-[#E8EBF5] dark:border-slate-700 shadow-[0_2px_8px_rgba(27,31,59,0.04)] flex flex-col justify-between text-left min-h-[116px] hover:border-[#4B32C3]/30 active:scale-[0.98] transition cursor-pointer"
          >
            <div className="w-11 h-11 rounded-[14px] bg-[#EDE9FD] dark:bg-indigo-950/60 text-[#4B32C3] dark:text-indigo-400 flex items-center justify-center mb-3 shrink-0">
              <Lock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[14px] font-[800] text-[#1B1F3B] dark:text-white leading-tight block">
                Privacy &amp; Security
              </span>
              <span className="text-[11px] font-[500] text-[#4A5270] dark:text-slate-400 mt-1 leading-snug block">
                Session, role access &amp; audit
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. SECTION: ADMIN TOOLS (Only if admin) */}
      {isAdmin && (
        <div className="mb-5">
          <h2 className="text-[15px] font-[800] text-[#1B1F3B] dark:text-white mb-3">
            Admin tools
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Role Permission Matrix */}
            <button
              type="button"
              onClick={() => navigate('/role-management')}
              className="w-full bg-white dark:bg-slate-800 rounded-[20px] p-4 border border-[#E8EBF5] dark:border-slate-700 shadow-[0_2px_8px_rgba(27,31,59,0.04)] flex flex-col justify-between text-left min-h-[116px] hover:border-[#8A4B00]/30 active:scale-[0.98] transition cursor-pointer"
            >
              <div className="w-11 h-11 rounded-[14px] bg-[#FFF1D6] dark:bg-amber-950/50 text-[#8A4B00] dark:text-amber-400 flex items-center justify-center mb-3 shrink-0">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[14px] font-[800] text-[#1B1F3B] dark:text-white leading-tight block">
                  Role Permission Matrix
                </span>
                <span className="text-[11px] font-[500] text-[#4A5270] dark:text-slate-400 mt-1 leading-snug block">
                  Configure 13 worker modules
                </span>
              </div>
            </button>

            {/* User Accounts */}
            <button
              type="button"
              onClick={() => navigate('/user-management')}
              className="w-full bg-white dark:bg-slate-800 rounded-[20px] p-4 border border-[#E8EBF5] dark:border-slate-700 shadow-[0_2px_8px_rgba(27,31,59,0.04)] flex flex-col justify-between text-left min-h-[116px] hover:border-[#8A4B00]/30 active:scale-[0.98] transition cursor-pointer"
            >
              <div className="w-11 h-11 rounded-[14px] bg-[#FFF1D6] dark:bg-amber-950/50 text-[#8A4B00] dark:text-amber-400 flex items-center justify-center mb-3 shrink-0">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[14px] font-[800] text-[#1B1F3B] dark:text-white leading-tight block">
                  User Accounts
                </span>
                <span className="text-[11px] font-[500] text-[#4A5270] dark:text-slate-400 mt-1 leading-snug block">
                  Create &amp; manage workers
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 5. SECTION: APP */}
      <div className="mb-5">
        <h2 className="text-[15px] font-[800] text-[#1B1F3B] dark:text-white mb-3">
          App
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-[20px] border border-[#E8EBF5] dark:border-slate-700 shadow-[0_2px_8px_rgba(27,31,59,0.04)] divide-y divide-[#E8EBF5] dark:divide-slate-700/80 overflow-hidden">
          {/* Row 1: Dark Mode */}
          <div className="min-h-[64px] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[12px] bg-[#E8EBF5] dark:bg-slate-700/60 text-[#3A4160] dark:text-slate-300 flex items-center justify-center shrink-0">
                <Palette className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[14px] font-[800] text-[#1B1F3B] dark:text-white leading-tight block">
                  Dark mode
                </span>
                <span className="text-[11px] font-[500] text-[#4A5270] dark:text-slate-400 mt-0.5 leading-snug block">
                  {darkMode ? 'Dark mode active' : 'Light mode active'}
                </span>
              </div>
            </div>

            {/* Animated Uiverse.io Sun/Moon Theme Toggle */}
            <div className="min-h-[44px] flex items-center">
              <label className="theme min-h-[44px] flex items-center cursor-pointer m-0" htmlFor="theme">
                <span className="theme__toggle-wrap">
                  <input
                    id="theme"
                    className="theme__toggle"
                    type="checkbox"
                    role="switch"
                    name="theme"
                    checked={darkMode}
                    onChange={toggleDarkMode}
                  />
                  <span className="theme__fill"></span>
                  <span className="theme__icon">
                    <span className="theme__icon-part"></span>
                    <span className="theme__icon-part"></span>
                    <span className="theme__icon-part"></span>
                    <span className="theme__icon-part"></span>
                    <span className="theme__icon-part"></span>
                    <span className="theme__icon-part"></span>
                    <span className="theme__icon-part"></span>
                    <span className="theme__icon-part"></span>
                    <span className="theme__icon-part"></span>
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Row 2: Help & Support */}
          <button
            type="button"
            onClick={() => setActiveModal('help')}
            className="w-full min-h-[64px] p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 active:scale-[0.99] transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[12px] bg-[#E8EBF5] dark:bg-slate-700/60 text-[#3A4160] dark:text-slate-300 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[14px] font-[800] text-[#1B1F3B] dark:text-white leading-tight block">
                  Help &amp; Support
                </span>
                <span className="text-[11px] font-[500] text-[#4A5270] dark:text-slate-400 mt-0.5 leading-snug block">
                  SOP guides &amp; mill helpline
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#4A5270] dark:text-slate-400 shrink-0 stroke-[2.2]" />
          </button>

          {/* Row 3: System Updates */}
          <button
            type="button"
            onClick={() => setIsUpdateModalOpen(true)}
            className="w-full min-h-[64px] p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 active:scale-[0.99] transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[12px] bg-[#E8EBF5] dark:bg-slate-700/60 text-[#3A4160] dark:text-slate-300 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[14px] font-[800] text-[#1B1F3B] dark:text-white leading-tight block">
                  System Updates
                </span>
                <span className="text-[11px] font-[500] text-[#4A5270] dark:text-slate-400 mt-0.5 leading-snug block">
                  Version history &amp; changelogs
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#4A5270] dark:text-slate-400 shrink-0 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 6. LOGOUT BUTTON */}
      <div className="mt-6 mb-4">
        <button
          type="button"
          onClick={() => setLogoutConfirmOpen(true)}
          className="w-full min-h-[52px] rounded-[16px] bg-[#FDECEA] dark:bg-red-950/40 text-[#B3261E] dark:text-red-400 font-[800] text-[15px] flex items-center justify-center gap-2 hover:bg-[#FCD8D4] dark:hover:bg-red-900/50 active:scale-[0.98] transition cursor-pointer border border-[#F9C3BE]/60 dark:border-red-900/60 shadow-xs"
        >
          <LogOut className="w-5 h-5 stroke-[2.2]" />
          <span>Logout</span>
        </button>
      </div>

      {/* 7. FOOTER */}
      <div
        onClick={() => setIsUpdateModalOpen(true)}
        className="text-center text-[11px] text-[#4A5270] dark:text-slate-400 font-sans pb-8 pt-2 space-y-1 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
      >
        <div className="font-[700] tracking-wider uppercase">SAHEB PAPER PVT. LTD. ERP</div>
        <div className="font-[500]">vBeta 1.10.34 (Mobile)</div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: EDIT PROFILE */}
      {/* ======================================================== */}
      {activeModal === 'edit' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onTouchMove={e => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col overflow-hidden text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between border-b p-5 sm:p-6 pb-3 sm:pb-4 dark:border-slate-700 bg-white dark:bg-surface-dark shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Edit Personal Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              data-modal-scroll="true"
              className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain"
            >
              <form id="mobile-edit-profile-form" onSubmit={handleSaveProfile} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </form>
            </div>

            {/* Fixed Footer Actions */}
            <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer active:scale-98 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="mobile-edit-profile-form"
                className="flex-1 py-3 bg-primary text-white font-black rounded-xl text-xs shadow-md cursor-pointer active:scale-98 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ACCOUNT SECURITY SETTINGS */}
      {/* ======================================================== */}
      {activeModal === 'security' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onTouchMove={e => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col overflow-hidden text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between border-b p-5 sm:p-6 pb-3 sm:pb-4 dark:border-slate-700 bg-white dark:bg-surface-dark shrink-0">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Security PIN &amp; Credentials
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              data-modal-scroll="true"
              className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain"
            >
              <form id="mobile-security-form" onSubmit={handleSaveSecurity} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    4-Digit Quick PIN <span className="text-[9px] text-slate-400 font-normal lowercase">(leave blank to keep current)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={4}
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="•••• (Unchanged)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-black font-mono tracking-widest dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Used for fast mobile station unlock.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Security Question
                  </label>
                  <select
                    value={securityQuestion}
                    onChange={e => setSecurityQuestion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold dark:text-white"
                  >
                    <option value="What is your favorite color?">What is your favorite color?</option>
                    <option value="What is your birth city?">What is your birth city?</option>
                    <option value="What is your first pet's name?">What is your first pet's name?</option>
                    <option value="What was your first vehicle number?">What was your first vehicle number?</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Security Answer
                  </label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={e => setSecurityAnswer(e.target.value)}
                    placeholder="Your answer..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </form>
            </div>

            {/* Fixed Footer Actions */}
            <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer active:scale-98 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="mobile-security-form"
                className="flex-1 py-3 bg-primary text-white font-black rounded-xl text-xs shadow-md cursor-pointer active:scale-98 transition"
              >
                Update PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: NOTIFICATIONS PREFERENCES */}
      {/* ======================================================== */}
      {activeModal === 'notifications' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onTouchMove={e => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col overflow-hidden text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between border-b p-5 sm:p-6 pb-3 sm:pb-4 dark:border-slate-700 bg-white dark:bg-surface-dark shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Notification Preferences
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              data-modal-scroll="true"
              className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3 overscroll-contain"
            >
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">Machine Production Alerts</div>
                  <div className="text-[10px] text-slate-400">Jumbo roll completion and speed alerts</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifProd}
                  onChange={e => setNotifProd(e.target.checked)}
                  className="h-4 w-4 accent-primary rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">QC Lab Grade Warnings</div>
                  <div className="text-[10px] text-slate-400">Low brightness or Grade B reel warnings</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifQc}
                  onChange={e => setNotifQc(e.target.checked)}
                  className="h-4 w-4 accent-primary rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">Dispatch &amp; Stock Gatepass</div>
                  <div className="text-[10px] text-slate-400">Vehicle loading and invoice generation</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifDispatch}
                  onChange={e => setNotifDispatch(e.target.checked)}
                  className="h-4 w-4 accent-primary rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Fixed Footer Action */}
            <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark shrink-0">
              <button
                type="button"
                onClick={() => {
                  showToast('Notification preferences saved!');
                  setActiveModal(null);
                }}
                className="w-full py-3 bg-primary text-white font-black rounded-xl text-xs shadow-md cursor-pointer active:scale-98 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: THEME & APPEARANCE */}
      {/* ======================================================== */}
      {activeModal === 'theme' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onTouchMove={e => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col overflow-hidden text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between border-b p-5 sm:p-6 pb-3 sm:pb-4 dark:border-slate-700 bg-white dark:bg-surface-dark shrink-0">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Theme &amp; Appearance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              data-modal-scroll="true"
              className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain"
            >
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => {
                    if (darkMode) toggleDarkMode();
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition ${
                    !darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sun className="h-6 w-6 text-amber-500" />
                  <span className="text-xs font-black">Light Mode</span>
                </div>

                <div
                  onClick={() => {
                    if (!darkMode) toggleDarkMode();
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition ${
                    darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Moon className="h-6 w-6 text-blue-400" />
                  <span className="text-xs font-black">Dark Mode</span>
                </div>
              </div>
            </div>

            {/* Fixed Footer Action */}
            <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-3 bg-primary text-white font-black rounded-xl text-xs shadow-md cursor-pointer active:scale-98 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: PRIVACY POLICY & DPDP ACT COMPLIANCE */}
      {/* ======================================================== */}
      <PrivacyPolicyModal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
      />

      {/* ======================================================== */}
      {/* MODAL 6: HELP & SUPPORT */}
      {/* ======================================================== */}
      {activeModal === 'help' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onTouchMove={e => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col overflow-hidden text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between border-b p-5 sm:p-6 pb-3 sm:pb-4 dark:border-slate-700 bg-white dark:bg-surface-dark shrink-0">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Mill ERP Support
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              data-modal-scroll="true"
              className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3.5 overscroll-contain"
            >
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-purple-50/60 dark:from-slate-900/90 dark:via-slate-900/50 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs font-heading">
                    {companyConfig.name}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Official Helpdesk
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  For shift discrepancies, stock audit approvals, or ERP technical assistance, contact the plant administration:
                </p>

                <div className="space-y-2 pt-1">
                  {/* Direct Phone Dial */}
                  <a
                    href={`tel:${companyConfig.phone.replace(/\s+/g, '')}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold hover:text-primary transition shadow-2xs group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-primary dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">Plant Helpline</span>
                      <span className="font-mono text-xs font-black">{companyConfig.phone}</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary dark:text-blue-400">Call Now →</span>
                  </a>

                  {/* Direct Email Support */}
                  <a
                    href={`mailto:${companyConfig.email}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold hover:text-primary transition shadow-2xs group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">Email Support</span>
                      <span className="font-mono text-xs font-black truncate block">{companyConfig.email}</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary dark:text-blue-400">Send Mail →</span>
                  </a>

                  {/* Official Website */}
                  {companyConfig.website && (
                    <a
                      href={companyConfig.websiteUrl || `https://${companyConfig.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold hover:text-primary transition shadow-2xs group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">Official Website</span>
                        <span className="font-mono text-xs font-black truncate block">{companyConfig.website}</span>
                      </div>
                      <span className="text-[10px] font-bold text-primary dark:text-blue-400">Open ↗</span>
                    </a>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span><strong>Plant:</strong> {companyConfig.address}</span>
                </div>
              </div>
            </div>

            {/* Fixed Footer Action */}
            <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-3 bg-primary text-white font-black rounded-xl text-xs shadow-md cursor-pointer active:scale-98 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: LOGOUT CONFIRMATION */}
      {/* ======================================================== */}
      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in overscroll-contain"
          onTouchMove={e => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setLogoutConfirmOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-center max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] overflow-y-auto overscroll-contain"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <LogOut className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Sign Out of Mill ERP?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You will need your PIN or credentials to log back into this station.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow-md cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Update Modal */}
      <AppUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />

    </div>
  );
};

export default MobileProfileView;
