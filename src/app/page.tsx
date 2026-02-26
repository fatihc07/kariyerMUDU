'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import mammoth from 'mammoth';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  Settings, 
  LogOut, 
  Upload, 
  Plus, 
  Search, 
  FileEdit,
  FileDown,
  Printer,
  ChevronRight,
  ChevronLeft,
  UserCircle,
  Trash2,
  Activity,
  Calendar as CalendarIcon,
  Megaphone,
  BarChart3,
  Clock,
  Briefcase,
  Mail,
  User,
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, LineChart, Line, AreaChart, Area
} from 'recharts';

const UNIVERSITY_LOGO_URL = '/mudanya_logo.png';
const CHART_COLORS = ['#ff5e1a', '#00d2ff', '#4ade80', '#fbbf24', '#f87171', '#818cf8', '#a78bfa'];

export default function KariyerPortal() {
  const [activeView, setActiveView] = useState<'public' | 'login' | 'dashboard' | 'settings' | 'notes'>('public');
  const [adminTab, setAdminTab] = useState<'depts' | 'lecturers' | 'firms' | 'notes' | 'announcements'>('depts');
  
  // Data States
  const [departments, setDepartments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [firms, setFirms] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'lecturer' | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Auth & Settings States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Logo & Note Modal States
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [logoSuggestions, setLogoSuggestions] = useState<any[]>([]);
  const [searchingLogos, setSearchingLogos] = useState(false);

  // Form States (Generic)
  const [itemName, setItemName] = useState('');
  const [itemExtra, setItemExtra] = useState(''); // Logo URL or Full Name
  const [selectedId, setSelectedId] = useState(''); // Dept ID or Lecturer ID
  
  // New States (Features 1-8)
  const [activities, setActivities] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [sector, setSector] = useState('');
  const [pocName, setPocName] = useState('');
  const [pocEmail, setPocEmail] = useState('');
  const [pocTitle, setPocTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'main' | 'analytics' | 'activity' | 'calendar'>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [publicSearchQuery, setPublicSearchQuery] = useState('');
  const [selectedPublicDept, setSelectedPublicDept] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [userTitle, setUserTitle] = useState('Bölüm Hocası');
  const [userTitle2, setUserTitle2] = useState('');
  const [firmSearch, setFirmSearch] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkUser();
    fetchPublicData();
  }, []);

  useEffect(() => {
    setItemName('');
    setItemExtra('');
    setEmail('');
    setPassword('');
    setAuthError('');
    setSuccessMsg('');
  }, [activeView, adminTab, activeTab]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, departments(name)')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setRole(profile.role);
        setUserProfile(profile);
        setActiveView('dashboard');
        fetchDashboardData(profile);
      }
    }
  };

  const fetchPublicData = async () => {
    const { data: depts } = await supabase.from('departments').select('*');
    const { data: allFirms } = await supabase.from('firms').select('*, departments(name)');
    const { data: profs } = await supabase.from('profiles').select('*, departments(name)').eq('role', 'lecturer');
    
    if (depts) setDepartments(depts);
    if (allFirms) setFirms(allFirms);
    if (profs) setProfiles(profs);
  };

  const fetchDashboardData = async (profile: any) => {
    setLoading(true);
    const { data: depts } = await supabase.from('departments').select('*');
    if (depts) setDepartments(depts);

    if (profile.role === 'admin') {
      const { data: profs } = await supabase.from('profiles').select('*, departments(name)');
      if (profs) setProfiles(profs);
      const { data: allFirms } = await supabase.from('firms').select('*, departments(name)');
      if (allFirms) setFirms(allFirms);
      const { data: allNotes } = await supabase.from('meeting_notes').select('*, departments(name)').order('created_at', { ascending: false });
      if (allNotes) setNotes(allNotes);
    } else {
      const { data: deptFirms } = await supabase.from('firms').select('*, departments(name)').eq('department_id', profile.department_id);
      if (deptFirms) setFirms(deptFirms);
      const { data: deptNotes } = await supabase.from('meeting_notes').select('*, departments(name)').eq('department_id', profile.department_id).order('created_at', { ascending: false });
      if (deptNotes) setNotes(deptNotes);
      
      // Calculate next meeting number (Logic removed to prevent pre-populating unrelated text fields)

      const { data: acts } = await supabase.from('activity_log').select('*, departments(name)').eq('department_id', profile.department_id).order('created_at', { ascending: false }).limit(20);
      if (acts) setActivities(acts);
    }

    const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (ann) setAnnouncements(ann);

    if (profile.role === 'admin') {
      const { data: allActs } = await supabase.from('activity_log').select('*, departments(name)').order('created_at', { ascending: false }).limit(50);
      if (allActs) setActivities(allActs);
    }

    setLoading(false);
  };

  const logActivity = async (action: string, desc: string) => {
    if (!user) return;
    await supabase.from('activity_log').insert([{
      user_id: user.id,
      action_type: action,
      description: desc,
      department_id: userProfile?.department_id
    }]);
  };

  const handleWordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.split('.').pop()?.toLowerCase() !== 'docx') {
      alert('Lütfen sadece .docx formatında bir dosya yükleyin.');
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const result = await mammoth.convertToHtml({ arrayBuffer });
          const text = result.value
            .replace(/<p>/g, '\n')
            .replace(/<\/p>/g, '\n')
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<[^>]*>/g, '')
            .trim();
          setItemExtra(text);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
          console.error('Extraction error:', err);
          alert('Metin çıkarılırken bir hata oluştu.');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Word parsing error:', err);
      alert('Dosya okunurken bir hata oluştu.');
      setLoading(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'link', 'image'
  ];

  const stripHtml = (html: string) => {
    if (typeof window === 'undefined') return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    
    let loginEmail = email;
    if (!email.includes('@')) {
      loginEmail = `${email.toLowerCase().trim()}@kariyer.mudu`;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    if (error) setAuthError('Hatalı giriş: ' + error.message);
    else checkUser();
    setLoading(false);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Şifreler eşleşmiyor!');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert('Hata: ' + error.message);
    else {
      setSuccessMsg('Şifre başarıyla güncellendi!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setLoading(false);
  };

  const resetPassword = async (targetEmail?: string) => {
    const emailToUse = targetEmail || email;
    if (!emailToUse) {
      alert('Lütfen e-posta adresinizi girin.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
      redirectTo: window.location.origin,
    });
    if (error) alert('Hata: ' + error.message);
    else alert('Şifre sıfırlama bağlantısı e-posta adresine gönderildi.');
  };

  // Create Actions
  const createDept = async () => {
    if (!itemName) return;
    await supabase.from('departments').insert([{ name: itemName }]);
    setItemName('');
    fetchDashboardData(userProfile);
  };

  const updateDept = async (id: string) => {
    if (!editingName) return;
    await supabase.from('departments').update({ name: editingName }).eq('id', id);
    setEditingId(null);
    setEditingName('');
    fetchDashboardData(userProfile);
  };

  const deleteDept = async (id: string) => {
    if (!confirm('Bu bölümü silmek istediğinize emin misiniz? Bölüme bağlı firmalar ve hocalar etkilenebilir.')) return;
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) {
      alert('Bölüm silinemedi: ' + error.message + '\n\nNot: Bu bölüme bağlı hocalar veya firmalar varsa önce onları silmeniz veya başka bir bölüme taşımanız gerekebilir.');
    } else {
      fetchDashboardData(userProfile);
    }
  };

  const searchLogos = async () => {
    if (!itemName) return;
    setSearchingLogos(true);
    setShowLogoModal(true);
    try {
      const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${itemName}`);
      const data = await res.json();
      setLogoSuggestions(data);
    } catch (err) {
      console.error('Logo fetching error:', err);
    }
    setSearchingLogos(false);
  };

  const handleCustomLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/png') && !file.type.includes('image/jpeg')) {
      alert('Lütfen PNG veya JPG formatında bir dosya seçin.');
      return;
    }

    setSearchingLogos(true);
    const fileName = `${Date.now()}-${file.name}`;
    
    // Upload to Supabase Storage (Assumes 'firm-logos' bucket exists or we create it)
    const { data, error } = await supabase.storage
      .from('firm-logos')
      .upload(fileName, file);

    if (error) {
      // If bucket doesn't exist, we might get an error. 
      // Fallback: use FileReader to get base64 if storage is not ready, 
      // but ideally we notify the user or try to show why.
      alert('Logo yüklenemedi: ' + error.message + '\n\nİpucu: "firm-logos" storage bucket oluşturulmamış olabilir.');
      setSearchingLogos(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('firm-logos')
      .getPublicUrl(fileName);

    createFirm(publicUrl);
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.includes('image/png') && !file.type.includes('image/jpeg')) {
      alert('Lütfen PNG veya JPG formatında bir dosya seçin.');
      return;
    }

    setLoading(true);
    const fileName = `avatars/${user.id}-${Date.now()}`;
    
    const { data, error } = await supabase.storage
      .from('firm-logos') 
      .upload(fileName, file);

    if (error) {
      alert('Profil resmi yüklenemedi: ' + error.message);
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('firm-logos')
      .getPublicUrl(fileName);

    const { error: patchError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (patchError) {
      alert('Profil güncellenemedi: ' + patchError.message);
    } else {
      setSuccessMsg('Profil resmi başarıyla güncellendi!');
      const updatedProfile = { ...userProfile, avatar_url: publicUrl };
      setUserProfile(updatedProfile);
      setProfiles(prev => prev.map(p => p.id === user.id ? { ...p, avatar_url: publicUrl } : p));
      fetchDashboardData(updatedProfile);
    }
    setLoading(false);
  };

  const createFirm = async (selectedLogoUrl?: string) => {
    const deptId = role === 'admin' ? selectedId : userProfile.department_id;
    if (!itemName || !deptId) {
      alert('Lütfen firma adını ve bölümü seçin.');
      return;
    }
    
    let logo = selectedLogoUrl || itemExtra;
    if (!logo) {
      // Very robust fallback chain: Clearbit -> Google Favicon -> Text Avatar
      const domain = itemName.toLowerCase().replace(/\s+/g, '') + '.com';
      logo = `https://logo.clearbit.com/${domain}`;
    }

    const { error } = await supabase.from('firms').insert([{ 
      name: itemName, 
      logo_url: logo, 
      department_id: deptId,
      sector: sector,
      poc_name: pocName,
      poc_email: pocEmail,
      poc_title: pocTitle
    }]);

    if (error) {
      alert('Hata: ' + error.message);
    } else {
      await logActivity('create_firm', `${itemName} firması eklendi.`);
      resetFirmForm();
      setShowLogoModal(false);
      fetchDashboardData(userProfile);
    }
  };

  const resetFirmForm = () => {
    setItemName(''); 
    setItemExtra('');
    setSector('');
    setPocName('');
    setPocEmail('');
    setPocTitle('');
  };

  const deleteFirm = async (id: string) => {
    const firmName = firms.find(f => f.id === id)?.name;
    if (!confirm('Bu firmayı silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('firms').delete().eq('id', id);
    if (error) alert('Hata: ' + error.message);
    else {
      await logActivity('delete_firm', `${firmName} firması silindi.`);
      fetchDashboardData(userProfile);
    }
  };

  const createLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    setSuccessMsg('');

    // For a real production app, you'd use a Supabase Edge Function with Service Role 
    // to create users without logging out the current admin.
    // For this demo, we'll try the signUp method which might log out the admin 
    // depending on Supabase settings, so we'll warn or use a DB-only approach if Auth is too complex.
    // However, the USER asked for Admin to create them.
    
    const username = email.toLowerCase().trim();
    const virtualEmail = `${username}@kariyer.mudu`;
    
    const { data, error } = await supabase.auth.signUp({
      email: virtualEmail,
      password,
      options: {
        data: {
          role: 'lecturer',
          full_name: itemName,
          username: username
        }
      }
    });

    if (error) {
      setAuthError('Hoca oluşturulamadı: ' + error.message);
    } else {
      // If a department was selected, update the profile immediately
      if (data.user) {
        const deptToAssign = role === 'admin' ? selectedId : userProfile?.department_id;
        await supabase.from('profiles').update({ 
          department_id: deptToAssign || null,
          full_name: itemName,
          username: username,
          title: userTitle,
          title2: userTitle2 || null
        }).eq('id', data.user.id);
      }
      setSuccessMsg('Hoca başarıyla oluşturuldu!');
      setEmail('');
      setPassword('');
      setItemName('');
      setSelectedId('');
      fetchDashboardData(userProfile);
    }
    setLoading(false);
  };

  const getSectorData = () => {
    const counts: any = {};
    firms.forEach(f => {
      const s = f.sector || 'Genel Sektör';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] }));
  };

  const getCityData = () => {
    const counts: any = {};
    firms.forEach(f => {
      const c = f.city || 'Bursa';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] }));
  };

  const addNote = async (customDate?: string) => {
    if (!itemName || !itemExtra) {
      alert('Lütfen başlık ve içerik girin.');
      return;
    }
    const deptId = userProfile?.department_id;
    if (!deptId && role !== 'admin') {
      alert('Bölümünüz tanımlanmamış.');
      return;
    }
    
    let insertData: any = { 
      title: itemName, 
      content: itemExtra,
      department_id: deptId
    };

    if (customDate) {
      const parts = customDate.split('.');
      if (parts.length === 3) {
        insertData.created_at = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
      }
    }

    const { error } = await supabase.from('meeting_notes').insert([insertData]);

    if (error) {
      alert('Hata: ' + error.message);
    } else {
      await logActivity('add_note', `${itemName} toplantı notu eklendi.`);
      setItemName(''); 
      setItemExtra('');
      setShowQuickNoteModal(false);
      fetchDashboardData(userProfile);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Bu toplantı notunu silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('meeting_notes').delete().eq('id', id);
    if (error) alert('Silme hatası: ' + error.message);
    else fetchDashboardData(userProfile);
  };

  const exportPDF = (notesToExport: any[], titlePrefix: string) => {
    const doc = new jsPDF() as any;
    
    // Turkish character support (using a standard font that usually works or just stripping accents)
    // For production, you'd embed a custom font. For now, we'll use autoTable with standard settings.
    
    doc.setFontSize(18);
    doc.text(`${titlePrefix} Toplantı Notları Arşivi`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 28);

    const tableData = notesToExport.map(n => [
      n.title,
      stripHtml(n.content).substring(0, 100) + (stripHtml(n.content).length > 100 ? '...' : ''),
      new Date(n.created_at).toLocaleDateString('tr-TR'),
      n.departments?.name || 'Genel'
    ]);

    doc.autoTable({
      startY: 35,
      head: [['Başlık', 'Özet', 'Tarih', 'Bölüm']],
      body: tableData,
      styles: { fontSize: 9, font: 'helvetica' },
      headStyles: { fillColor: [255, 94, 26] }
    });

    doc.save(`${titlePrefix}_toplanti_notlari.pdf`);
  };

  const createAnnouncement = async () => {
    const expiry = targetDate ? new Date(Date.now() + parseInt(targetDate) * 24 * 60 * 60 * 1000).toISOString() : null;
    const { error } = await supabase.from('announcements').insert([{
      title: itemName,
      content: itemExtra,
      created_by: user?.id,
      target_user_id: selectedId || null,
      expires_at: expiry
    }]);
    if (error) alert('Hata: ' + error.message);
    else {
      await logActivity('announcement', `Yeni duyuru yayınlandı: ${itemName}`);
      setItemName('');
      setItemExtra('');
      setSelectedId('');
      setTargetDate('');
      fetchDashboardData(userProfile);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) alert('Hata: ' + error.message);
    else fetchDashboardData(userProfile);
  };

  const renderAnalytics = () => {
    const sectorData = departments.slice(0, 5).map(d => ({
      name: d.name.substring(0, 10),
      firms: firms.filter(f => f.department_id === d.id).length
    }));

    const noteData = [
      { name: 'Pzt', count: 4 }, { name: 'Sal', count: 7 }, { name: 'Çar', count: 5 }, { name: 'Per', count: 9 }, { name: 'Cum', count: 12 },
    ];

    return (
      <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Bölüm Bazlı İş Birliği</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <RechartsTooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }} />
                <Bar dataKey="firms" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Haftalık Toplantı Yoğunluğu</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={noteData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <RechartsTooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderActivity = () => (
    <div className="glass card animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto 2rem' }}>
      <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Clock size={20} color="var(--primary)" /> Son Aktivite Akışı
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {activities.map((act, i) => (
          <div key={act.id} style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
            {i !== activities.length - 1 && (
              <div style={{ position: 'absolute', left: '15px', top: '35px', bottom: '-20px', width: '2px', background: 'rgba(255,255,255,0.05)' }} />
            )}
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '10px', background: act.action_type?.includes('delete') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 94, 26, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
            }}>
              {act.action_type?.includes('firm') ? <Building2 size={14} color="var(--primary)" /> : <FileText size={14} color="var(--primary)" />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{act.description}</span>
                <span className="badge" style={{ fontSize: '0.6rem' }}>{act.departments?.name}</span>
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>{new Date(act.created_at).toLocaleString('tr-TR')}</div>
            </div>
          </div>
        ))}
        {activities.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>Henüz aktivite bulunmuyor.</p>}
      </div>
    </div>
  );

  const renderCalendar = () => {
    const monthNames = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    const notesByDate = notes.reduce((acc: any, n) => {
      const d = new Date(n.created_at);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
         const date = d.toLocaleDateString('tr-TR');
         if (!acc[date]) acc[date] = [];
         acc[date].push(n);
      }
      return acc;
    }, {});

    const prevMonth = () => {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(v => v - 1);
      } else {
        setCurrentMonth(v => v - 1);
      }
    };

    const nextMonth = () => {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(v => v + 1);
      } else {
        setCurrentMonth(v => v + 1);
      }
    };

    return (
      <div className="glass card animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '4px' }}>Toplantı Takvimi</h3>
            <span style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 400 }}>Güne tıklayarak toplantı ekleyebilirsiniz</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={prevMonth} className="nav-item" style={{ padding: '5px', background: 'transparent' }}><ChevronLeft size={20} /></button>
            <div style={{ fontWeight: 800, fontSize: '1rem', minWidth: '120px', textAlign: 'center' }}>
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button onClick={nextMonth} className="nav-item" style={{ padding: '5px', background: 'transparent' }}><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, padding: '10px', opacity: 0.4 }}>{d}</div>
          ))}
          
          {[...Array(offset)].map((_, i) => (
            <div key={`empty-${i}`} style={{ minHeight: '80px', opacity: 0.1 }} />
          ))}

          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const dateStr = `${day < 10 ? '0'+day : day}.${currentMonth + 1 < 10 ? '0'+(currentMonth+1) : currentMonth+1}.${currentYear}`;
            const dayNotes = notesByDate[dateStr] || [];
            const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

            return (
              <div 
                key={day} 
                className="glass" 
                onClick={() => {
                  setTargetDate(dateStr);
                  setItemName('');
                  setShowQuickNoteModal(true);
                }}
                style={{ 
                  minHeight: '80px', 
                  padding: '8px', 
                  borderRadius: '12px', 
                  background: isToday ? 'rgba(255, 94, 26, 0.08)' : (dayNotes.length > 0 ? 'rgba(255, 94, 26, 0.15)' : 'rgba(255,255,255,0.01)'),
                  cursor: 'pointer',
                  border: isToday ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = isToday ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '4px', opacity: isToday ? 1 : 0.3, color: isToday ? 'var(--primary)' : 'inherit' }}>{day}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {dayNotes.map((n: any) => (
                    <div key={n.id} style={{ fontSize: '0.55rem', padding: '3px 6px', background: 'var(--primary)', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {n.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <main className="container animate-fade-in">
      {/* Top Bar Header */}
      <header className="top-bar animate-fade-in" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '1rem' }} onClick={() => setActiveView('public')}>
            <div className="logo-box">
              <img src={UNIVERSITY_LOGO_URL} alt="Logo" />
            </div>
            <div className="logo-text">Kariyer MUDU</div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input 
              className="search-input" 
              placeholder="Portal genelinde ara..." 
              style={{ paddingLeft: '45px', border: 'none', width: '380px', height: '48px', background: 'rgba(255,255,255,0.03)' }} 
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {!user ? (
            <button className="btn-primary" onClick={() => setActiveView('login')}>
              <UserCircle size={18} /> Giriş Yap
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button 
                className="btn-primary" 
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                onClick={() => setActiveView('dashboard')}
              >
                <LayoutDashboard size={18} /> Paneli Aç
              </button>
              <button 
                className="btn-primary" 
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                onClick={() => {
                  supabase.auth.signOut();
                  setActiveView('public');
                  setUser(null);
                  setUserProfile(null);
                  setRole(null);
                }}
              >
                <LogOut size={18} /> Çıkış Yap
              </button>
            </div>
          )}
          
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginLeft: '1rem', paddingLeft: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 800 }}>{userProfile?.full_name || user.email.split('@')[0]}</div>
                <div style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {role === 'admin' ? 'Yönetici' : (
                    <>
                      {userProfile?.title || 'Koordinatör'}
                      {userProfile?.title2 && ` & ${userProfile.title2}`}
                    </>
                  )}
                </div>
              </div>
              <div className="glass" style={{ width: '45px', height: '45px', borderRadius: '15px', overflow: 'hidden', border: '2px solid var(--primary)' }}>
                <img src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Public View (Redesigned) */}
      {activeView === 'public' && (
        <section className="animate-fade-in" style={{ paddingBottom: '5rem' }}>
          {!selectedPublicDept ? (
            <>
              {/* Hero Section */}
              <div style={{ textAlign: 'center', margin: '4rem 0 6rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.1, zIndex: -1 }}></div>
                <h1 style={{ 
                  fontSize: '4.5rem', 
                  lineHeight: 1.1, 
                  marginBottom: '1.5rem',
                  background: 'linear-gradient(to bottom, #fff 40%, rgba(255,255,255,0.4))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Staj ve Sektör <br /> İş Birlikleri
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
                  Üniversitemiz bölümleri tarafından yürütülen güncel firma protokollerini ve staj imkanlarını tek panelden inceleyin.
                </p>

                {/* Public Search */}
                <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
                   <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                   <input 
                     className="search-input" 
                     placeholder="Bölüm veya firma ismi ara..." 
                     value={publicSearchQuery}
                     onChange={e => setPublicSearchQuery(e.target.value)}
                     style={{ 
                       width: '100%', 
                       height: '64px', 
                       paddingLeft: '60px', 
                       fontSize: '1.1rem', 
                       background: 'rgba(255,255,255,0.03)',
                       borderRadius: '20px',
                       border: '1px solid rgba(255,255,255,0.1)'
                     }} 
                   />
                </div>
              </div>

              {/* Department List - 2 Column Grid on Desktop */}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '3rem', alignItems: 'start' }}>
                {departments.filter(d => 
                  d.name.toLowerCase().includes(publicSearchQuery.toLowerCase()) || 
                  firms.some(f => f.department_id === d.id && f.name.toLowerCase().includes(publicSearchQuery.toLowerCase()))
                ).map(dept => {
                  const deptFirms = firms.filter(f => f.department_id === dept.id && f.name.toLowerCase().includes(publicSearchQuery.toLowerCase()));
                  if (deptFirms.length === 0 && publicSearchQuery) return null;
                  
                  return (
                    <div 
                      key={dept.id} 
                      className="glass animate-fade-in hover-scale" 
                      onClick={() => setSelectedPublicDept(dept)}
                      style={{ padding: '2.5rem', borderRadius: '32px', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <div style={{ 
                          width: '60px', 
                          height: '60px', 
                          borderRadius: '18px', 
                          background: 'rgba(255, 94, 26, 0.1)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          border: '1px solid rgba(255, 94, 26, 0.2)'
                        }}>
                           <Building2 size={24} color="var(--primary)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>{dept.name}</h2>
                          <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {deptFirms.length} Protokollü Firma
                          </div>
                        </div>
                        <ChevronRight size={24} opacity={0.3} />
                      </div>

                      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: 'auto', justifyContent: 'center' }}>
                        {deptFirms.slice(0, 4).map(firm => (
                          <div key={firm.id} style={{ textAlign: 'center', width: '80px' }}>
                            <div style={{ 
                              background: 'white', 
                              padding: '8px', 
                              borderRadius: '16px', 
                              width: '60px', 
                              height: '60px', 
                              margin: '0 auto 10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
                            }}>
                              <img 
                                src={firm.logo_url} 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const domain = firm.name.toLowerCase().replace(/\s+/g, '') + '.com';
                                  const googleLogo = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
                                  if (target.src !== googleLogo) {
                                    target.src = googleLogo;
                                  } else {
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(firm.name)}&background=ff5e1a&color=fff&bold=true`;
                                  }
                                }}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                alt={firm.name} 
                              />
                            </div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firm.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="animate-fade-in">
              {/* Department Detail View */}
              <button 
                onClick={() => setSelectedPublicDept(null)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '3rem' }}
              >
                <ArrowLeft size={18} /> Tüm Bölümlere Dön
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '3rem', alignItems: 'start' }}>
                <div>
                  <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>{selectedPublicDept.name}</h1>
                  <p style={{ fontSize: '1.2rem', opacity: 0.6, marginBottom: '3rem' }}>Bu bölüm bünyesinde yürütülen resmi protokoller ve akademik koordinatörlük detayları aşağıda yer almaktadır.</p>
                  
                  <div className="glass card" style={{ padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Briefcase size={22} color="var(--primary)" /> Protokollü Firmalar
                    </h3>
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                      {firms.filter(f => f.department_id === selectedPublicDept.id).map(firm => (
                        <div key={firm.id} className="glass card hover-scale" style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
                          <div style={{ background: 'white', padding: '10px', borderRadius: '18px', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                            <img 
                              src={firm.logo_url} 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const domain = firm.name.toLowerCase().replace(/\s+/g, '') + '.com';
                                const googleLogo = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
                                if (target.src !== googleLogo) {
                                  target.src = googleLogo;
                                } else {
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(firm.name)}&background=ff5e1a&color=fff&bold=true`;
                                }
                              }}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                              alt={firm.name} 
                            />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>{firm.name}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{firm.sector || 'Genel Sektör'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ position: 'sticky', top: '2rem' }}>
                  <div className="glass card" style={{ padding: '2rem', border: '1px solid var(--primary)' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Users size={20} color="var(--primary)" /> Bölüm Koordinatörü
                    </h3>
                    {profiles.filter(p => p.department_id === selectedPublicDept.id && p.role === 'lecturer' && p.email !== 'admin@kariyer.com').length > 0 ? (
                      profiles.filter(p => p.department_id === selectedPublicDept.id && p.role === 'lecturer' && p.email !== 'admin@kariyer.com').map(p => (
                        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                             <div className="glass" style={{ width: '80px', height: '80px', borderRadius: '24px', overflow: 'hidden', border: '2px solid var(--primary)' }}>
                               <img src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.email}`} alt="Lecturer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                             <div>
                               <div style={{ fontWeight: 800, fontSize: '1.4rem' }}>{p.full_name || 'Bölüm Koordinatörü'}</div>
                               <div className="badge" style={{ marginTop: '5px' }}>
                                 {p.title || 'Bölüm Koordinatörü'}
                                 {p.title2 && ` & ${p.title2}`}
                               </div>
                             </div>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                               <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255, 94, 26, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <Mail size={16} color="var(--primary)" />
                               </div>
                               <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{p.email}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '18px' }}>
                        Bu bölüme henüz bir koordinatör atanmamıştır.
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Login */}
      {activeView === 'login' && (
        <div style={{ 
          maxWidth: '450px', 
          margin: '6rem auto', 
          padding: '3rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }} className="glass card animate-fade-in">
          <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.15 }}></div>
          
          <div style={{ display: 'inline-flex', marginBottom: '1.5rem' }}>
             <div className="logo-box" style={{ padding: '8px', borderRadius: '20px', width: '100px', height: '100px' }}>
                <img src={UNIVERSITY_LOGO_URL} alt="Logo" />
             </div>
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Kariyer MUDU</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Yönetim ve Koordinatör Paneli</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.6, marginBottom: '8px', display: 'block' }}>KULLANICI ADI</label>
              <input type="text" placeholder="kullaniciadi" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.6, marginBottom: '8px', display: 'block' }}>ŞİFRE</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {authError && <p style={{ color: '#f87171', fontSize: '0.85rem', textAlign: 'center' }}>{authError}</p>}
            <button className="btn-primary" style={{ height: '56px', marginTop: '1rem' }}>Sisteme Giriş Yap</button>
          </form>
          
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <button onClick={() => setActiveView('public')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>← Geri Dön</button>
            <button onClick={() => resetPassword()} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', cursor: 'pointer' }}>Şifremi Unuttum?</button>
          </div>
          <p style={{ fontSize: '0.7rem', marginTop: '1.5rem', opacity: 0.3 }}>Kariyer Koordinatörlüğü Bilgi Sistemi v2.0</p>
        </div>
      )}

      {/* Settings (Profile & Password) */}
      {activeView === 'settings' && (
        <div style={{ maxWidth: '500px', margin: '5rem auto' }} className="glass card animate-fade-in">
          <h2 style={{ marginBottom: '2rem' }}>Hesap Ayarları</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
             <label className="avatar-upload">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Profile" />
                ) : (
                  <Upload size={24} opacity={0.4} />
                )}
                <input type="file" hidden accept="image/png,image/jpeg" onChange={handleAvatarUpload} />
             </label>
             <div>
               <h4 style={{ marginBottom: '4px' }}>Profil Resmi</h4>
               <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>PNG veya JPG, max 2MB. Kare fotoğraflar en iyi sonucu verir.</p>
             </div>
          </div>

          <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
               <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.6, marginBottom: '8px', display: 'block' }}>YENİ ŞİFRE</label>
               <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="••••••••" />
            </div>
             <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.6, marginBottom: '8px', display: 'block' }}>YENİ ŞİFREYİ ONAYLA</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" />
             </div>
             
             <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
               <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setActiveView('dashboard')}>Geri Dön</button>
               <button className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                 {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
               </button>
             </div>
            
            {successMsg && <p style={{ color: '#4ade80', fontSize: '0.9rem', textAlign: 'center' }}>{successMsg}</p>}
          </form>

          {role === 'lecturer' && (
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>Koordinatörlük Kısayolları</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button 
                  onClick={() => {
                    setActiveView('dashboard');
                    setAdminTab('lecturers');
                  }}
                  className="glass"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <Users size={20} color="var(--primary)" />
                  <span style={{ fontSize: '0.75rem' }}>Bölümdaş Ekle</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveView('dashboard');
                    setAdminTab('announcements');
                  }}
                  className="glass"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <Megaphone size={20} color="var(--accent)" />
                  <span style={{ fontSize: '0.75rem' }}>Duyuru Paylaş</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dashboard Structure */}
      {activeView === 'dashboard' && (
        <div className="dashboard-layout">
          {/* Mini Sidebar */}
          <aside className="sidebar">
            <div className="logo-box" style={{ marginBottom: '2rem', background: 'white', padding: '6px', borderRadius: '15px', width: '44px', height: '44px' }}>
              <img src={UNIVERSITY_LOGO_URL} alt="Logo" />
            </div>
            
            <div 
              className={`nav-item ${adminTab === 'depts' ? 'active' : ''}`}
              onClick={() => setAdminTab('depts')}
              title="Bölümler"
              style={{ width: '50px', padding: 0 }}
            >
              <LayoutDashboard size={22} />
            </div>

            <div 
              className={`nav-item ${adminTab === 'lecturers' ? 'active' : ''}`}
              onClick={() => setAdminTab('lecturers')}
              title="Koordinatörler"
              style={{ width: '50px', padding: 0 }}
            >
              <Users size={22} />
            </div>

            {role === 'admin' && (
              <div 
                className={`nav-item ${adminTab === 'firms' ? 'active' : ''}`}
                onClick={() => setAdminTab('firms')}
                title="Firma Havuzu"
                style={{ width: '50px', padding: 0 }}
              >
                <Search size={22} />
              </div>
            )}
            
            <div 
              className={`nav-item ${adminTab === 'announcements' ? 'active' : ''}`}
              onClick={() => setAdminTab('announcements')}
              title="Duyurular"
              style={{ width: '50px', padding: 0 }}
            >
              <Megaphone size={22} />
            </div>

            <div 
              className={`nav-item ${adminTab === 'notes' ? 'active' : ''}`}
              onClick={() => setAdminTab('notes')}
              title="Toplantı Notları"
              style={{ width: '50px', padding: 0 }}
            >
              <FileEdit size={22} />
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="nav-item" onClick={() => setActiveView('settings')} title="Ayarlar" style={{ width: '50px', padding: 0 }}>
                <Settings size={22} />
              </div>
              <div className="nav-item" style={{ color: '#ef4444', width: '50px', padding: 0 }} onClick={() => { supabase.auth.signOut(); setActiveView('public'); setUser(null); setUserProfile(null); setRole(null); setSelectedPublicDept(null); }} title="Çıkış">
                <LogOut size={22} />
              </div>
            </div>
          </aside>

          {/* Main Dashboard Area */}
          <div className="dashboard-content animate-fade-in">
            {/* Top Sub-Navigation for Dashboard */}
            <div className="tab-nav-container">
              {[
                { id: 'main', icon: LayoutDashboard, label: 'Genel' },
                { id: 'analytics', icon: BarChart3, label: 'Analiz' },
                { id: 'activity', icon: Clock, label: 'Akış' },
                { id: 'calendar', icon: CalendarIcon, label: 'Takvim' }
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`tab-nav-item ${activeTab === t.id ? 'active' : ''}`}
                >
                  <t.icon size={18} /> <span>{t.label}</span>
                </button>
              ))}
            </div>

            {announcements
              .filter(a => {
                const isExpired = a.expires_at && new Date(a.expires_at) < new Date();
                const isForMe = !a.target_user_id || a.target_user_id === user.id;
                return !isExpired && isForMe;
              })
              .slice(0, 1).map(a => (
              <div key={a.id} className="glass card animate-fade-in" style={{ background: 'rgba(255, 94, 26, 0.1)', border: '1px solid var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                <Megaphone size={20} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{a.title}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{a.content}</div>
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(a.created_at).toLocaleDateString()}</div>
              </div>
            ))}

            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'activity' && renderActivity()}
            {activeTab === 'calendar' && renderCalendar()}
            {activeTab === 'main' && (
              <>
                {(role === 'admin' || (role === 'lecturer' && (adminTab === 'lecturers' || adminTab === 'announcements'))) ? (
              /* ADMIN VIEWS */
              <>
                {adminTab === 'depts' && (
                  <div className="glass card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3>Bölüm Yönetimi</h3>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          value={itemName} 
                          onChange={e => setItemName(e.target.value)} 
                          placeholder="Yeni Bölüm Adı" 
                          style={{ maxWidth: '300px' }}
                        />
                        <button className="btn-primary" onClick={createDept}><Plus size={18} /> Ekle</button>
                      </div>
                    </div>
                    <div className="grid">
                      {departments.map(d => (
                        <div key={d.id} className="glass card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {editingId === d.id ? (
                            <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                              <input 
                                value={editingName} 
                                onChange={e => setEditingName(e.target.value)} 
                                style={{ flex: 1, height: '38px' }}
                                autoFocus
                              />
                              <button className="btn-primary" onClick={() => updateDept(d.id)} style={{ padding: '0 15px' }}>Kaydet</button>
                              <button className="btn-primary" onClick={() => setEditingId(null)} style={{ padding: '0 15px', background: 'rgba(255,255,255,0.05)' }}>İptal</button>
                            </div>
                          ) : (
                            <>
                              <span style={{ fontWeight: 600 }}>{d.name}</span>
                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <FileEdit 
                                  size={18} 
                                  style={{ cursor: 'pointer', opacity: 0.5 }} 
                                  onClick={() => {
                                    setEditingId(d.id);
                                    setEditingName(d.name);
                                  }} 
                                />
                                <Trash2 
                                  size={18} 
                                  style={{ cursor: 'pointer', color: '#f87171', opacity: 0.8 }} 
                                  onClick={() => deleteDept(d.id)} 
                                />
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === 'lecturers' && (
                  <div className="glass card">
                    <h3>Hoca Yetkilendirme</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                      <form onSubmit={createLecturer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4>Yeni Hoca Hesabı</h4>
                        <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Hoca Tam Adı" required />
                        <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="Kullanıcı Adı" required />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Geçici Şifre" required />
                        
                        {role === 'admin' ? (
                          <>
                            <label style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>Atanacak Bölüm:</label>
                            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} required>
                              <option value="">Bölüm Seçin...</option>
                              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                          </>
                        ) : (
                          <div style={{ padding: '0.8rem', background: 'rgba(255, 94, 26, 0.1)', borderRadius: '12px', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                            <strong>Bölüm:</strong> {userProfile?.departments?.name}
                          </div>
                        )}

                        <label style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>Ünvan:</label>
                        <select value={userTitle} onChange={e => setUserTitle(e.target.value)}>
                          <option value="Bölüm Koordinatörü">Bölüm Koordinatörü</option>
                          <option value="Koordinatör Yardımcısı">Koordinatör Yardımcısı</option>
                          <option value="Bölüm Hocası">Bölüm Hocası</option>
                          <option value="Fakülte Temsilcisi">Fakülte Temsilcisi</option>
                        </select>

                        <label style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>Ek Ünvan (Opsiyonel):</label>
                        <select value={userTitle2} onChange={e => setUserTitle2(e.target.value)}>
                          <option value="">Ek Ünvan Yok</option>
                          <option value="Bölüm Koordinatörü">Bölüm Koordinatörü</option>
                          <option value="Koordinatör Yardımcısı">Koordinatör Yardımcısı</option>
                          <option value="Bölüm Hocası">Bölüm Hocası</option>
                          <option value="Fakülte Temsilcisi">Fakülte Temsilcisi</option>
                        </select>

                        <button className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                          <Plus size={18} /> Hesabı Oluştur
                        </button>
                        {authError && <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{authError}</p>}
                        {successMsg && <p style={{ color: '#4ade80', fontSize: '0.8rem' }}>{successMsg}</p>}
                      </form>

                      <div>
                        <h4>Tanımlı Hocalar</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                          {profiles
                            .filter(p => p.role === 'lecturer')
                            .filter(p => role === 'admin' || p.department_id === userProfile?.department_id)
                            .map(p => (
                            <div key={p.id} className="glass" style={{ padding: '1rem', borderRadius: '16px', fontSize: '0.9rem' }}>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input 
                                  defaultValue={p.full_name} 
                                  onBlur={async (e) => {
                                    if (e.target.value === p.full_name) return;
                                    await supabase.from('profiles').update({ full_name: e.target.value }).eq('id', p.id);
                                    fetchDashboardData(userProfile);
                                  }}
                                  placeholder="Hoca Adı Giriniz..."
                                  style={{ background: 'rgba(255,255,255,0.03)', border: 'none', padding: '4px 8px', borderRadius: '8px', flex: 1, fontWeight: 'bold' }}
                                />
                              </div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '8px' }}>{p.email}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <Users size={14} color="var(--accent)" />
                                      {role === 'admin' ? (
                                        <select 
                                          value={p.department_id || ''} 
                                          onChange={async (e) => {
                                            await supabase.from('profiles').update({ department_id: e.target.value || null }).eq('id', p.id);
                                            fetchDashboardData(userProfile);
                                          }}
                                          style={{ padding: '4px 8px', fontSize: '0.8rem', flex: 1 }}
                                        >
                                          <option value="">Bölüm Atanmamış</option>
                                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                      ) : (
                                        <div style={{ flex: 1, fontSize: '0.8rem', opacity: 0.7 }}>{p.departments?.name}</div>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <UserCircle size={14} color="var(--primary)" />
                                        <select 
                                          value={p.title || 'Bölüm Hocası'} 
                                          onChange={async (e) => {
                                            await supabase.from('profiles').update({ title: e.target.value }).eq('id', p.id);
                                            fetchDashboardData(userProfile);
                                          }}
                                          style={{ padding: '4px 8px', fontSize: '0.8rem', flex: 1 }}
                                        >
                                          <option value="Bölüm Koordinatörü">Bölüm Koordinatörü</option>
                                          <option value="Koordinatör Yardımcısı">Koordinatör Yardımcısı</option>
                                          <option value="Bölüm Hocası">Bölüm Hocası</option>
                                          <option value="Fakülte Temsilcisi">Fakülte Temsilcisi</option>
                                        </select>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Plus size={14} color="var(--success)" />
                                        <select 
                                          value={p.title2 || ''} 
                                          onChange={async (e) => {
                                            await supabase.from('profiles').update({ title2: e.target.value || null }).eq('id', p.id);
                                            fetchDashboardData(userProfile);
                                          }}
                                          style={{ padding: '4px 8px', fontSize: '0.8rem', flex: 1 }}
                                        >
                                          <option value="">Ek Ünvan Yok</option>
                                          <option value="Bölüm Koordinatörü">Bölüm Koordinatörü</option>
                                          <option value="Koordinatör Yardımcısı">Koordinatör Yardımcısı</option>
                                          <option value="Bölüm Hocası">Bölüm Hocası</option>
                                          <option value="Fakülte Temsilcisi">Fakülte Temsilcisi</option>
                                        </select>
                                      </div>
                                      <div style={{ alignSelf: 'flex-end', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button 
                                          onClick={() => resetPassword(p.email)}
                                          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                          title="Şifre Sıfırlama Maili Gönder"
                                        >
                                          Şifreyi Sıfırla
                                        </button>
                                        <Trash2 
                                          size={16} 
                                          style={{ cursor: 'pointer', color: '#f87171', opacity: 0.8 }} 
                                          onClick={async () => {
                                            if (!confirm('Bu hocanın yetkisini iptal etmek istediğinize emin misiniz?')) return;
                                            await supabase.from('profiles').delete().eq('id', p.id);
                                            fetchDashboardData(userProfile);
                                          }} 
                                        />
                                      </div>
                                    </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'notes' && (
                  <div className="glass card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3>Koordinatörlük Raporları</h3>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <select 
                          style={{ padding: '0.6rem', borderRadius: '10px', minWidth: '220px' }}
                          onChange={(e) => {
                            const deptId = e.target.value;
                            const filtered = deptId === '' ? notes : notes.filter(n => n.department_id === deptId);
                            const name = deptId === '' ? 'Genel' : departments.find(d => d.id === deptId)?.name;
                            exportPDF(filtered, name);
                          }}
                        >
                          <option value="">İndirmek istediğiniz bölüm...</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid">
                      {notes.map(n => (
                        <div key={n.id} className="glass card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => { setSelectedNote(n); setShowNoteModal(true); }}>
                          <Trash2 
                            size={14} 
                            style={{ position: 'absolute', top: '10px', right: '10px', color: '#ef4444', opacity: 0.4, cursor: 'pointer', zIndex: 5 }} 
                            onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span className="badge" style={{ fontSize: '0.65rem' }}>{n.departments?.name}</span>
                            <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{new Date(n.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                          <strong style={{ display: 'block', fontSize: '1rem' }}>{n.title}</strong>
                          <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '8px', lineHeight: '1.4' }}>{n.content.substring(0, 70)}...</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === 'firms' && (
                   <div className="glass card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3>Tüm Firmalar</h3>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          value={firmSearch} 
                          onChange={e => setFirmSearch(e.target.value)} 
                          placeholder="Listede Ara..." 
                          style={{ maxWidth: '250px' }} 
                        />
                        <button className="btn-primary" onClick={searchLogos}><Search size={18} /> Logo Bul</button>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                       <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ maxWidth: '300px' }}>
                        <option value="">Lütfen Hedef Bölüm Seçin</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>

                    <div className="grid">
                      {firms
                        .filter(f => !selectedId || f.department_id === selectedId)
                        .filter(f => !firmSearch || f.name.toLowerCase().includes(firmSearch.toLowerCase()))
                        .map(f => (
                        <div key={f.id} className="glass card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', position: 'relative' }}>
                          <img 
                            src={f.logo_url} 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const domain = f.name.toLowerCase().replace(/\s+/g, '') + '.com';
                              const googleLogo = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
                              if (target.src !== googleLogo) target.src = googleLogo;
                              else target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=ff5e1a&color=fff`;
                            }}
                            style={{ width: '60px', height: '60px', objectFit: 'contain', background: 'white', borderRadius: '12px', padding: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                            alt={f.name} 
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{f.name}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{f.departments?.name}</div>
                          </div>
                          <button 
                            className="nav-item" 
                            style={{ width: '30px', height: '30px', color: '#ef4444', background: 'transparent' }} 
                            onClick={(e) => { e.stopPropagation(); deleteFirm(f.id); }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === 'announcements' && (
                  <div className="glass card animate-fade-in">
                    <h3>Sistem Duyurusu Yayınla</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem', maxWidth: '500px' }}>
                      <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Duyuru Başlığı" />
                      <textarea value={itemExtra} onChange={e => setItemExtra(e.target.value)} placeholder="Duyuru içeriği..." style={{ height: '100px' }} />
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', opacity: 0.5 }}>Hedef Hoca:</label>
                          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ marginTop: '5px' }}>
                            <option value="">Tüm Hocalar</option>
                            {profiles
                            .filter(p => p.role === 'lecturer')
                            .filter(p => role === 'admin' || p.department_id === userProfile?.department_id)
                            .map(p => (
                              <option key={p.id} value={p.id}>{p.full_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', opacity: 0.5 }}>Süre:</label>
                          <select value={targetDate} onChange={e => setTargetDate(e.target.value)} style={{ marginTop: '5px' }}>
                            <option value="">Kalıcı</option>
                            <option value="1">1 Gün</option>
                            <option value="7">1 Hafta</option>
                            <option value="30">1 Ay</option>
                          </select>
                        </div>
                      </div>

                      <button className="btn-primary" onClick={createAnnouncement}>📢 Yayınla</button>
                    </div>
                    
                    <h4 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>Geçmiş Duyurular</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       {announcements.map(a => (
                        <div key={a.id} className="glass" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {a.title}
                              {a.target_user_id && <span className="badge" style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.05)' }}>🎯 Kişiye Özel</span>}
                            </div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{a.content}</div>
                            {a.expires_at && (
                              <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '5px' }}>
                                Bitir: {new Date(a.expires_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <button 
                            className="nav-item" 
                            style={{ color: '#ef4444', padding: '10px', background: 'transparent' }}
                            onClick={() => deleteAnnouncement(a.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* LECTURER VIEW - REDESIGNED */
              <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Header widget */}
                  <div className="glass card" style={{ position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'var(--primary)', filter: 'blur(60px)', opacity: 0.3 }} />
                    <div>
                      <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Merhaba, {userProfile?.full_name?.split(' ')[0]} 👋</h1>
                      <p style={{ opacity: 0.8, fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                        {userProfile?.title || 'Bölüm Koordinatörü'}
                        {userProfile?.title2 && ` & ${userProfile.title2}`}
                      </p>
                      <p style={{ opacity: 0.6 }}>{userProfile?.departments?.name} Koordinatörlük Masası verileri güncellendi.</p>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <label style={{ cursor: 'pointer', display: 'block', position: 'relative' }}>
                        <div className="glass" style={{ width: '80px', height: '80px', borderRadius: '24px', overflow: 'hidden', border: '2px solid var(--primary)', position: 'relative' }}>
                          <img 
                            src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.email}`} 
                            alt="Profil" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px 0' }}>
                            Değiştir
                          </div>
                        </div>
                        <input type="file" onChange={handleAvatarUpload} hidden accept="image/*" />
                      </label>
                    </div>
                  </div>

                  <div className="glass card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Building2 size={20} color="var(--primary)" /> Firma Portföyü
                      </h3>
                      <div className="badge">{firms.length} Aktif Firma</div>
                    </div>

                    {/* Quick Analytics Bar */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                      <div className="glass" style={{ flex: 1, padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <BarChart3 size={18} color="var(--primary)" />
                        <div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Haftalık Görüşme</div>
                          <div style={{ fontWeight: 800 }}>{notes.filter(n => new Date(n.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</div>
                        </div>
                      </div>
                      <div className="glass" style={{ flex: 1, padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Activity size={18} color="var(--success)" />
                        <div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Sektör Çeşitliliği</div>
                          <div style={{ fontWeight: 800 }}>{new Set(firms.map(f => f.sector)).size}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <input 
                          value={itemName} 
                          onChange={e => setItemName(e.target.value)} 
                          onBlur={() => { if(itemName.length > 2) searchLogos(); }}
                          placeholder="Firma ismi..." 
                          style={{ flex: 2, border: 'none', background: 'rgba(255,255,255,0.03)' }}
                        />
                        <input 
                          value={sector} 
                          onChange={e => setSector(e.target.value)} 
                          placeholder="Sektör (Teknoloji, Gıda...)" 
                          style={{ flex: 1, border: 'none', background: 'rgba(255,255,255,0.03)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <input 
                          value={pocName} 
                          onChange={e => setPocName(e.target.value)} 
                          placeholder="Yetkili Ad Soyad" 
                          style={{ flex: 1, border: 'none', background: 'rgba(255,255,255,0.03)' }}
                        />
                        <button className="btn-primary" onClick={searchLogos} style={{ padding: '0.5rem 1.5rem' }}>
                          <Plus size={20} /> Firma Ekle
                        </button>
                      </div>
                      {(pocName || sector) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="animate-fade-in">
                          <input value={pocEmail} onChange={e => setPocEmail(e.target.value)} placeholder="Email" style={{ border: 'none', background: 'rgba(255,255,255,0.02)', fontSize: '0.8rem' }} />
                          <input value={pocTitle} onChange={e => setPocTitle(e.target.value)} placeholder="Ünvan" style={{ border: 'none', background: 'rgba(255,255,255,0.02)', fontSize: '0.8rem' }} />
                        </div>
                      )}
                    </div>

                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                      <input 
                        placeholder="Firma veya sektöre göre ara..." 
                        style={{ paddingLeft: '40px', fontSize: '0.9rem', background: 'transparent', borderBottom: '1px solid var(--glass-border)', borderRadius: 0 }}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                      {firms.filter(f => 
                        f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (f.sector && f.sector.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).map(f => (
                        <div key={f.id} className="glass card" style={{ padding: '1.2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', position: 'relative' }}>
                          <button 
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5 }}
                            onClick={() => deleteFirm(f.id)}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                          >
                            <Trash2 size={16} />
                          </button>
                          <img 
                            src={f.logo_url} 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const domain = f.name.toLowerCase().replace(/\s+/g, '') + '.com';
                              const googleLogo = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
                              
                              if (target.src !== googleLogo) {
                                target.src = googleLogo; // Try Google if saved logo fails
                              } else {
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=ff5e1a&color=fff`;
                              }
                            }}
                            style={{ width: '50px', height: '50px', objectFit: 'contain', background: 'white', borderRadius: '14px', padding: '6px', margin: '0 auto 1rem' }} 
                            alt={f.name}
                          />
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{f.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="glass card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3>Toplantı Arşivi</h3>
                      <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => exportPDF(notes, userProfile?.departments?.name)}>
                        <FileDown size={14} /> Tümü (PDF)
                      </button>
                    </div>

                    <div className="upload-area" onClick={() => fileInputRef.current?.click()} style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                      <Upload size={28} color="var(--primary)" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Word'den Metin Çek</div>
                      <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept=".docx" onChange={handleWordUpload} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <input 
                        value={itemName} 
                        onChange={e => setItemName(e.target.value)} 
                        placeholder="Toplantı Başlığı" 
                        style={{ border: 'none', background: 'rgba(255,255,255,0.03)' }}
                      />
                      <div className="quill-container" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', minHeight: '200px' }}>
                        <ReactQuill 
                          theme="snow" 
                          value={itemExtra} 
                          onChange={setItemExtra}
                          modules={quillModules}
                          formats={quillFormats}
                          placeholder="Kararlar, notlar ve detaylar..."
                          style={{ height: '200px', border: 'none' }}
                        />
                      </div>
                      <div style={{ marginTop: '50px' }}>
                        <button className="btn-primary" style={{ width: '100%' }} onClick={() => addNote()}>
                          <Printer size={18} /> Toplantıyı Kaydet
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="glass card" style={{ padding: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1.2rem', opacity: 0.6, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>GEÇMİŞ TOPLANTILAR</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {notes.slice(0, 5).map(n => (
                        <div key={n.id} className="glass" style={{ padding: '1rem', cursor: 'pointer', border: '1px solid rgba(255,94,26,0.1)', position: 'relative' }} onClick={() => { setSelectedNote(n); setShowNoteModal(true); }}>
                          <Trash2 
                            size={14} 
                            style={{ position: 'absolute', top: '8px', right: '8px', color: '#ef4444', opacity: 0.3, cursor: 'pointer', zIndex: 5 }} 
                            onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{n.title}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>{new Date(n.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )}

      {/* Logo Selection Modal */}
      {showLogoModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass card" style={{ maxWidth: '600px', width: '90%', padding: '2rem' }}>
            <h3>Logo Seçin: {itemName}</h3>
            {searchingLogos ? (
              <p>Logolar aranıyor...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem', marginTop: '1.5rem', maxHeight: '430px', overflowY: 'auto', padding: '10px' }}>
                {logoSuggestions.length > 0 ? logoSuggestions.map((s, i) => {
                  // Direct URL is often more reliable than the one in JSON
                  const clearbitLogo = `https://logo.clearbit.com/${s.domain}`;
                  const googleLogo = `https://www.google.com/s2/favicons?sz=128&domain=${s.domain}`;
                  
                  return (
                    <div 
                      key={i} 
                      className="glass card" 
                      style={{ cursor: 'pointer', textAlign: 'center', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
                      onClick={() => createFirm(clearbitLogo)}
                    >
                      <div style={{ width: '64px', height: '64px', margin: '0 auto 1.2rem', background: '#fff', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                        <img 
                          src={clearbitLogo} 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== googleLogo) {
                              target.src = googleLogo; // Try Google if Clearbit fails
                            } else {
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=ff5e1a&color=fff&size=128&bold=true`;
                            }
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                          alt={s.name}
                        />
                      </div>
                      <p style={{ fontSize: '0.8rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff', marginBottom: '4px' }}>{s.name}</p>
                      <p style={{ fontSize: '0.6rem', opacity: 0.4, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.domain}</p>
                    </div>
                  );
                }) : (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                    <p style={{ opacity: 0.6 }}>Logo bulunamadı veya arama sonuçlarından memnun değil misiniz?</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                      <button className="btn-secondary" onClick={() => createFirm()}>
                        Varsayılanı Kullan
                      </button>
                      <label 
                        className="btn-primary" 
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Plus size={18} /> PNG Yükle
                        <input 
                          type="file" 
                          hidden 
                          accept="image/png,image/jpeg" 
                          onChange={handleCustomLogoUpload} 
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {logoSuggestions.length > 0 && !searchingLogos && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '1rem' }}>Aradığınız logoyu bulamadınız mı?</p>
                <label 
                  className="btn-secondary" 
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', fontSize: '0.8rem' }}
                >
                  <Plus size={16} /> Kendi Logonu Yükle (PNG)
                  <input 
                    type="file" 
                    hidden 
                    accept="image/png,image/jpeg" 
                    onChange={handleCustomLogoUpload} 
                  />
                </label>
              </div>
            )}

            <button className="btn-secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setShowLogoModal(false)}>İptal</button>
          </div>
        </div>
      )}
      {/* Note Detail Modal */}
      {showNoteModal && selectedNote && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass card" style={{ maxWidth: '800px', width: '90%', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ color: 'var(--accent)' }}>{selectedNote.title}</h2>
                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>
                  📅 {new Date(selectedNote.created_at).toLocaleDateString('tr-TR')} | 🏢 {selectedNote.departments?.name}
                </div>
              </div>
              <button 
                className="badge" 
                onClick={() => exportPDF([selectedNote], selectedNote.title.replace(/\s+/g, '_'))}
                style={{ cursor: 'pointer' }}
              >
                🖨️ PDF İndir
              </button>
            </div>
            <div 
              className="note-content"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                maxHeight: '400px', 
                overflowY: 'auto',
                lineHeight: '1.6'
              }}
              dangerouslySetInnerHTML={{ __html: selectedNote.content }}
            />
            <button className="btn-primary" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setShowNoteModal(false)}>Kapat</button>
          </div>
        </div>
      )}
      {/* Quick Add Note Modal (from Calendar) */}
      {showQuickNoteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
        }}>
          <div className="glass card animate-fade-in" style={{ maxWidth: '500px', width: '90%', padding: '2.5rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Toplantı Notu Ekle</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.5, marginBottom: '2rem' }}>📅 Tarih: {targetDate}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, marginBottom: '8px', display: 'block' }}>TOPLANTI BAŞLIĞI</label>
                <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Örn: Sektör Buluşması Notları" />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, marginBottom: '8px', display: 'block' }}>TOPLANTI ÖZETİ</label>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden' }}>
                  <ReactQuill 
                    theme="snow" 
                    value={itemExtra} 
                    onChange={setItemExtra}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Görüşülen konular..."
                    style={{ height: '180px' }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '40px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn-secondary" onClick={() => setShowQuickNoteModal(false)}>İptal</button>
                <button className="btn-primary" onClick={() => addNote(targetDate)}>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
