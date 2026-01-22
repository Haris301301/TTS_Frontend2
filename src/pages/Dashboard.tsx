import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, BookOpen } from 'lucide-react';
import AnnouncementTab from '@/components/AnnouncementTab';
import QuranTab from '@/components/QuranTab';
import { createClient } from '@metagptx/web-sdk'; // Tambahkan SDK

const client = createClient();

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('announcement');

  // Opsional: Memastikan user masih login saat Dashboard dimuat
  useEffect(() => {
    const checkSession = async () => {
      try {
        await client.auth.me();
      } catch (err) {
        console.error("Sesi berakhir");
      }
    };
    checkSession();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Kelola pengumuman dan jadwal Al-Quran</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="announcement" className="flex items-center space-x-2">
            <Mic className="w-4 h-4" />
            <span>Pengumuman</span>
          </TabsTrigger>
          <TabsTrigger value="quran" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Al-Quran</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcement" className="mt-6">
          <AnnouncementTab />
        </TabsContent>

        <TabsContent value="quran" className="mt-6">
          <QuranTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}