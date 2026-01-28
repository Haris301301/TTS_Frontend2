import { useState, useRef, useEffect } from 'react';
import { client } from '@/lib/api';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Mic, Upload, Play, Trash2, Calendar } from 'lucide-react';

const REPEAT_OPTIONS = [
    { value: 'daily', label: 'Setiap Hari' },
    { value: 'weekly', label: 'Per Minggu' },
    { value: 'monthly', label: 'Per Bulan' },
];

const DAYS = [
    { value: 'monday', label: 'Senin' },
    { value: 'tuesday', label: 'Selasa' },
    { value: 'wednesday', label: 'Rabu' },
    { value: 'thursday', label: 'Kamis' },
    { value: 'friday', label: 'Jumat' },
    { value: 'saturday', label: 'Sabtu' },
    { value: 'sunday', label: 'Minggu' },
];

export default function Announcement() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Schedule form
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [selectedAnnouncementId, setSelectedAnnouncementId] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [repeatType, setRepeatType] = useState('daily');
    const [selectedDay, setSelectedDay] = useState('monday');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const handleGenerateTTS = async () => {
        if (!title.trim() || !message.trim()) {
            toast({
                title: 'Error',
                description: 'Judul dan pesan harus diisi',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            await client.entities.announcements.create({
                data: {
                    title,
                    message,
                    audio_type: 'generated',
                    audio_url: 'tts_generated',
                    created_at: new Date().toISOString(),
                },
            });

            toast({
                title: 'Berhasil',
                description: 'Pengumuman berhasil dibuat dengan audio TTS',
            });

            setTitle('');
            setMessage('');
            loadAnnouncements();
        } catch (error: any) {
            const detail =
                error?.data?.detail ||
                error?.response?.data?.detail ||
                error.message;
            toast({
                title: 'Error',
                description: detail,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUploadAudio = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('audio/')) {
            toast({
                title: 'Error',
                description: 'File harus berupa audio MP3',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            const uploadUrlResponse = await client.apiCall.invoke({
                url: '/api/v1/storage/upload-url',
                method: 'POST',
                data: {
                    bucket_name: 'audio-files',
                    object_key: `announcements/${Date.now()}_${file.name}`,
                },
            });

            await fetch(uploadUrlResponse.data.upload_url, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            await client.entities.announcements.create({
                data: {
                    title: file.name,
                    message: 'Audio yang diupload',
                    audio_type: 'uploaded',
                    audio_url: `announcements/${Date.now()}_${file.name}`,
                    created_at: new Date().toISOString(),
                },
            });

            toast({
                title: 'Berhasil',
                description: 'Audio berhasil diupload',
            });

            loadAnnouncements();
        } catch (error: any) {
            const detail =
                error?.data?.detail ||
                error?.response?.data?.detail ||
                error.message;
            toast({
                title: 'Error',
                description: detail,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const loadAnnouncements = async () => {
        try {
            const response = await client.entities.announcements.query({
                query: {},
                sort: '-created_at',
                limit: 20,
            });
            setAnnouncements(response.data.items || []);
        } catch (error) {
            console.error('Failed to load announcements:', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await client.entities.announcements.delete({ id: id.toString() });
            toast({
                title: 'Berhasil',
                description: 'Pengumuman berhasil dihapus',
            });
            loadAnnouncements();
        } catch (error: any) {
            const detail =
                error?.data?.detail ||
                error?.response?.data?.detail ||
                error.message;
            toast({
                title: 'Error',
                description: detail,
                variant: 'destructive',
            });
        }
    };

    const handleAddSchedule = async () => {
        if (!selectedAnnouncementId || !scheduleDate || !scheduleTime) {
            toast({
                title: 'Error',
                description: 'Semua field jadwal harus diisi',
                variant: 'destructive',
            });
            return;
        }

        try {
            await client.entities.announcement_schedules.create({
                data: {
                    announcement_id: parseInt(selectedAnnouncementId),
                    day_of_week:
                        repeatType === 'weekly' ? selectedDay : 'daily',
                    time: scheduleTime,
                    is_active: true,
                    created_at: new Date().toISOString(),
                },
            });

            toast({
                title: 'Berhasil',
                description: 'Jadwal pengumuman berhasil ditambahkan',
            });

            setShowScheduleForm(false);
            setSelectedAnnouncementId('');
            setScheduleDate('');
            setScheduleTime('');
        } catch (error: any) {
            const detail =
                error?.data?.detail ||
                error?.response?.data?.detail ||
                error.message;
            toast({
                title: 'Error',
                description: detail,
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Pengumuman</h1>
                <p className="text-gray-600 mt-2">
                    Kelola pengumuman dengan text-to-speech atau upload audio
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Mic className="w-6 h-6 text-emerald-600" />
                                <span>Buat Pengumuman Baru</span>
                            </CardTitle>
                            <CardDescription>
                                Generate audio dari teks atau upload file MP3
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="title">
                                        Judul Pengumuman
                                    </Label>
                                    <Input
                                        id="title"
                                        placeholder="Masukkan judul..."
                                        value={title}
                                        onChange={(e) =>
                                            setTitle(e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="message">Pesan</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Masukkan pesan pengumuman..."
                                        rows={6}
                                        value={message}
                                        onChange={(e) =>
                                            setMessage(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={handleGenerateTTS}
                                        disabled={loading}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <Mic className="w-4 h-4 mr-2" />
                                        Generate Audio
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        disabled={loading}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload MP3
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="audio/*"
                                        className="hidden"
                                        onChange={handleUploadAudio}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Calendar className="w-5 h-5 text-emerald-600" />
                                <span>Jadwalkan</span>
                            </CardTitle>
                            <CardDescription>
                                Atur jadwal pengumuman
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!showScheduleForm ? (
                                <Button
                                    onClick={() => setShowScheduleForm(true)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Tambah Jadwal
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <Label>Pilih Pengumuman</Label>
                                        <Select
                                            value={selectedAnnouncementId}
                                            onValueChange={
                                                setSelectedAnnouncementId
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih..." />
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

                                    {repeatType === 'weekly' && (
                                        <div>
                                            <Label>Hari</Label>
                                            <Select
                                                value={selectedDay}
                                                onValueChange={setSelectedDay}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DAYS.map((day) => (
                                                        <SelectItem
                                                            key={day.value}
                                                            value={day.value}
                                                        >
                                                            {day.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div>
                                        <Label>Tanggal</Label>
                                        <Input
                                            type="date"
                                            value={scheduleDate}
                                            onChange={(e) =>
                                                setScheduleDate(e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label>Waktu</Label>
                                        <Input
                                            type="time"
                                            value={scheduleTime}
                                            onChange={(e) =>
                                                setScheduleTime(e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={handleAddSchedule}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            Simpan
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                setShowScheduleForm(false)
                                            }
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Batal
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pengumuman</CardTitle>
                    <CardDescription>
                        Semua pengumuman yang telah dibuat
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {announcements.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                                Belum ada pengumuman
                            </p>
                        ) : (
                            announcements.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            {item.title}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {item.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {item.audio_type === 'generated'
                                                ? 'TTS Generated'
                                                : 'Uploaded'}{' '}
                                            •{' '}
                                            {new Date(
                                                item.created_at,
                                            ).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button size="sm" variant="ghost">
                                            <Play className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                handleDelete(item.id)
                                            }
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
