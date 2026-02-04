import { useState, useEffect, useRef } from 'react';
import { getAPIBaseURL } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    Calendar,
    Clock,
    Trash2,
    Plus,
    Volume2,
    X,
    Play,
    Pause,
    CheckCircle2,
    Hourglass,
    Music,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

// --- DATA STATIC ---
const QORI_OPTIONS = [
    { value: '01', label: 'Abdullah Al-Juhany' },
    { value: '02', label: 'Abdul Muhsin Al-Qasim' },
    { value: '03', label: 'Abdurrahman as-Sudais' },
    { value: '04', label: 'Ibrahim Al-Dossari' },
    { value: '05', label: 'Mishary Rashid Al-Afasy' },
];

const REPEAT_OPTIONS = [
    { value: 'once', label: 'Sekali' },
    { value: 'daily', label: 'Setiap Hari' },
    { value: 'weekly', label: 'Per Minggu' },
    { value: 'monthly', label: 'Per Bulan' },
];

export default function Schedule() {
    // --- STATE ---
    const [announcementSchedules, setAnnouncementSchedules] = useState<any[]>(
        [],
    );
    const [quranSchedules, setQuranSchedules] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [surahs, setSurahs] = useState<any[]>([]);

    const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
    const [showQuranForm, setShowQuranForm] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState('');
    const [selectedSurah, setSelectedSurah] = useState('');
    const [selectedQori, setSelectedQori] = useState('05');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [repeatType, setRepeatType] = useState('once');

    const [activeAudio, setActiveAudio] = useState<{
        url: string;
        title: string;
    } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Menyimpan info playing schedule
    const [playingSchedule, setPlayingSchedule] = useState<{
        id: number;
        type: 'quran' | 'announcement';
        repeat_type: string;
    } | null>(null);

    const lastPlayedRef = useRef<string>('');
    const { toast } = useToast();
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // --- EFFECT ---
    useEffect(() => {
        loadData();
        // ✅ Panggil segera saat mount
        checkAndTriggerAudio();
        // ✅ OPTIMISASI: Interval 10 detik untuk akurasi lebih baik
        const interval = setInterval(checkAndTriggerAudio, 10000);
        return () => clearInterval(interval);
    }, []);

    // --- LOGIC LOAD DATA ---
    const loadData = async () => {
        try {
            const announcementsRes = await fetch(
                `${getAPIBaseURL()}/api/announcements`,
            );
            const announcementsData = await announcementsRes.json();
            setAnnouncements(announcementsData.items || []);

            const schedulesRes = await fetch(
                `${getAPIBaseURL()}/api/announcement-schedules`,
            );
            const schedulesData = await schedulesRes.json();
            setAnnouncementSchedules(schedulesData.items || []);

            try {
                const quranSchedulesRes = await fetch(
                    `${getAPIBaseURL()}/api/quran-schedules`,
                );
                if (quranSchedulesRes.ok) {
                    const quranSchedulesData = await quranSchedulesRes.json();
                    setQuranSchedules(quranSchedulesData.items || []);
                } else {
                    setQuranSchedules([]);
                }
            } catch (e) {
                setQuranSchedules([]);
            }

            try {
                const surahsRes = await fetch('https://equran.id/api/v2/surat');
                const surahsData = await surahsRes.json();
                setSurahs(surahsData.data || []);
            } catch (e) {
                console.warn('Gagal load surah');
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    // --- LOGIC CHECK AUDIO (OPTIMIZED) ---
    // ✅ OPTIMISASI: Dari 4-5 request menjadi 1 request saja
    const checkAndTriggerAudio = async () => {
        try {
            const res = await fetch(`${getAPIBaseURL()}/api/schedules/check`);
            if (!res.ok) {
                console.warn('❌ Schedule check API error:', res.status);
                return;
            }

            const data = await res.json();
            const { currentDate, currentTime, announcements, quran } = data;

            console.log(`⏰ Schedule Check: ${currentDate} ${currentTime}`);
            console.log(
                `📢 Active Announcements: ${announcements?.length || 0}`,
            );
            console.log(`📖 Active Quran: ${quran?.length || 0}`);

            // Process Quran schedules
            (quran || []).forEach((sch: any) => {
                const turnKey = `quran-${sch.id}-${currentDate}-${currentTime}`;
                if (lastPlayedRef.current !== turnKey) {
                    console.log(
                        '🎵 Playing Quran:',
                        sch.surah_name,
                        sch.audio_url,
                    );
                    lastPlayedRef.current = turnKey;
                    playAutomaticAudio(
                        sch.audio_url,
                        `Murottal ${sch.surah_name}`,
                        sch,
                        'quran',
                    );
                }
            });

            // Process Announcement schedules
            (announcements || []).forEach((sch: any) => {
                if (!sch.announcement) return;
                const turnKey = `ann-${sch.id}-${currentDate}-${currentTime}`;
                if (lastPlayedRef.current !== turnKey) {
                    console.log(
                        '🔊 Playing Announcement:',
                        sch.announcement.title,
                        sch.announcement.audio_url,
                    );
                    lastPlayedRef.current = turnKey;
                    playAutomaticAudio(
                        sch.announcement.audio_url,
                        `Pengumuman: ${sch.announcement.title}`,
                        sch,
                        'announcement',
                    );
                }
            });
        } catch (e) {
            console.warn('Schedule check failed:', e);
        }
    };

    const playAutomaticAudio = (
        url: string,
        title: string,
        scheduleObj: any,
        type: 'quran' | 'announcement',
    ) => {
        if (!url) return;
        if (audioPlayerRef.current) audioPlayerRef.current.pause();

        const audio = new Audio(url);
        audioPlayerRef.current = audio;

        setActiveAudio({ url, title });
        setPlayingSchedule({
            id: scheduleObj.id,
            type,
            repeat_type: scheduleObj.repeat_type,
        });
        setIsPlaying(true);

        audio
            .play()
            .then(() =>
                toast({ title: '🔊 Memutar Otomatis', description: title }),
            )
            .catch(() => console.warn('Browser block autoplay'));

        audio.onended = () => {
            handleCompletion({
                id: scheduleObj.id,
                type,
                repeat_type: scheduleObj.repeat_type,
            });
        };
    };

    const handleCompletion = (scheduleData: {
        id: number;
        type: string;
        repeat_type: string;
    }) => {
        setIsPlaying(false);
        setActiveAudio(null);
        setPlayingSchedule(null);
        processNextCycle(scheduleData.type, scheduleData);
    };

    const audioRefActions = {
        toggle: () => {
            if (!audioPlayerRef.current) return;
            if (isPlaying) {
                audioPlayerRef.current.pause();
                setIsPlaying(false);
            } else {
                audioPlayerRef.current.play();
                setIsPlaying(true);
            }
        },
        unload: () => {
            if (audioPlayerRef.current) audioPlayerRef.current.pause();
            if (playingSchedule) {
                handleCompletion(playingSchedule);
            } else {
                setActiveAudio(null);
                setIsPlaying(false);
            }
        },
    };

    const processNextCycle = async (type: string, schedule: any) => {
        if (schedule.repeat_type === 'once') {
            await handleDelete(type as any, schedule.id);
        } else {
            const nextDate = new Date();
            if (schedule.repeat_type === 'daily')
                nextDate.setDate(nextDate.getDate() + 1);
            if (schedule.repeat_type === 'weekly')
                nextDate.setDate(nextDate.getDate() + 7);
            if (schedule.repeat_type === 'monthly')
                nextDate.setMonth(nextDate.getMonth() + 1);

            const nextDateStr = nextDate.toLocaleDateString('en-CA');
            const endpoint =
                type === 'quran' ? 'quran-schedules' : 'announcement-schedules';

            await fetch(`${getAPIBaseURL()}/api/${endpoint}/${schedule.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: nextDateStr }),
            });
            loadData();
        }
    };

    // --- CRUD HANDLERS ---
    const handleAddAnnouncementSchedule = async () => {
        if (!selectedAnnouncement || !scheduleTime || !scheduleDate) {
            toast({
                title: 'Error',
                description: 'Isi semua data jadwal.',
                variant: 'destructive',
            });
            return;
        }
        try {
            const response = await fetch(
                `${getAPIBaseURL()}/api/announcement-schedules`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        announcement_id: parseInt(selectedAnnouncement),
                        time: scheduleTime,
                        date: scheduleDate,
                        repeat_type: repeatType,
                        is_active: true,
                    }),
                },
            );
            if (response.ok) {
                toast({
                    title: '✅ Berhasil',
                    description: 'Jadwal tersimpan.',
                });
                setShowAnnouncementForm(false);
                loadData();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal menghubungi server.',
                variant: 'destructive',
            });
        }
    };

    const handleAddQuranSchedule = async () => {
        if (!selectedSurah || !scheduleTime || !scheduleDate) {
            toast({
                title: 'Error',
                description: 'Lengkapi data.',
                variant: 'destructive',
            });
            return;
        }
        const surah = surahs.find(
            (s: any) => s.nomor.toString() === selectedSurah,
        );
        if (!surah) return;

        try {
            const quranDetailRes = await fetch(
                `https://equran.id/api/v2/surat/${surah.nomor}`,
            );
            const quranDetailData = await quranDetailRes.json();
            const audioUrl = quranDetailData.data.audioFull[selectedQori];

            const response = await fetch(
                `${getAPIBaseURL()}/api/quran-schedules`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        qori_name:
                            QORI_OPTIONS.find((q) => q.value === selectedQori)
                                ?.label || 'Qori',
                        surah_number: String(surah.nomor),
                        surah_name: surah.namaLatin,
                        audio_url: audioUrl,
                        repeat_type: repeatType,
                        time: scheduleTime,
                        date: scheduleDate,
                        is_active: true,
                    }),
                },
            );

            if (response.ok) {
                toast({
                    title: '✅ Berhasil',
                    description: 'Jadwal Quran tersimpan.',
                });
                setShowQuranForm(false);
                loadData();
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'Server error.',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (type: 'announcement' | 'quran', id: number) => {
        try {
            const endpoint =
                type === 'quran' ? 'quran-schedules' : 'announcement-schedules';
            await fetch(`${getAPIBaseURL()}/api/${endpoint}/${id}`, {
                method: 'DELETE',
            });
            toast({ title: '✅ Berhasil', description: 'Jadwal dihapus' });
            loadData();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'Gagal menghapus',
                variant: 'destructive',
            });
        }
    };

    const renderStatusBadge = (id: number, type: 'quran' | 'announcement') => {
        if (playingSchedule?.id === id && playingSchedule?.type === type) {
            return (
                <Badge className="bg-emerald-600 animate-pulse">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
                </Badge>
            );
        }
        return (
            <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-200"
            >
                <Hourglass className="w-3 h-3 mr-1" /> Menunggu
            </Badge>
        );
    };

    return (
        <div
            className="space-y-8 min-h-screen pb-24 text-left animate-in fade-in duration-500"
            onClick={() => {
                if (!audioPlayerRef.current) {
                    const initAudio = new Audio();
                    initAudio.play().catch(() => {});
                }
            }}
        >
            {/* --- PAGE HEADER --- */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Jadwal</h1>
                <p className="text-gray-600 mt-2">
                    Monitor dan kelola jadwal pengumuman dan Al-Quran
                </p>
            </div>

            {/* --- SECTION 1: JADWAL PENGUMUMAN --- */}
            <Card className="shadow-sm border-emerald-100">
                <CardHeader className="pb-3">
                    {/* RESPONSIVE HEADER: Flex-col on mobile, Flex-row on desktop */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-emerald-600" />
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-800">
                                Jadwal Pengumuman
                            </CardTitle>
                        </div>

                        <Button
                            onClick={() => {
                                setShowAnnouncementForm(!showAnnouncementForm);
                                setShowQuranForm(false);
                            }}
                            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Tambah Jadwal
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* FORM TAMBAH PENGUMUMAN */}
                    {showAnnouncementForm && (
                        <div className="p-4 border rounded-lg bg-gray-50 space-y-3 animate-in slide-in-from-top-2">
                            <div>
                                <Label>Pilih Pengumuman</Label>
                                <Select
                                    value={selectedAnnouncement}
                                    onValueChange={setSelectedAnnouncement}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih audio..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {announcements.map((item) => (
                                            <SelectItem
                                                key={item.id}
                                                value={item.id.toString()}
                                            >
                                                {item.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Pengulangan</Label>
                                <Select
                                    value={repeatType}
                                    onValueChange={setRepeatType}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REPEAT_OPTIONS.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Waktu</Label>
                                    <Input
                                        type="time"
                                        value={scheduleTime}
                                        onChange={(e) =>
                                            setScheduleTime(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal Mulai</Label>
                                    <Input
                                        type="date"
                                        value={scheduleDate}
                                        onChange={(e) =>
                                            setScheduleDate(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-2 pt-2">
                                <Button
                                    onClick={handleAddAnnouncementSchedule}
                                    className="flex-1 bg-emerald-600 text-white"
                                >
                                    Simpan
                                </Button>
                                <Button
                                    onClick={() =>
                                        setShowAnnouncementForm(false)
                                    }
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Batal
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* TABLE RESPONSIVE WRAPPER */}
                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="min-w-[200px]">
                                        Audio
                                    </TableHead>
                                    <TableHead className="min-w-[180px]">
                                        Waktu & Tanggal
                                    </TableHead>
                                    <TableHead className="min-w-[120px]">
                                        Status
                                    </TableHead>
                                    <TableHead className="text-right min-w-[80px]">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {announcementSchedules.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-center text-gray-500 py-8"
                                        >
                                            Belum ada jadwal pengumuman
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    announcementSchedules.map((schedule) => {
                                        const announcement = announcements.find(
                                            (a) =>
                                                a.id ===
                                                schedule.announcement_id,
                                        );
                                        return (
                                            <TableRow
                                                key={schedule.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <TableCell>
                                                    <p className="font-medium text-emerald-900">
                                                        {announcement?.title ||
                                                            'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Ulang:{' '}
                                                        {
                                                            REPEAT_OPTIONS.find(
                                                                (o) =>
                                                                    o.value ===
                                                                    schedule.repeat_type,
                                                            )?.label
                                                        }
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm text-left">
                                                        <span className="font-bold flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-emerald-600" />{' '}
                                                            {schedule.time} WIB
                                                        </span>
                                                        <span className="text-gray-500 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />{' '}
                                                            {schedule.date}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {renderStatusBadge(
                                                        schedule.id,
                                                        'announcement',
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleDelete(
                                                                'announcement',
                                                                schedule.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* --- SECTION 2: JADWAL AL-QURAN --- */}
            <Card className="shadow-sm border-emerald-100">
                <CardHeader className="pb-3">
                    {/* RESPONSIVE HEADER */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Music className="w-5 h-5 text-emerald-600" />
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-800">
                                Jadwal Al-Quran
                            </CardTitle>
                        </div>

                        <Button
                            onClick={() => {
                                setShowQuranForm(!showQuranForm);
                                setShowAnnouncementForm(false);
                            }}
                            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Tambah Jadwal
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* FORM TAMBAH QURAN */}
                    {showQuranForm && (
                        <div className="p-4 border rounded-lg bg-gray-50 space-y-3 animate-in slide-in-from-top-2">
                            <div>
                                <Label>Pilih Surah</Label>
                                <Select
                                    value={selectedSurah}
                                    onValueChange={setSelectedSurah}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih surah..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-80 overflow-y-auto">
                                        {surahs.map((s: any) => (
                                            <SelectItem
                                                key={s.nomor}
                                                value={s.nomor.toString()}
                                            >
                                                {s.nomor}. {s.namaLatin}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Pilih Qori</Label>
                                <Select
                                    value={selectedQori}
                                    onValueChange={setSelectedQori}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Qori..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {QORI_OPTIONS.map((q) => (
                                            <SelectItem
                                                key={q.value}
                                                value={q.value}
                                            >
                                                {q.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Pengulangan</Label>
                                <Select
                                    value={repeatType}
                                    onValueChange={setRepeatType}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REPEAT_OPTIONS.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Waktu</Label>
                                    <Input
                                        type="time"
                                        value={scheduleTime}
                                        onChange={(e) =>
                                            setScheduleTime(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal Mulai</Label>
                                    <Input
                                        type="date"
                                        value={scheduleDate}
                                        onChange={(e) =>
                                            setScheduleDate(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-2 pt-2">
                                <Button
                                    onClick={handleAddQuranSchedule}
                                    className="flex-1 bg-emerald-600 text-white"
                                >
                                    Simpan
                                </Button>
                                <Button
                                    onClick={() => setShowQuranForm(false)}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Batal
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* TABLE RESPONSIVE WRAPPER */}
                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="min-w-[200px]">
                                        Surah & Qori
                                    </TableHead>
                                    <TableHead className="min-w-[180px]">
                                        Waktu & Tanggal
                                    </TableHead>
                                    <TableHead className="min-w-[120px]">
                                        Status
                                    </TableHead>
                                    <TableHead className="text-right min-w-[80px]">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quranSchedules.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-center text-gray-500 py-8"
                                        >
                                            Belum ada jadwal Al-Quran
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    quranSchedules.map((schedule) => (
                                        <TableRow
                                            key={schedule.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <TableCell>
                                                <p className="font-medium text-emerald-900">
                                                    {schedule.surah_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {schedule.qori_name}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm text-left">
                                                    <span className="font-bold flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-emerald-600" />{' '}
                                                        {schedule.time} WIB
                                                    </span>
                                                    <span className="text-gray-500 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />{' '}
                                                        {schedule.date || '-'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {renderStatusBadge(
                                                    schedule.id,
                                                    'quran',
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        handleDelete(
                                                            'quran',
                                                            schedule.id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* --- ACTIVE AUDIO PLAYER (FIXED BOTTOM) --- */}
            {activeAudio && (
                <div className="fixed bottom-4 left-0 right-0 flex justify-center px-4 z-[10000]">
                    <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm border-emerald-100 shadow-2xl animate-in slide-in-from-bottom-10">
                        <CardContent className="p-4 flex items-center justify-between text-left">
                            <div className="flex items-center space-x-4 overflow-hidden">
                                <div className="p-3 bg-emerald-600 rounded-full text-white animate-pulse flex-shrink-0">
                                    <Volume2 className="w-6 h-6" />
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">
                                        {activeAudio.title}
                                    </p>
                                    <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">
                                        Sedang Diputar Otomatis
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={audioRefActions.toggle}
                                    className="hover:bg-emerald-50 text-emerald-600"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-5 h-5" />
                                    ) : (
                                        <Play className="w-5 h-5 ml-1" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={audioRefActions.unload}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
