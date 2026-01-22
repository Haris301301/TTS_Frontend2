import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, Pause, Play, SkipBack, SkipForward, X, Repeat1 } from 'lucide-react';

interface AudioPlayerProps {
  activeAudioName: string;
  isPlaying: boolean;
  isRepeat: boolean;
  isAutoNext: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onClose: () => void;
  onTogglePlay: () => void;
  onToggleRepeat: () => void;
  onToggleAutoNext: () => void;
  onSeek: (value: number[]) => void;
  onVolumeChange: (value: number[]) => void;
  formatTime: (time: number) => string;
  onSkipNext: () => void;
}

export const AudioPlayer = ({
  activeAudioName, isPlaying, isRepeat, isAutoNext,
  currentTime, duration, volume, onClose, onTogglePlay,
  onToggleRepeat, onToggleAutoNext, onSeek, onVolumeChange,
  formatTime, onSkipNext
}: AudioPlayerProps) => {
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-[9999]">
      <div className="relative w-full max-w-5xl bg-white border-2 border-emerald-100 shadow-2xl rounded-3xl p-5 animate-in slide-in-from-bottom-10">
        <Button 
          size="icon" variant="ghost" 
          className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white border shadow-md text-gray-400 hover:text-red-500" 
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
        
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-4 w-full md:w-1/4 text-left border-b md:border-none pb-2 md:pb-0">
            <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-200"><Volume2 className="w-6 h-6" /></div>
            <div className="truncate">
              <p className="text-base font-extrabold text-gray-900 truncate">{activeAudioName}</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Sedang Diputar</p>
            </div>
          </div>

          <div className="flex flex-col flex-1 w-full gap-2">
            <div className="flex items-center justify-center gap-4 sm:gap-8">
              {/* TOMBOL REPEAT */}
              <Button 
                variant="ghost" 
                className={`h-12 w-12 rounded-full flex flex-col items-center justify-center transition-all ${isRepeat ? 'text-emerald-600 bg-emerald-100 border-2 border-emerald-500' : 'text-gray-400 border border-gray-200'}`} 
                onClick={onToggleRepeat}
              >
                <Repeat1 className="w-6 h-6" />
                <span className="text-[8px] font-bold">REP</span>
              </Button>
              
              <Button size="icon" variant="ghost" className="text-gray-400"><SkipBack className="w-6 h-6 fill-current" /></Button>
              
              <Button size="icon" className="bg-emerald-600 hover:bg-emerald-700 h-14 w-14 rounded-full shadow-xl shadow-emerald-100 transition-transform active:scale-95" onClick={onTogglePlay}>
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1 fill-current" />}
              </Button>
              
              <Button size="icon" variant="ghost" className="text-gray-400 hover:text-emerald-600" onClick={onSkipNext}><SkipForward className="w-6 h-6 fill-current" /></Button>

              {/* TOMBOL AUTO NEXT */}
              <Button 
                variant="ghost" 
                className={`h-12 w-12 rounded-full flex flex-col items-center justify-center transition-all ${isAutoNext ? 'text-emerald-600 bg-emerald-100 border-2 border-emerald-500' : 'text-gray-400 border border-gray-200'}`} 
                onClick={onToggleAutoNext}
              >
                <SkipForward className="w-5 h-5" />
                <span className="text-[8px] font-bold">NEXT</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-4 text-[11px] text-gray-500 font-bold px-2">
              <span className="w-12 text-right tabular-nums">{formatTime(currentTime)}</span>
              <Slider max={duration || 100} step={0.1} value={[currentTime]} onValueChange={onSeek} className="flex-1 cursor-pointer" />
              <span className="w-12 tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 w-1/4 justify-end">
            <Volume2 className="w-5 h-5 text-gray-400" />
            <Slider max={1} step={0.01} value={[volume]} onValueChange={onVolumeChange} className="w-28" />
          </div>
        </div>
      </div>
    </div>
  );
};