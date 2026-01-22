# Dashboard Pengumuman & Al-Quran - Development Plan

## Design Guidelines

### Design References
- **Modern Dashboard**: Clean, professional admin interface
- **Style**: Modern Minimalism + Islamic Theme + Dashboard Layout

### Color Palette
- Primary: #059669 (Emerald Green - Islamic theme)
- Secondary: #10B981 (Light Green - accents)
- Background: #F9FAFB (Light Gray)
- Dark Background: #111827 (Dark mode)
- Text: #1F2937 (Dark Gray), #6B7280 (Medium Gray)
- Accent: #3B82F6 (Blue - interactive elements)

### Typography
- Heading1: Inter font-weight 700 (32px)
- Heading2: Inter font-weight 600 (24px)
- Heading3: Inter font-weight 600 (18px)
- Body: Inter font-weight 400 (14px)
- Navigation: Inter font-weight 500 (16px)

### Key Component Styles
- **Buttons**: Primary green (#059669), white text, 8px rounded, hover: darken 10%
- **Cards**: White background, subtle shadow, 12px rounded
- **Sidebar**: Dark background (#1F2937), white text, active item highlighted
- **Tables**: Striped rows, hover effect, sortable headers

### Layout & Spacing
- Sidebar: 256px width, fixed position
- Main content: Full height with padding 24px
- Card spacing: 16px gaps
- Form inputs: 12px padding, border radius 8px

---

## Database Schema

### Tables to Create:
1. **announcements** (create_only: true)
   - id (integer, primary key)
   - user_id (string)
   - title (string)
   - message (text)
   - audio_url (string)
   - audio_type (string) - "generated" or "uploaded"
   - created_at (datetime)

2. **announcement_schedules** (create_only: true)
   - id (integer, primary key)
   - user_id (string)
   - announcement_id (integer)
   - day_of_week (string) - "monday", "tuesday", etc.
   - time (string) - "HH:MM" format
   - is_active (boolean)
   - created_at (datetime)

3. **quran_schedules** (create_only: true)
   - id (integer, primary key)
   - user_id (string)
   - qori_name (string)
   - surah_number (integer)
   - surah_name (string)
   - ayat_start (integer)
   - ayat_end (integer)
   - audio_url (string)
   - day_of_week (string)
   - time (string)
   - is_active (boolean)
   - created_at (datetime)

4. **settings** (create_only: true)
   - id (integer, primary key)
   - user_id (string)
   - default_qori (string)
   - volume (integer) - 0-100
   - timezone (string)
   - auto_play_enabled (boolean)
   - created_at (datetime)
   - updated_at (datetime)

---

## Development Tasks

### Phase 1: Backend Setup
- [x] Activate Atoms Backend
- [ ] Create database tables
- [ ] Create ObjectStorage bucket for audio files
- [ ] Implement backend API routes

### Phase 2: Frontend Structure
- [ ] Install dependencies
- [ ] Setup routing (Login, Dashboard, Schedule, Settings, AuthCallback)
- [ ] Create layout components (Sidebar, Header)
- [ ] Implement authentication flow

### Phase 3: Dashboard Components
- [ ] AnnouncementSection.jsx (TTS generation, upload MP3, list audio)
- [ ] QuranSection.jsx (API integration, qori/surah selector, audio player)

### Phase 4: Schedule & Settings
- [ ] Schedule.jsx (two tables for announcements & quran)
- [ ] Settings.jsx (configuration form)

### Phase 5: Styling & Testing
- [ ] Apply Tailwind styling
- [ ] Responsive design
- [ ] Test all features
- [ ] Final lint check