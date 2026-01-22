import { useState, useEffect } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Play, Filter } from 'lucide-react';

const client = createClient();

interface Surah {
  nomor: number;
  nama: string;
  nama_latin: string;
  jumlah_ayat: number;
  audio: string;
}

export default function QuranSection() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<string>('');
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadSurahs();
  }, []);

  const loadSurahs = async () => {
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/quran/surahs',
        method: 'GET',
        data: {},
      });
      setSurahs(response.data.data || []);
      setFilteredSurahs(response.data.data || []);
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Error',
        description: detail,
        variant: 'destructive',
      });
    }
  };

  const handlePlaySurah = async (surahNumber: string) => {
    setLoading(true);
    try {
      const response = await client.apiCall.invoke({
        url: `/api/v1/quran/surah/${surahNumber}`,
        method: 'GET',
        data: {},
      });
      
      const surahData = response.data.data;
      setAudioUrl(surahData.audio);
      
      toast({
        title: 'Berhasil',
        description: `Memutar ${surahData.nama_latin}`,
      });
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

  const handleFilter = (searchTerm: string) => {
    if (!searchTerm) {
      setFilteredSurahs(surahs);
      return;
    }
    const filtered = surahs.filter(
      (surah) =>
        surah.nama_latin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        surah.nama.includes(searchTerm)
    );
    setFilteredSurahs(filtered);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-emerald-600" />
          <span>Al-Quran</span>
        </CardTitle>
        <CardDescription>Pilih dan putar surah Al-Quran</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label htmlFor="surah-select">Pilih Surah</Label>
            <Select value={selectedSurah} onValueChange={setSelectedSurah}>
              <SelectTrigger id="surah-select">
                <SelectValue placeholder="Pilih surah..." />
              </SelectTrigger>
              <SelectContent>
                {filteredSurahs.map((surah) => (
                  <SelectItem key={surah.nomor} value={surah.nomor.toString()}>
                    {surah.nomor}. {surah.nama_latin} ({surah.nama})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => selectedSurah && handlePlaySurah(selectedSurah)}
              disabled={!selectedSurah || loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Putar Surah
            </Button>
          </div>
        </div>

        {audioUrl && (
          <div className="border-t pt-4">
            <Label className="mb-2 block">Audio Player</Label>
            <audio controls className="w-full" src={audioUrl}>
              Browser Anda tidak mendukung audio player.
            </audio>
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Daftar Surah
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredSurahs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Memuat data...</p>
            ) : (
              filteredSurahs.slice(0, 10).map((surah) => (
                <div
                  key={surah.nomor}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => setSelectedSurah(surah.nomor.toString())}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {surah.nomor}. {surah.nama_latin}
                    </p>
                    <p className="text-xs text-gray-500">
                      {surah.nama} - {surah.jumlah_ayat} ayat
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySurah(surah.nomor.toString());
                    }}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}