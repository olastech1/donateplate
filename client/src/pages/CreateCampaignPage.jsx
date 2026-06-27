import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiImage, FiUploadCloud, FiCheckCircle } from 'react-icons/fi';

const CATEGORIES = [
  { value: 'medical',      label: '🏥 Medical' },
  { value: 'education',   label: '📚 Education' },
  { value: 'community',   label: '🏘️ Community' },
  { value: 'crisis_relief', label: '🆘 Crisis Relief' },
  { value: 'personal',    label: '👤 Personal' },
  { value: 'general',     label: '🌍 General' },
];

function compressImage(file, maxWidth = 1200, maxHeight = 630, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CreateCampaignPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', category: 'general', goal_amount: '',
    description: '', cover_image_url: '', deadline: ''
  });

  const [imagePreview, setImagePreview] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [imageError, setImageError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  if (authLoading || !user) return <div className="page flex-center"><div className="spinner" /></div>;

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file (JPG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setImageError('Image must be under 15 MB.');
      return;
    }

    setImageError('');
    setImagePreview(URL.createObjectURL(file));
    setCompressing(true);
    
    try {
      const base64 = await compressImage(file);
      update('cover_image_url', base64);
    } catch {
      setImageError('Could not process this image. Please try another.');
      setImagePreview('');
    } finally {
      setCompressing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleRemove = () => {
    setImagePreview('');
    setImageError('');
    update('cover_image_url', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const goToStep2 = () => {
    if (!form.title || !form.goal_amount) {
      setError('Title and goal amount are required.');
    } else {
      setError(''); setStep(2);
    }
  };

  const goToStep3 = () => {
    if (!form.description) {
      setError('Please tell your story.');
    } else if (compressing) {
      setError('Please wait — image is still being processed.');
    } else {
      setError(''); setStep(3);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await campaignAPI.create({
        ...form,
        goal_amount: parseFloat(form.goal_amount),
        deadline: form.deadline || null,
      });
      navigate(`/campaigns/${res.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create campaign.');
    } finally {
      setLoading(false);
    }
  };

  const ImageZone = () => (
    <div className="form-group">
      <label className="form-label">Cover Image (optional)</label>
      {imagePreview ? (
        <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '12px', boxShadow: 'var(--shadow-md)' }}>
          <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} />
          {compressing && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#fff' }}>
              <div className="spinner" style={{ width: '28px', height: '28px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Optimising image…</span>
            </div>
          )}
          {!compressing && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
            >
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-sm" style={{ background: '#fff', color: '#0f172a' }}>🔄 Change</button>
              <button type="button" onClick={handleRemove} className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }}>🗑 Remove</button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--slate-300)'}`,
            borderRadius: 'var(--radius-md)', padding: '60px 20px', textAlign: 'center', cursor: 'pointer',
            background: dragOver ? 'rgba(249,115,22,0.05)' : 'var(--slate-50)', transition: 'all 0.2s', marginBottom: '8px',
          }}
        >
          <FiUploadCloud size={48} color={dragOver ? 'var(--accent)' : 'var(--slate-400)'} style={{ marginBottom: '16px' }} />
          <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--slate-800)' }}>
            {dragOver ? 'Drop it here!' : 'Click to upload or drag & drop'}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            JPG · PNG · WebP · GIF · up to 15 MB
          </p>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files[0])} />
      {imageError && <p className="text-error" style={{ fontSize: '0.85rem', marginTop: '6px' }}>⚠️ {imageError}</p>}
    </div>
  );

  return (
    <div className="page" style={{ background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        <div className="text-center mb-4">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--slate-800)', marginBottom: '8px' }}>Start a Campaign</h1>
          <p className="text-muted">Step {step} of 3</p>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: '6px', borderRadius: '100px',
              background: s <= step ? 'var(--accent)' : 'var(--slate-200)',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        <div className="card card-glass animate-in">
          <div className="card-body">
            {error && <div className="alert alert-error mb-4">{error}</div>}

            {/* Step 1: Basics */}
            {step === 1 && (
              <div className="animate-fade">
                <div className="form-group">
                  <label className="form-label">Campaign Title *</label>
                  <input type="text" className="form-input" value={form.title} onChange={e => update('title', e.target.value)} maxLength={150} placeholder="e.g., Help rebuild the local library" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    {CATEGORIES.map(c => (
                      <button key={c.value} type="button" onClick={() => update('category', c.value)} className={`btn ${form.category === c.value ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '10px' }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Funding Goal ($) *</label>
                  <input type="number" className="form-input" placeholder="e.g., 5000" value={form.goal_amount} onChange={e => update('goal_amount', e.target.value)} min="100" />
                </div>
                <button className="btn btn-primary btn-block btn-lg mt-4" onClick={goToStep2}>Continue →</button>
              </div>
            )}

            {/* Step 2: Story + Image */}
            {step === 2 && (
              <div className="animate-fade">
                <div className="form-group">
                  <label className="form-label">Tell Your Story *</label>
                  <textarea className="form-textarea" style={{ minHeight: '240px' }} placeholder="Share the details of why this campaign matters..." value={form.description} onChange={e => update('description', e.target.value)} />
                </div>
                <ImageZone />
                <div className="flex gap-2 mt-4">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary flex-1" onClick={goToStep3} disabled={compressing}>
                    {compressing ? '⏳ Processing image…' : 'Continue →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="animate-fade">
                {form.cover_image_url && (
                  <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
                    <img src={form.cover_image_url} alt="Cover preview" style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                <div style={{ background: 'var(--slate-50)', padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px', fontSize: '1.2rem' }}>Review Details</h3>
                  <div className="grid grid-2" style={{ gap: '16px' }}>
                    <div><div className="text-muted text-sm">Title</div><div style={{ fontWeight: 600 }}>{form.title}</div></div>
                    <div><div className="text-muted text-sm">Category</div><div style={{ fontWeight: 600 }}>{CATEGORIES.find(c => c.value === form.category)?.label}</div></div>
                    <div><div className="text-muted text-sm">Goal</div><div style={{ fontWeight: 600, color: 'var(--emerald-600)' }}>${Number(form.goal_amount).toLocaleString()}</div></div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Deadline (optional)</label>
                  <input type="date" className="form-input" value={form.deadline} onChange={e => update('deadline', e.target.value)} />
                </div>
                <div className="alert alert-info mb-4" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FiCheckCircle size={24} />
                  <div>Your campaign will go live immediately after submission.</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn btn-primary flex-1 btn-lg" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Submitting…' : 'Launch Campaign 🚀'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
