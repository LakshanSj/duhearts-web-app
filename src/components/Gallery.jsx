import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Trash2, X } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { openUploadWidget } from '../services/cloudinary';

export default function Gallery({ user, userProfile, pairId }) {
  const [images, setImages]       = useState([]);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox]   = useState(null); // { id, url, uploaderId }
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    if (!pairId) return;
    const q = query(collection(db, 'galleries', pairId, 'images'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => setImages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [pairId]);

  const handleUpload = () => {
    if (!user || !pairId) return;
    setUploading(true);
    openUploadWidget(
      { folder: `duohearts/galleries/${pairId}`, tags: ['gallery', pairId] },
      async (url) => {
        try {
          await addDoc(collection(db, 'galleries', pairId, 'images'), {
            url,
            uploaderId:   user.uid,
            uploaderName: userProfile?.displayName || userProfile?.username || 'Unknown',
            timestamp:    Date.now(),
          });
        } catch (err) {
          if (window.showAlert) window.showAlert('Saved to Cloudinary but Firestore failed: ' + err.message);
        }
        setUploading(false);
      }
    );
    setTimeout(() => setUploading(false), 60000);
  };

  const handleDelete = async (img) => {
    if (img.uploaderId !== user.uid) {
      if (window.showAlert) window.showAlert("You can only delete photos you uploaded.");
      return;
    }
    if (window.showConfirm) {
      window.showConfirm("Delete this memory? This can't be undone 💔", async () => {
        setDeleting(true);
        try {
          await deleteDoc(doc(db, 'galleries', pairId, 'images', img.id));
          if (lightbox?.id === img.id) setLightbox(null);
        } catch (err) {
          if (window.showAlert) window.showAlert('Delete failed: ' + err.message);
        }
        setDeleting(false);
      });
    }
  };

  return (
    <>
      <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Save your memories here 📸
          </p>
          <button className="gradient-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleUpload} disabled={uploading}>
            <Upload size={18} />
            {uploading ? 'Opening...' : 'Upload Photo'}
          </button>
        </div>

        {images.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>No photos yet. Upload your first memory!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {images.map((img) => {
              const isOwner = img.uploaderId === user.uid;
              return (
                <div
                  key={img.id}
                  style={{ position: 'relative', paddingTop: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', background: 'var(--bg-main)', cursor: 'pointer' }}
                >
                  <img
                    src={img.url}
                    alt="Memory"
                    onClick={() => setLightbox(img)}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  {/* Delete badge — only for uploader */}
                  {isOwner && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(img); }}
                      title="Delete photo"
                      style={{
                        position: 'absolute', top: '6px', right: '6px',
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: 'rgba(204,77,77,0.85)',
                        border: '2px solid #fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Trash2 size={13} color="#fff" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <img src={lightbox.url} alt="Memory" style={{ display: 'block', maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain' }} />

            {/* Close */}
            <button
              onClick={() => setLightbox(null)}
              style={{ position: 'absolute', top: '10px', left: '10px', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={18} color="#fff" />
            </button>

            {/* Delete in lightbox */}
            {lightbox.uploaderId === user.uid && (
              <button
                onClick={() => handleDelete(lightbox)}
                disabled={deleting}
                style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '20px', background: 'rgba(204,77,77,0.85)', border: '2px solid rgba(255,255,255,0.3)', color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <Trash2 size={15} /> {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
