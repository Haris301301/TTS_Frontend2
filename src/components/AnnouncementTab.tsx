import { useState, useRef, useEffect } from 'react';
import { getAPIBaseURL } from '@/lib/config';
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
import { useToast } from '@/hooks/use-toast';
import { Mic, Upload, Play, Trash2, Pause, FolderOpen } from 'lucide-react';

export default function AnnouncementTab() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [previewAudio, setPreviewAudio] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            const response = await fetch(
                `${getAPIBaseURL()}/api/announcements`,
            );
            const data = await response.json();
            if (data.success) {
                setAnnouncements(data.items);
            }
        } catch (error) {
            console.error('Gagal mengambil data dari server 8000');
        }
    };

    const handleGenerateTTS = async () => {
        if (!title.trim() || !message.trim()) {
            toast({
                title: 'Data Tidak Lengkap',
                description: 'Judul dan Pesan wajib diisi untuk TTS',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${getAPIBaseURL()}/api/tts/generate`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: message, title: title }),
                },
            );

            const result = await response.json();

            if (result.success) {
                setPreviewAudio(result.audioUrl);
                toast({
                    title: '✅ Berhasil',
                    description: 'Audio TTS disimpan di server',
                });
                setTitle('');
                setMessage('');
                loadAnnouncements();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Koneksi backend 8000 gagal',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setSelectedFile(file);
        const fileUrl = URL.createObjectURL(file);
        setPreviewAudio(fileUrl);
        toast({
            title: 'File Terpilih',
            description: 'Silakan isi Judul lalu klik Simpan ke Daftar',
        });
    };

    const handleUploadFinal = async () => {
        if (!title.trim()) {
            toast({
                title: 'Judul Wajib Diisi',
                description: 'Berikan judul untuk file yang diupload',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('audio', selectedFile!);
        formData.append('title', title);

        try {
            const response = await fetch(`${getAPIBaseURL()}/api/tts/upload`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                toast({
                    title: '✅ Berhasil',
                    description: 'File MP3 berhasil ditambahkan ke daftar',
                });
                setTitle('');
                setSelectedFile(null);
                setPreviewAudio('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                loadAnnouncements();
            }
        } catch (error) {
            toast({
                title: 'Gagal Upload',
                description: 'Pastikan backend port 8000 menyala',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePlayPause = async (id: number, audioUrl: string) => {
        if (playingId === id) {
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.play();
                setPlayingId(id);
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (
            !window.confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')
        )
            return;

        try {
            const response = await fetch(
                `${getAPIBaseURL()}/api/announcements/${id}`,
                {
                    method: 'DELETE',
                },
            );

            const result = await response.json();

            if (result.success) {
                toast({
                    title: '✅ Berhasil',
                    description: 'Audio telah dihapus',
                });
                loadAnnouncements();
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Gagal menghapus data',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-6">
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
                            <Label htmlFor="title">Judul Pengumuman</Label>
                            <Input
                                id="title"
                                placeholder="Masukkan judul..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="message">
                                Pesan (Hanya untuk TTS)
                            </Label>
                            <Textarea
                                id="message"
                                placeholder="Masukkan pesan pengumuman..."
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={!!selectedFile}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <Button
                                onClick={handleGenerateTTS}
                                disabled={loading || !!selectedFile}
                                className="bg-emerald-600 hover:bg-emerald-700 h-12 flex items-center justify-center gap-2"
                            >
                                <Mic className="w-5 h-5" />
                                Generate Audio
                            </Button>

                            <div className="relative">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <Button
                                    onClick={
                                        selectedFile
                                            ? handleUploadFinal
                                            : () =>
                                                  fileInputRef.current?.click()
                                    }
                                    disabled={loading}
                                    variant={
                                        selectedFile ? 'default' : 'outline'
                                    }
                                    className={
                                        selectedFile
                                            ? 'w-full h-12 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2'
                                            : 'w-full h-12 border-emerald-600 text-emerald-600 flex items-center justify-center gap-2'
                                    }
                                >
                                    <FolderOpen className="w-5 h-5" />
                                    {selectedFile
                                        ? 'Simpan ke Daftar'
                                        : 'Upload MP3'}
                                </Button>
                            </div>
                        </div>

                        {previewAudio && (
                            <div className="border-t pt-4">
                                <Label className="mb-2 block font-bold text-emerald-700">
                                    Preview Audio
                                </Label>
                                <audio
                                    controls
                                    className="w-full"
                                    src={previewAudio}
                                >
                                    Browser Anda tidak mendukung audio player.
                                </audio>
                                {selectedFile && (
                                    <p className="text-xs text-blue-600 mt-2 italic">
                                        * File siap diupload:{' '}
                                        {selectedFile.name}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

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
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-100"
                                >
                                    <div className="flex items-center space-x-4 flex-1">
                                        {/* LOGIKA ICON DINAMIS: Mic untuk sumber TTS, Folder untuk sumber Upload */}
                                        <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                                            {item.audio_type === 'generated' ? (
                                                <Mic className="w-5 h-5" />
                                            ) : (
                                                <FolderOpen className="w-5 h-5" />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <p className="font-bold text-emerald-900">
                                                {item.title}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {item.message || 'File Audio'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {item.audio_type === 'generated'
                                                    ? '🎙️ TTS Indonesia'
                                                    : 'Uploaded MP3'}{' '}
                                                •{' '}
                                                {new Date(
                                                    item.created_at,
                                                ).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex space-x-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className={
                                                playingId === item.id
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                    : ''
                                            }
                                            onClick={() =>
                                                handlePlayPause(
                                                    item.id,
                                                    item.audio_url,
                                                )
                                            }
                                        >
                                            {playingId === item.id ? (
                                                <Pause className="w-4 h-4" />
                                            ) : (
                                                <Play className="w-4 h-4" />
                                            )}
                                        </Button>

                                        {/* PERBAIKAN: Tombol hapus hanya satu (tidak double) */}
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

            <audio
                ref={audioRef}
                className="hidden"
                onEnded={() => setPlayingId(null)}
            />
        </div>
    );
}
