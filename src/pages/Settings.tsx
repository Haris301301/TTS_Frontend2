import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Save } from 'lucide-react';

// ✅ PERBAIKAN: Menggunakan localStorage untuk menyimpan settings (tanpa SDK)
const SETTINGS_KEY = 'app_settings';

interface AppSettings {
    volume: number;
    timezone: string;
    auto_play_enabled: boolean;
    default_qori: string;
}

const defaultSettings: AppSettings = {
    volume: 80,
    timezone: 'Asia/Jakarta',
    auto_play_enabled: true,
    default_qori: 'Mishari Rashid Alafasy',
};

export default function Settings() {
    const [volume, setVolume] = useState(80);
    const [timezone, setTimezone] = useState('Asia/Jakarta');
    const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = () => {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (saved) {
                const settings: AppSettings = JSON.parse(saved);
                setVolume(settings.volume ?? 80);
                setTimezone(settings.timezone ?? 'Asia/Jakarta');
                setAutoPlayEnabled(settings.auto_play_enabled !== false);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const handleSaveSettings = () => {
        try {
            const settingsData: AppSettings = {
                volume,
                timezone,
                auto_play_enabled: autoPlayEnabled,
                default_qori: 'Mishari Rashid Alafasy',
            };

            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsData));

            toast({
                title: '✅ Berhasil',
                description: 'Pengaturan berhasil disimpan',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Gagal menyimpan pengaturan',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
                <p className="text-gray-600 mt-2">
                    Kelola pengaturan umum aplikasi
                </p>
            </div>

            <div className="max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <SettingsIcon className="w-6 h-6 text-emerald-600" />
                            <span>Pengaturan Umum</span>
                        </CardTitle>
                        <CardDescription>
                            Konfigurasi pengaturan aplikasi
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="volume">
                                    Volume ({volume}%)
                                </Label>
                                <Input
                                    id="volume"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={volume}
                                    onChange={(e) =>
                                        setVolume(parseInt(e.target.value))
                                    }
                                    className="mt-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Atur volume audio default
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="timezone">Zona Waktu</Label>
                                <Select
                                    value={timezone}
                                    onValueChange={setTimezone}
                                >
                                    <SelectTrigger id="timezone">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Asia/Jakarta">
                                            WIB (Jakarta)
                                        </SelectItem>
                                        <SelectItem value="Asia/Makassar">
                                            WITA (Makassar)
                                        </SelectItem>
                                        <SelectItem value="Asia/Jayapura">
                                            WIT (Jayapura)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Pilih zona waktu untuk jadwal
                                </p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <Label
                                        htmlFor="autoplay"
                                        className="text-base font-medium"
                                    >
                                        Auto-play
                                    </Label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Aktifkan pemutaran otomatis sesuai
                                        jadwal
                                    </p>
                                </div>
                                <Switch
                                    id="autoplay"
                                    checked={autoPlayEnabled}
                                    onCheckedChange={setAutoPlayEnabled}
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSaveSettings}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Simpan Pengaturan
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
