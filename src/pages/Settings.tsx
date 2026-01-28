import { useState, useEffect } from 'react';
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

export default function Settings() {
    const [settings, setSettings] = useState<any>(null);
    const [volume, setVolume] = useState(80);
    const [timezone, setTimezone] = useState('Asia/Jakarta');
    const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await client.entities.settings.query({
                query: {},
                limit: 1,
            });

            if (response.data.items && response.data.items.length > 0) {
                const userSettings = response.data.items[0];
                setSettings(userSettings);
                setVolume(userSettings.volume || 80);
                setTimezone(userSettings.timezone || 'Asia/Jakarta');
                setAutoPlayEnabled(userSettings.auto_play_enabled !== false);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const handleSaveSettings = async () => {
        try {
            const settingsData = {
                volume,
                timezone,
                auto_play_enabled: autoPlayEnabled,
                updated_at: new Date().toISOString(),
            };

            if (settings) {
                await client.entities.settings.update({
                    id: settings.id.toString(),
                    data: settingsData,
                });
            } else {
                await client.entities.settings.create({
                    data: {
                        ...settingsData,
                        default_qori: 'Mishari Rashid Alafasy',
                        created_at: new Date().toISOString(),
                    },
                });
            }

            toast({
                title: '✅ Berhasil',
                description: 'Pengaturan berhasil disimpan',
            });

            loadSettings();
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
