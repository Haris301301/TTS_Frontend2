import { useState, useRef } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mic, Upload, Play, Trash2 } from 'lucide-react';

const client = createClient();

export default function AnnouncementSection() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      // Create announcement with generated audio
      const response = await client.entities.announcements.create({
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
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Error',
        description: detail,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Get upload URL
      const uploadUrlResponse = await client.apiCall.invoke({
        url: '/api/v1/storage/upload-url',
        method: 'POST',
        data: {
          bucket_name: 'audio-files',
          object_key: `announcements/${Date.now()}_${file.name}`,
        },
      });

      // Upload file
      await fetch(uploadUrlResponse.data.upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // Create announcement
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
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
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
        limit: 10,
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
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Error',
        description: detail,
        variant: 'destructive',
      });
    }
  };

  useState(() => {
    loadAnnouncements();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mic className="w-6 h-6 text-emerald-600" />
          <span>Pengumuman</span>
        </CardTitle>
        <CardDescription>Buat pengumuman dengan text-to-speech atau upload audio</CardDescription>
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
            <Label htmlFor="message">Pesan</Label>
            <Textarea
              id="message"
              placeholder="Masukkan pesan pengumuman..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
              onClick={() => fileInputRef.current?.click()}
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

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Daftar Audio</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Belum ada pengumuman</p>
            ) : (
              announcements.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.audio_type === 'generated' ? 'TTS' : 'Uploaded'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="ghost">
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}