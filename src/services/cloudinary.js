// src/services/cloudinary.js

const CLOUD_NAME    = 'dqwnacuon';
const UPLOAD_PRESET = 'ml_duohearts';

export const openUploadWidget = (options = {}, onSuccess) => {
  if (!window.cloudinary) {
    alert('Cloudinary widget not loaded. Check your index.html script tag.');
    return;
  }

  const widget = window.cloudinary.createUploadWidget(
    {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      multiple: false,
      maxFileSize: 5000000,
      clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      showPoweredBy: false,       // hides "powered by Cloudinary"
      showUploadMoreButton: false,
      singleUploadAutoClose: true,
      text: {
        en: {
          or:             'or',
          back:           '← Back',
          advanced:       'Advanced',
          close:          'Close',
          no_results:     'No results',
          search_placeholder: 'Search files',
          about_ux:       '',
          menu: {
            files:        '📁  My Device',
            web:          '🌐  From URL',
            camera:       '📷  Camera',
          },
          selection_counter: { file: 'file selected' },
          actions: {
            upload:       'Upload Photo ✨',
            next:         'Next →',
          },
          local: {
            browse:       'Browse',
            dd_title_single:   'Drag & drop your photo here',
            dd_title_multi:    'Drag & drop your photos here',
            drop_title_single: 'Drop your photo to upload',
            drop_title_multi:  'Drop your photos to upload',
          },
        },
      },
      styles: {
        palette: {
          window:          '#f4ebd8',
          windowBorder:    '#4d3a2b',
          tabIcon:         '#df8b91',
          menuIcons:       '#4d3a2b',
          textDark:        '#4d3a2b',
          textLight:       '#ffffff',
          link:            '#df8b91',
          action:          '#e6b265',
          inactiveTabIcon: '#6b5544',
          error:           '#cc4d4d',
          inProgress:      '#e6b265',
          complete:        '#4caf50',
          sourceBg:        '#e8cf92',
        },
        frame:  { background: 'rgba(77,58,43,0.6)' },
        fonts: {
          default: null,
          "'Mali', cursive": {
            url:    'https://fonts.googleapis.com/css2?family=Mali:wght@600&display=swap',
            active: true,
          },
        },
      },
      ...options,
    },
    (error, result) => {
      if (error) { console.error('Cloudinary error:', error); return; }
      if (result?.event === 'success') onSuccess(result.info.secure_url);
    }
  );

  widget.open();
};
