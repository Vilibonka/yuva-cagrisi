"use client";
import React, { useState } from 'react';
import api from '@/api';
import { AlertTriangle, X } from 'lucide-react';

export default function ReportModal({ postId, isOpen, onClose }) {
  const [reason, setReason] = useState('SPAM');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('IDLE'); // IDLE, LOADING, SUCCESS, ERROR
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('LOADING');
    try {
      await api.post(`/reports/${postId}`, { reason, description });
      setStatus('SUCCESS');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Şikayet gönderilemedi.');
      setStatus('ERROR');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5"/> İlanı Şikayet Et
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        </div>

        {status === 'SUCCESS' ? (
          <div className="p-8 text-center text-green-600 font-bold">
            Şikayetiniz başarıyla alındı. Hassasiyetiniz için teşekkür ederiz.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {status === 'ERROR' && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{errorMsg}</div>
            )}
            <div>
              <label className="block text-sm font-semibold mb-1">Şikayet Nedeni</label>
              <select value={reason} onChange={e=>setReason(e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500">
                <option value="SPAM">Spam / Sahte İlan</option>
                <option value="INAPPROPRIATE">Uygunsuz İçerik</option>
                <option value="SCAM">Dolandırıcılık Şüphesi</option>
                <option value="OTHER">Diğer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Açıklama (İsteğe Bağlı)</label>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} rows="3" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500" placeholder="Lütfen detay verin..."></textarea>
            </div>
            <div className="pt-2">
              <button disabled={status === 'LOADING'} type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition disabled:bg-red-400">
                {status === 'LOADING' ? 'Gönderiliyor...' : 'Şikayeti Gönder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
