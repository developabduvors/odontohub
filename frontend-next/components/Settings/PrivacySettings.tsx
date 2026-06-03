'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Lock, Phone } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { changePassword, getBackupPhone, updateBackupPhone } from '@/api/auth';
import { paths } from '@/lib/paths';
import { clearUser } from '@/store/slices/userSlice';
import { getToken } from '@/utils/auth';

type FlashMessage = { type: 'success' | 'error'; text: string } | null;

const normalizePhone = (value: string) => value.replace(/[^\d+]/g, '').trim();

const getErrorMessage = (error: unknown, fallback: string) => {
    if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: unknown }).response === 'object' &&
        (error as { response?: unknown }).response !== null
    ) {
        const response = (error as { response?: { data?: { detail?: string } } }).response;
        if (response?.data?.detail) {
            return response.data.detail;
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
};

export const PrivacySettings: React.FC = () => {
    const t = useTranslations();
    const dispatch = useDispatch();
    const router = useRouter();

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<FlashMessage>(null);

    const [primaryPhone, setPrimaryPhone] = useState('');
    const [backupPhone, setBackupPhone] = useState('');
    const [initialBackupPhone, setInitialBackupPhone] = useState('');
    const [backupLoading, setBackupLoading] = useState(true);
    const [backupSaving, setBackupSaving] = useState(false);
    const [backupMessage, setBackupMessage] = useState<FlashMessage>(null);

    useEffect(() => {
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
            try {
                const parsed = JSON.parse(storedUserData) as { phone?: string; backup_phone?: string | null };
                setPrimaryPhone(parsed.phone || '');
                setBackupPhone(parsed.backup_phone || '');
                setInitialBackupPhone(parsed.backup_phone || '');
            } catch {
                setPrimaryPhone('');
            }
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadBackupPhone = async () => {
            try {
                const response = await getBackupPhone();
                if (!isMounted) return;

                const currentBackupPhone = response.backup_phone || '';
                setBackupPhone(currentBackupPhone);
                setInitialBackupPhone(currentBackupPhone);

                const storedUserData = localStorage.getItem('user_data');
                if (storedUserData) {
                    try {
                        const parsed = JSON.parse(storedUserData) as Record<string, unknown>;
                        localStorage.setItem(
                            'user_data',
                            JSON.stringify({ ...parsed, backup_phone: response.backup_phone })
                        );
                    } catch {}
                }
            } catch (error) {
                if (isMounted) {
                    setBackupMessage({
                        type: 'error',
                        text: getErrorMessage(error, t('settings.privacy.load_backup_failed')),
                    });
                }
            } finally {
                if (isMounted) setBackupLoading(false);
            }
        };

        loadBackupPhone();

        return () => { isMounted = false; };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user_data');
        dispatch(clearUser());
        router.replace(paths.login);
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            const token = getToken();
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            if (token && process.env.NEXT_PUBLIC_USE_API === 'true') {
                await fetch(`${apiUrl}/auth/delete-account`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
        } catch {
            // ignore
        } finally {
            localStorage.clear();
            dispatch(clearUser());
            router.replace(paths.login);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: t('settings.privacy.passwords_mismatch') });
            return;
        }

        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: t('settings.privacy.password_min6') });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            await changePassword({
                current_password: formData.currentPassword,
                new_password: formData.newPassword,
            });

            setMessage({ type: 'success', text: t('settings.privacy.password_changed') });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage({
                type: 'error',
                text: getErrorMessage(error, t('settings.privacy.password_change_error')),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBackupPhoneSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const normalizedBackupPhone = normalizePhone(backupPhone);
        const normalizedPrimaryPhone = normalizePhone(primaryPhone);

        if (!normalizedBackupPhone) {
            setBackupMessage({ type: 'error', text: t('settings.privacy.enter_or_clear_backup') });
            return;
        }

        if (normalizedBackupPhone.length < 7) {
            setBackupMessage({ type: 'error', text: t('settings.privacy.backup_too_short') });
            return;
        }

        if (normalizedPrimaryPhone && normalizedBackupPhone === normalizedPrimaryPhone) {
            setBackupMessage({ type: 'error', text: t('settings.privacy.backup_must_differ') });
            return;
        }

        setBackupSaving(true);
        setBackupMessage(null);

        try {
            const response = await updateBackupPhone({ backup_phone: normalizedBackupPhone });
            const savedPhone = response.backup_phone || '';
            setBackupPhone(savedPhone);
            setInitialBackupPhone(savedPhone);
            setBackupMessage({ type: 'success', text: t('settings.privacy.backup_saved') });

            const storedUserData = localStorage.getItem('user_data');
            if (storedUserData) {
                try {
                    const parsed = JSON.parse(storedUserData) as Record<string, unknown>;
                    localStorage.setItem('user_data', JSON.stringify({ ...parsed, backup_phone: response.backup_phone }));
                } catch {}
            }
        } catch (error) {
            setBackupMessage({
                type: 'error',
                text: getErrorMessage(error, t('settings.privacy.backup_save_failed')),
            });
        } finally {
            setBackupSaving(false);
        }
    };

    const handleBackupPhoneClear = async () => {
        setBackupSaving(true);
        setBackupMessage(null);

        try {
            await updateBackupPhone({ backup_phone: null });
            setBackupPhone('');
            setInitialBackupPhone('');
            setBackupMessage({ type: 'success', text: t('settings.privacy.backup_deleted') });

            const storedUserData = localStorage.getItem('user_data');
            if (storedUserData) {
                try {
                    const parsed = JSON.parse(storedUserData) as Record<string, unknown>;
                    localStorage.setItem('user_data', JSON.stringify({ ...parsed, backup_phone: null }));
                } catch {}
            }
        } catch (error) {
            setBackupMessage({
                type: 'error',
                text: getErrorMessage(error, t('settings.privacy.backup_delete_failed')),
            });
        } finally {
            setBackupSaving(false);
        }
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Lock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#1E2532]">{t('settings.privacy.change_password_title')}</h2>
                        <p className="text-sm text-gray-500">{t('settings.privacy.change_password_desc')}</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.privacy.current_password')}</label>
                        <div className="relative">
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={formData.currentPassword}
                                onChange={(e) => setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                                placeholder={t('settings.privacy.current_password_ph')}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('current')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.privacy.new_password')}</label>
                        <div className="relative">
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                value={formData.newPassword}
                                onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                                placeholder={t('settings.privacy.new_password_ph')}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('new')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{t('auth.login.password_min')}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.privacy.confirm_new_password')}</label>
                        <div className="relative">
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                                placeholder={t('settings.privacy.confirm_new_password_ph')}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('confirm')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div
                            className={`p-3 rounded-lg text-sm ${
                                message.type === 'success'
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-red-100 text-red-700 border border-red-200'
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? t('common.saving') : t('settings.privacy.change_password_btn')}
                    </button>
                </form>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-[#1E2532] mb-3">{t('settings.privacy.security_tips_title')}</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li>• {t('settings.privacy.tip1')}</li>
                    <li>• {t('settings.privacy.tip2')}</li>
                    <li>• {t('settings.privacy.tip3')}</li>
                    <li>• {t('settings.privacy.tip4')}</li>
                </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#1E2532]">{t('settings.privacy.backup_number_title')}</h3>
                        <p className="text-sm text-gray-500">{t('settings.privacy.backup_number_desc')}</p>
                    </div>
                </div>

                <form onSubmit={handleBackupPhoneSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.privacy.primary_number')}</label>
                        <input
                            type="text"
                            value={primaryPhone}
                            readOnly
                            className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-gray-500"
                            placeholder={t('common.not_specified')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.privacy.backup_number_label')}</label>
                        <input
                            type="tel"
                            value={backupPhone}
                            onChange={(e) => setBackupPhone(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="+998901234567"
                            disabled={backupLoading || backupSaving}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {t('settings.privacy.backup_number_hint')}
                        </p>
                    </div>

                    {backupMessage && (
                        <div
                            className={`p-3 rounded-lg text-sm ${
                                backupMessage.type === 'success'
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-red-100 text-red-700 border border-red-200'
                            }`}
                        >
                            {backupMessage.text}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            type="submit"
                            disabled={backupLoading || backupSaving || backupPhone === initialBackupPhone}
                            className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {backupLoading ? t('common.loading') : backupSaving ? t('common.saving') : t('settings.privacy.save_backup_btn')}
                        </button>
                        <button
                            type="button"
                            onClick={handleBackupPhoneClear}
                            disabled={backupLoading || backupSaving || !initialBackupPhone}
                            className="sm:w-auto w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {t('settings.privacy.clear')}
                        </button>
                    </div>
                </form>
            </div>

            <div
                onClick={() => setShowDeleteModal(true)}
                className="bg-white p-5 rounded-2xl cursor-pointer hover:shadow-md transition-shadow"
            >
                <h3 className="text-lg font-bold text-red-500 underline mb-1">{t('settings.privacy.delete_account_title')}</h3>
                <p className="text-sm text-gray-400">{t('settings.privacy.delete_account_desc')}</p>
            </div>

            <div className="pt-20">
                <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-12 rounded-2xl text-sm transition-colors"
                >
                    {t('settings.privacy.logout')}
                </button>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                        <h2 className="text-xl font-bold text-[#1E2532] mb-2">{t('settings.privacy.delete_account_modal_title')}</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            {t('settings.privacy.delete_account_confirm')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting}
                                className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {deleting ? t('settings.privacy.deleting') : t('settings.privacy.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
