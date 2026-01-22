import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider'; 
import { useToast } from '@/hooks/use-toast';
import { Play, Filter, Pause, Volume2, SkipBack, SkipForward, X, Repeat, FastForward, ArrowLeft, Loader2 } from 'lucide-react';

const QORI_OPTIONS = [
  { value: '05', label: 'Mishary Rashid Al-Afasy' },
  { value: '01', label: 'Abdullah Al-Juhany' },
  { value: '02', label: 'Abdul Muhsin Al-Qasim' },
  { value: '03', label: 'Abdurrahman as-Sudais' },
  { value: '04', label: 'Ibrahim Al-Dossari' },
];

interface Surah {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  audioFull: Record<string, string>;
}

interface Ayat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
}

export default function QuranTab() {
  // --- STATE ---
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQori, setSelectedQori] = useState('05');

  // Detail View State
  const [viewDetail, setViewDetail] = useState<Surah | null>(null);
  const [ayats, setAyats] = useState<Ayat[]>([]);
  const [loadingAyat, setLoadingAyat] = useState(false);

  // Audio State
  const [selectedSurah, setSelectedSurah] = useState<string>(''); // ID Surah yg sedang diputar
  const [activeAudioName, setActiveAudioName] = useState('');     // Judul Surah yg sedang diputar
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isAutoNext, setIsAutoNext] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // --- EFFECTS ---
  useEffect(() => { loadSurahs(); }, []);
  useEffect(() => { handleFilter(searchTerm); }, [searchTerm, surahs]);

  // Restart audio saat ganti Qori jika sedang memutar
  useEffect(() => {
    if (activeAudioName && selectedSurah && audioRef.current) {
       // Hanya update source, jangan auto play kecuali user minta (opsional)
       // Di sini kita biarkan user play manual atau logic play handlePlaySurah menangani
       handlePlaySurah(selectedSurah, true); 
    }
  }, [selectedQori]);

  // --- FETCHING DATA ---
  const loadSurahs = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://equran.id/api/v2/surat');
      const result = await response.json();
      if (result.code === 200) {
        setSurahs(result.data);
        setFilteredSurahs(result.data);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal memuat daftar surah', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const loadAyats = async (surah: Surah) => {
    setLoadingAyat(true);
    setViewDetail(surah);
    try {
      const response = await fetch(`https://equran.id/api/v2/surat/${surah.nomor}`);
      const result = await response.json();
      if (result.code === 200) {
        setAyats(result.data.ayat);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal memuat ayat', variant: 'destructive' });
    } finally {
      setLoadingAyat(false);
    }
  };

  // --- AUDIO LOGIC ---
  
  const handlePlaySurah = async (surahNumber: string, forceReload = false) => {
    if (!surahNumber || surahNumber === "0") return;

    try {
      // 1. Cek apakah surah yang diminta SAMA dengan yang sedang aktif?
      if (!forceReload && selectedSurah === surahNumber && audioRef.current && audioRef.current.src) {
        // Jika sama, cukup toggle play/pause
        togglePlayPause();
        return;
      }

      // 2. Jika BEDA, ambil data baru
      const response = await fetch(`https://equran.id/api/v2/surat/${surahNumber}`);
      const result = await response.json();
      const surahData = result.data;
      
      // 3. Update State UI
      setActiveAudioName(surahData.namaLatin);
      setSelectedSurah(surahNumber);
      
      // 4. Manipulasi Audio Element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = surahData.audioFull[selectedQori];
        audioRef.current.load();
        
        // Play dengan handling Promise biar ga error
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(error => {
              console.error("Autoplay prevent:", error);
              setIsPlaying(false);
            });
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal memuat audio', variant: 'destructive' });
    }
  };

  // ✅ FIX: Tombol Pause/Resume yang Stabil
  const togglePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Mencegah klik tembus ke card di belakangnya
    
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.error("Play error:", e));
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    if (isRepeat) {
      audioRef.current?.play();
    } else if (isAutoNext) {
      const current = parseInt(selectedSurah);
      if (current < 114) handlePlaySurah((current + 1).toString());
    } else {
      setIsPlaying(false);
    }
  };

  // --- HELPERS ---
  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleFilter = (term: string) => {
    if (!term) { setFilteredSurahs(surahs); return; }
    const filtered = surahs.filter(s => 
      s.namaLatin.toLowerCase().includes(term.toLowerCase()) || 
      s.nomor.toString().includes(term)
    );
    setFilteredSurahs(filtered);
  };

  const handleBackToList = () => {
    // Kita TIDAK mematikan audio saat kembali, agar user bisa baca sambil dengar.
    // Kalau mau dimatikan, uncomment baris di bawah:
    // if(audioRef.current) { audioRef.current.pause(); setIsPlaying(false); setActiveAudioName(''); }
    setViewDetail(null);
  };

  // --- SUB-COMPONENTS RENDERERS ---

  // 1. Render Audio Bar (Dibuat FIX agar tidak goyang)
  const renderAudioBar = () => {
    if (!activeAudioName) return null;

    return (
      // ✅ FIX: Menghapus pointer-events-none di wrapper utama & set z-index tinggi
      <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-[9999]">
        <div className="relative w-full max-w-4xl bg-white border border-emerald-100 shadow-2xl rounded-3xl p-4 md:p-5 transition-all">
            
          {/* Tombol Close */}
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white border shadow-md text-gray-400 hover:text-red-500 z-50 cursor-pointer" 
            onClick={() => { 
                if(audioRef.current) audioRef.current.pause();
                setIsPlaying(false);
                setActiveAudioName('');
            }}
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {/* Info Judul */}
            <div className="flex items-center gap-4 w-full md:w-1/4 text-left">
              <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg flex-shrink-0 animate-pulse">
                <Volume2 className="w-6 h-6" />
              </div>
              <div className="truncate flex-1">
                <p className="text-base font-bold text-gray-900 truncate">{activeAudioName}</p>
                <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest">Sedang Diputar</p>
              </div>
            </div>
            
            {/* Kontrol Utama */}
            <div className="flex flex-col flex-1 w-full gap-2 text-center">
              <div className="flex items-center justify-center gap-4 md:gap-6">
                <Button variant="ghost" size="icon" 
                    className={`h-10 w-10 rounded-full border ${isRepeat ? "text-emerald-600 bg-emerald-50 border-emerald-300" : "text-gray-400 border-gray-200"}`} 
                    onClick={() => setIsRepeat(!isRepeat)}>
                    <Repeat className="w-5 h-5" />
                </Button>
                
                <Button size="icon" variant="ghost" className="text-gray-400 hover:text-emerald-600" 
                  onClick={() => handlePlaySurah((parseInt(selectedSurah) - 1).toString())}>
                  <SkipBack className="w-6 h-6 fill-current" />
                </Button>
                
                {/* ✅ FIX: Tombol Play Utama */}
                <Button 
                    size="icon" 
                    className="bg-emerald-600 hover:bg-emerald-700 h-14 w-14 rounded-full shadow-xl transition-transform active:scale-95 flex items-center justify-center" 
                    onClick={togglePlayPause} // Langsung panggil fungsi toggle
                >
                  {isPlaying ? <Pause className="w-7 h-7 fill-white text-white" /> : <Play className="w-7 h-7 ml-1 fill-white text-white" />}
                </Button>

                <Button size="icon" variant="ghost" className="text-gray-400 hover:text-emerald-600" 
                  onClick={() => handlePlaySurah((parseInt(selectedSurah) + 1).toString())}>
                  <SkipForward className="w-6 h-6 fill-current" />
                </Button>
                
                <Button variant="ghost" size="icon" 
                    className={`h-10 w-10 rounded-full border ${isAutoNext ? "text-emerald-600 bg-emerald-50 border-emerald-300" : "text-gray-400 border-gray-200"}`} 
                    onClick={() => setIsAutoNext(!isAutoNext)}>
                    <FastForward className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Slider Waktu */}
              <div className="flex items-center gap-3 px-2 w-full">
                <span className="text-[10px] text-gray-500 font-bold w-8 text-right font-mono">{formatTime(currentTime)}</span>
                <Slider 
                    max={duration || 100} 
                    step={0.1} 
                    value={[currentTime]} 
                    onValueChange={v => { if (audioRef.current) audioRef.current.currentTime = v[0]; }} 
                    className="flex-1 cursor-pointer z-50" // z-50 agar slider bisa digeser
                />
                <span className="text-[10px] text-gray-500 font-bold w-8 font-mono">{formatTime(duration)}</span>
              </div>
            </div>
            
            {/* Volume (Desktop Only) */}
            <div className="hidden md:flex items-center gap-3 w-1/4 justify-end pr-2">
              <Volume2 className="w-5 h-5 text-gray-400" />
              <Slider 
                max={1} step={0.01} value={[volume]} 
                onValueChange={v => { if (audioRef.current) audioRef.current.volume = v[0]; setVolume(v[0]); }} 
                className="w-24 cursor-pointer" 
               />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. Render Detail View
  const renderDetailView = () => {
    if (!viewDetail) return null;
    const isCurrentSurahPlaying = isPlaying && selectedSurah === viewDetail.nomor.toString();

    return (
      <div className="space-y-6 pb-40 px-2 text-left animate-in fade-in duration-300">
        <Button variant="outline" onClick={handleBackToList} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar
        </Button>
        
        <Card className="border-emerald-200 bg-emerald-50/30 text-center shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-emerald-900">{viewDetail.namaLatin}</CardTitle>
            <CardDescription className="text-emerald-700 font-bold">{viewDetail.nama} • {viewDetail.jumlahAyat} Ayat</CardDescription>
            <div className="flex justify-center pt-4">
              <Button 
                onClick={() => handlePlaySurah(viewDetail.nomor.toString())} 
                className={`rounded-full px-8 shadow-md transition-colors ${isCurrentSurahPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {isCurrentSurahPlaying ? <><Pause className="w-4 h-4 mr-2" /> Jeda Audio</> : <><Play className="w-4 h-4 mr-2 fill-current" /> Putar Audio Surah</>}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {loadingAyat ? (
             <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-emerald-600 animate-spin" /></div>
          ) : (
             ayats.map((ayat) => (
                <Card key={ayat.nomorAyat} className="border-emerald-50 shadow-sm hover:border-emerald-200 transition-colors">
                  <CardContent className="pt-6 space-y-6">
                    <div className="flex justify-between items-start gap-4">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold">
                        {ayat.nomorAyat}
                      </span>
                      <p className="text-right text-3xl leading-loose text-gray-800 dir-rtl font-serif flex-1">
                        {ayat.teksArab}
                      </p>
                    </div>
                    <div className="space-y-2 border-l-4 border-emerald-100 pl-4 text-left">
                      <p className="text-sm text-emerald-700 italic font-bold">{ayat.teksLatin}</p>
                      <p className="text-sm text-gray-600 font-medium">{ayat.teksIndonesia}</p>
                    </div>
                  </CardContent>
                </Card>
             ))
          )}
        </div>
      </div>
    );
  };

  // 3. Render List View
  const renderListView = () => {
    return (
      <div className="space-y-6 pb-40 px-2 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <Card className="border-emerald-100 shadow-sm text-left">
            <CardHeader><CardTitle className="text-sm font-bold text-left text-emerald-800">Pengaturan Qori</CardTitle></CardHeader>
            <CardContent>
              <Select value={selectedQori} onValueChange={setSelectedQori}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{QORI_OPTIONS.map((q) => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}</SelectContent>
              </Select>
            </CardContent>
          </Card>
          <Card className="border-emerald-100 shadow-sm text-left">
            <CardHeader><CardTitle className="text-sm font-bold text-left text-emerald-800">Cari Surah</CardTitle></CardHeader>
            <CardContent><div className="relative"><Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input placeholder="Cari surah..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div></CardContent>
          </Card>
        </div>

        <Card className="border-emerald-100 shadow-sm">
          <CardHeader><CardTitle className="text-lg text-emerald-900 font-bold text-left">Daftar Surah</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="py-10 text-center animate-pulse">Memuat...</div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSurahs.map((surah) => (
                  <div key={surah.nomor}
                    className={`flex items-center justify-between p-4 rounded-xl hover:bg-emerald-50 transition-all cursor-pointer border ${selectedSurah === surah.nomor.toString() ? 'border-emerald-600 bg-emerald-50 shadow-md scale-[1.02]' : 'bg-white border-gray-100 shadow-sm'}`}
                    onClick={() => loadAyats(surah)}
                  >
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-extrabold text-emerald-900 truncate">{surah.nomor}. {surah.namaLatin}</p>
                      <p className="text-xs text-emerald-600 font-bold mt-1 bg-emerald-100/50 w-fit px-2 py-0.5 rounded-full">{surah.jumlahAyat} Ayat</p>
                    </div>
                    <Button size="icon" variant="ghost" className="rounded-full bg-emerald-50 hover:bg-emerald-200 shrink-0 ml-2"
                      onClick={(e) => { e.stopPropagation(); handlePlaySurah(surah.nomor.toString()); }}
                    >
                      {isPlaying && selectedSurah === surah.nomor.toString() ? 
                          <Pause className="w-5 h-5 text-emerald-600 fill-emerald-600" /> : 
                          <Play className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                      }
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // --- MAIN RETURN ---
  // ✅ FIX PENTING: <audio> diletakkan di luar if-else viewDetail agar tidak ter-reset/unmount
  return (
    <>
      {viewDetail ? renderDetailView() : renderListView()}

      {/* Audio Element Hidden tapi selalu ada */}
      <audio 
        ref={audioRef} 
        className="hidden" 
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)} 
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)}
        onEnded={handleAudioEnded} 
      />

      {/* Audio Bar Overlay */}
      {renderAudioBar()}
    </>
  );
}