import { useState, useEffect, useRef, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
    Play,
    Filter,
    Pause,
    Volume2,
    SkipBack,
    SkipForward,
    X,
    Repeat,
    FastForward,
} from 'lucide-react';

// Data Qori sesuai API equran.id
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
    nama_latin: string;
    jumlah_ayat: number;
    audioFull: Record<string, string>;
}

export default function QuranTab() {
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQori, setSelectedQori] = useState('05');

    // ✅ OPTIMISASI: Debounce search term (300ms delay)
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Audio Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);
    const [isAutoNext, setIsAutoNext] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [activeAudioName, setActiveAudioName] = useState('');

    const audioRef = useRef<HTMLAudioElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadSurahs();
    }, []);

    // ✅ OPTIMISASI: useMemo untuk filter hasil (tidak perlu state terpisah)
    const filteredSurahs = useMemo(() => {
        if (!debouncedSearchTerm) return surahs;
        return surahs.filter(
            (s) =>
                s.nama_latin
                    .toLowerCase()
                    .includes(debouncedSearchTerm.toLowerCase()) ||
                s.nomor.toString().includes(debouncedSearchTerm),
        );
    }, [debouncedSearchTerm, surahs]);

    // ✅ OPTIMISASI: Cache keys dan TTL
    const CACHE_KEY = 'equran_surahs_cache';
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 jam

    // ✅ Menggunakan FETCH dengan CACHING ke equran.id v2
    const loadSurahs = async () => {
        setLoading(true);
        try {
            // ✅ OPTIMISASI: Check cache first
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TTL) {
                    console.log('📦 Loading surahs from cache');
                    setSurahs(data);
                    setLoading(false);
                    return;
                }
            }

            // Fetch from API if cache miss or expired
            console.log('🌐 Fetching surahs from API');
            const response = await fetch('https://equran.id/api/v2/surat');
            const result = await response.json();
            if (result.code === 200) {
                setSurahs(result.data);
                // ✅ OPTIMISASI: Save to cache
                localStorage.setItem(
                    CACHE_KEY,
                    JSON.stringify({
                        data: result.data,
                        timestamp: Date.now(),
                    }),
                );
            }
        } catch (error) {
            // ✅ OPTIMISASI: Fallback to stale cache if network fails
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data } = JSON.parse(cached);
                console.log('📦 Network failed, using stale cache');
                setSurahs(data);
            } else {
                toast({
                    title: 'Error',
                    description: 'Gagal memuat surah dari server',
                    variant: 'destructive',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePlaySurah = async (surahNumber: string) => {
        if (!surahNumber) return;
        try {
            const response = await fetch(
                `https://equran.id/api/v2/surat/${surahNumber}`,
            );
            const result = await response.json();
            const surahData = result.data;

            setActiveAudioName(surahData.nama_latin);
            setSelectedSurah(surahNumber);

            if (audioRef.current) {
                audioRef.current.src = surahData.audioFull[selectedQori];
                audioRef.current.load();
                audioRef.current.play();
                setIsPlaying(true);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal memuat audio',
                variant: 'destructive',
            });
        }
    };

    const toggleRepeat = () => {
        setIsRepeat(!isRepeat);
        if (!isRepeat) setIsAutoNext(false); // Saling mengunci
    };

    const toggleAutoNext = () => {
        setIsAutoNext(!isAutoNext);
        if (!isAutoNext) setIsRepeat(false); // Saling mengunci
    };

    const handleAudioEnded = () => {
        if (isRepeat) {
            audioRef.current?.play();
        } else if (isAutoNext) {
            const current = parseInt(selectedSurah);
            if (current < 114) handlePlaySurah((current + 1).toString()); // Auto Next
        }
    };

    const formatTime = (time: number) => {
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const smallToggleBtn = (active: boolean) =>
        `h-10 w-10 rounded-full border transition flex items-center justify-center ${
            active
                ? 'text-emerald-600 bg-emerald-50 border-emerald-300 shadow-sm'
                : 'text-gray-400 bg-white border-gray-200 hover:text-emerald-600'
        }`;

    return (
        <div className="space-y-6 pb-40 px-2 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-emerald-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-emerald-800 text-left">
                            Pengaturan Qori
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selectedQori}
                            onValueChange={setSelectedQori}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {QORI_OPTIONS.map((q) => (
                                    <SelectItem key={q.value} value={q.value}>
                                        {q.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card className="border-emerald-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-emerald-800 text-left">
                            Cari Surah
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Cari surah (nama atau nomor)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-emerald-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-emerald-900 font-bold text-left">
                        Daftar Surah
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-10 text-center text-gray-500 font-medium italic animate-pulse">
                            Memuat surah...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSurahs.map((surah) => (
                                <div
                                    key={surah.nomor}
                                    className={`flex items-center justify-between p-4 rounded-xl hover:bg-emerald-50 transition-all cursor-pointer border ${selectedSurah === surah.nomor.toString() ? 'border-emerald-600 bg-emerald-50 shadow-md scale-[1.02]' : 'bg-white border-gray-100 shadow-sm'}`}
                                    onClick={() =>
                                        handlePlaySurah(surah.nomor.toString())
                                    }
                                >
                                    <div className="min-w-0 flex-1">
                                        {/* ✅ PERBAIKAN: Nama Surah & Jumlah Ayat */}
                                        <p className="font-extrabold text-emerald-900 truncate">
                                            {surah.nomor}. {surah.nama_latin}
                                        </p>
                                        <p className="text-xs text-emerald-600 font-bold mt-1 bg-emerald-100/50 w-fit px-2 py-0.5 rounded-full">
                                            {surah.jumlah_ayat} Ayat
                                        </p>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="rounded-full bg-emerald-50 hover:bg-emerald-200 shrink-0 ml-2"
                                    >
                                        <Play className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* AUDIO PLAYER BAR */}
            {activeAudioName && (
                <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-[9999]">
                    <div className="relative w-full max-w-4xl bg-white border border-emerald-100 shadow-2xl rounded-3xl p-5 animate-in slide-in-from-bottom-10">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white border shadow-md text-gray-400 hover:text-red-500"
                            onClick={() => setActiveAudioName('')}
                        >
                            <X className="w-4 h-4" />
                        </Button>

                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex items-center gap-4 w-full md:w-1/4 text-left">
                                <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-200 flex-shrink-0">
                                    <Volume2 className="w-6 h-6" />
                                </div>
                                <div className="truncate">
                                    <p className="text-base font-bold text-gray-900 truncate">
                                        {activeAudioName}
                                    </p>
                                    <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest">
                                        Sedang Diputar
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col flex-1 w-full gap-2">
                                <div className="flex items-center justify-center gap-6">
                                    {/* TOMBOL REPEAT */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={smallToggleBtn(isRepeat)}
                                        onClick={toggleRepeat}
                                        title="Ulang Surah"
                                    >
                                        <Repeat className="w-5 h-5" />
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-gray-400 hover:text-emerald-600"
                                        onClick={() =>
                                            handlePlaySurah(
                                                (
                                                    parseInt(selectedSurah) - 1
                                                ).toString(),
                                            )
                                        }
                                    >
                                        <SkipBack className="w-6 h-6 fill-current" />
                                    </Button>

                                    <Button
                                        size="icon"
                                        className="bg-emerald-600 hover:bg-emerald-700 h-14 w-14 rounded-full shadow-xl shadow-emerald-100 transition-transform active:scale-90"
                                        onClick={() =>
                                            isPlaying
                                                ? audioRef.current?.pause()
                                                : audioRef.current?.play()
                                        }
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-7 h-7" />
                                        ) : (
                                            <Play className="w-7 h-7 ml-1 fill-current" />
                                        )}
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-gray-400 hover:text-emerald-600"
                                        onClick={() =>
                                            handlePlaySurah(
                                                (
                                                    parseInt(selectedSurah) + 1
                                                ).toString(),
                                            )
                                        }
                                    >
                                        <SkipForward className="w-6 h-6 fill-current" />
                                    </Button>

                                    {/* TOMBOL AUTO NEXT */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={smallToggleBtn(isAutoNext)}
                                        onClick={toggleAutoNext}
                                        title="Lanjut Otomatis"
                                    >
                                        <FastForward className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-4 px-2">
                                    <span className="text-[10px] text-gray-500 font-bold w-10 text-right font-mono tabular-nums">
                                        {formatTime(currentTime)}
                                    </span>
                                    <Slider
                                        max={duration || 100}
                                        step={0.1}
                                        value={[currentTime]}
                                        onValueChange={(v) => {
                                            if (audioRef.current)
                                                audioRef.current.currentTime =
                                                    v[0];
                                        }}
                                        className="flex-1 cursor-pointer"
                                    />
                                    <span className="text-[10px] text-gray-500 font-bold w-10 font-mono tabular-nums">
                                        {formatTime(duration)}
                                    </span>
                                </div>
                            </div>

                            <div className="hidden md:flex items-center gap-4 w-1/4 justify-end pr-4">
                                <Volume2 className="w-5 h-5 text-gray-400" />
                                <Slider
                                    max={1}
                                    step={0.01}
                                    value={[volume]}
                                    onValueChange={(v) => {
                                        if (audioRef.current)
                                            audioRef.current.volume = v[0];
                                        setVolume(v[0]);
                                    }}
                                    className="w-24 cursor-pointer"
                                />
                            </div>
                        </div>

                        <audio
                            ref={audioRef}
                            className="hidden"
                            onTimeUpdate={() =>
                                setCurrentTime(
                                    audioRef.current?.currentTime || 0,
                                )
                            }
                            onLoadedMetadata={() =>
                                setDuration(audioRef.current?.duration || 0)
                            }
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={handleAudioEnded}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
