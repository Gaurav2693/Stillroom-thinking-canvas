import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playClick: () => void;
  playLaserShot: () => void;
  playGameAction: () => void;
  playThunder: () => void;
  startRain: () => void;
  stopRain: () => void;
  startWeatherAmbient: (weatherType: string) => void;
  stopWeatherAmbient: () => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolumeState] = useState(1.0); // Default 100% - LOUD by default

  useEffect(() => {
    const savedPreference = localStorage.getItem('soundEnabled');
    if (savedPreference !== null) {
      setSoundEnabled(savedPreference === 'true');
    }
    
    const savedVolume = localStorage.getItem('soundVolume');
    if (savedVolume !== null) {
      setVolumeState(parseFloat(savedVolume));
    }
  }, []);

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    localStorage.setItem('soundVolume', String(newVolume));
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem('soundEnabled', String(newValue));
      return newValue;
    });
  };

  const playClick = () => {
    if (!soundEnabled || volume === 0) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create noise buffer for click sound - Extended for more punch
      const bufferSize = audioContext.sampleRate * 0.08; // 80ms for smoother tail
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate white noise with smooth exponential decay
      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (bufferSize * 0.2)); // Smoother decay curve
        data[i] = (Math.random() * 2 - 1) * decay * 0.5; // Increased amplitude
      }
      
      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = buffer;
      
      // High-pass filter to make it sound more "clicky" and premium
      const filter = audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800; // Slightly lower for warmer tone
      filter.Q.value = 1.5; // Add resonance for character
      
      const gainNode = audioContext.createGain();
      const adjustedVolume = 0.75 * volume; // Much louder base volume
      gainNode.gain.setValueAtTime(adjustedVolume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08); // Smooth fade
      
      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      noiseSource.start(audioContext.currentTime);
      noiseSource.stop(audioContext.currentTime + 0.08);
      
      // Clean up after sound finishes
      setTimeout(() => {
        audioContext.close();
      }, 100);
    } catch (error) {
      // Silent fail for audio errors
    }
  };

  const playLaserShot = () => {
    if (!soundEnabled || volume === 0) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create oscillator for laser-like sound
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sawtooth'; // Harsh, synthetic tone
      
      // Frequency sweep from high to low (laser zap)
      oscillator.frequency.setValueAtTime(2800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15);
      
      // Add noise for texture
      const bufferSize = audioContext.sampleRate * 0.15;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (bufferSize * 0.3));
        data[i] = (Math.random() * 2 - 1) * decay * 0.4; // Increased amplitude
      }
      
      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = buffer;
      
      // Band-pass filter for laser character
      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 3;
      
      const gainNode = audioContext.createGain();
      const adjustedVolume = 1.2 * volume; // MUCH LOUDER
      gainNode.gain.setValueAtTime(adjustedVolume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
      
      // Mix oscillator and noise
      oscillator.connect(filter);
      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
      noiseSource.start(audioContext.currentTime);
      noiseSource.stop(audioContext.currentTime + 0.15);
      
      setTimeout(() => {
        audioContext.close();
      }, 200);
    } catch (error) {
      console.error('Laser sound error:', error);
    }
  };

  const playGameAction = () => {
    if (!soundEnabled || volume === 0) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Short, sharp click for game actions
      const bufferSize = audioContext.sampleRate * 0.05; // 50ms
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate crisp noise burst
      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (bufferSize * 0.15));
        data[i] = (Math.random() * 2 - 1) * decay * 0.8; // Increased amplitude
      }
      
      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = buffer;
      
      // High-pass for crisp attack
      const filter = audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2200;
      filter.Q.value = 2;
      
      const gainNode = audioContext.createGain();
      const adjustedVolume = 1.0 * volume; // MUCH LOUDER
      gainNode.gain.setValueAtTime(adjustedVolume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
      
      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      noiseSource.start(audioContext.currentTime);
      noiseSource.stop(audioContext.currentTime + 0.05);
      
      setTimeout(() => {
        audioContext.close();
      }, 80);
    } catch (error) {
      console.error('Game action sound error:', error);
    }
  };

  const playThunder = () => {
    if (!soundEnabled || volume === 0) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create noise buffer for thunder sound
      const bufferSize = audioContext.sampleRate * 0.5; // 500ms
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate white noise with smooth exponential decay
      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (bufferSize * 0.1)); // Smoother decay curve
        data[i] = (Math.random() * 2 - 1) * decay * 0.5; // Increased amplitude
      }
      
      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = buffer;
      
      // Low-pass filter to make it sound more "thunderous"
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000; // Lower for thunderous tone
      filter.Q.value = 1.5; // Add resonance for character
      
      const gainNode = audioContext.createGain();
      const adjustedVolume = 1.5 * volume; // Much louder base volume
      gainNode.gain.setValueAtTime(adjustedVolume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5); // Smooth fade
      
      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      noiseSource.start(audioContext.currentTime);
      noiseSource.stop(audioContext.currentTime + 0.5);
      
      // Clean up after sound finishes
      setTimeout(() => {
        audioContext.close();
      }, 600);
    } catch (error) {
      // Silent fail for audio errors
    }
  };

  const rainAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  let rainOscillator: OscillatorNode | null = null;
  let rainGainNode: GainNode | null = null;

  const startRain = () => {
    if (!soundEnabled || volume === 0) return;
    
    try {
      if (rainOscillator) return; // Already playing rain
      
      rainOscillator = rainAudioContext.createOscillator();
      rainOscillator.type = 'sine'; // Smooth, continuous sound
      
      // Frequency sweep from low to high (rain effect)
      rainOscillator.frequency.setValueAtTime(200, rainAudioContext.currentTime);
      rainOscillator.frequency.exponentialRampToValueAtTime(400, rainAudioContext.currentTime + 0.15);
      
      // Add noise for texture
      const bufferSize = rainAudioContext.sampleRate * 0.15;
      const buffer = rainAudioContext.createBuffer(1, bufferSize, rainAudioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (bufferSize * 0.3));
        data[i] = (Math.random() * 2 - 1) * decay * 0.4; // Increased amplitude
      }
      
      const noiseSource = rainAudioContext.createBufferSource();
      noiseSource.buffer = buffer;
      
      // Band-pass filter for rain character
      const filter = rainAudioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 3;
      
      rainGainNode = rainAudioContext.createGain();
      const adjustedVolume = 0.5 * volume; // Much louder base volume
      rainGainNode.gain.setValueAtTime(adjustedVolume, rainAudioContext.currentTime);
      
      // Mix oscillator and noise
      rainOscillator.connect(filter);
      noiseSource.connect(filter);
      filter.connect(rainGainNode);
      rainGainNode.connect(rainAudioContext.destination);
      
      rainOscillator.start(rainAudioContext.currentTime);
      noiseSource.start(rainAudioContext.currentTime);
    } catch (error) {
      console.error('Rain sound error:', error);
    }
  };

  const stopRain = () => {
    if (!rainOscillator || !rainGainNode) return;
    
    try {
      rainGainNode.gain.exponentialRampToValueAtTime(0.001, rainAudioContext.currentTime + 0.5); // Smooth fade
      
      rainOscillator.stop(rainAudioContext.currentTime + 0.5);
      rainOscillator = null;
      rainGainNode = null;
      
      setTimeout(() => {
        rainAudioContext.close();
      }, 600);
    } catch (error) {
      console.error('Stop rain sound error:', error);
    }
  };

  const weatherAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  let weatherOscillator: OscillatorNode | null = null;
  let weatherGainNode: GainNode | null = null;

  const startWeatherAmbient = (weatherType: string) => {
    if (!soundEnabled || volume === 0) return;
    
    try {
      if (weatherOscillator) return; // Already playing weather
      
      weatherOscillator = weatherAudioContext.createOscillator();
      weatherOscillator.type = 'sine'; // Smooth, continuous sound
      
      // Frequency sweep from low to high (weather effect)
      weatherOscillator.frequency.setValueAtTime(200, weatherAudioContext.currentTime);
      weatherOscillator.frequency.exponentialRampToValueAtTime(400, weatherAudioContext.currentTime + 0.15);
      
      // Add noise for texture
      const bufferSize = weatherAudioContext.sampleRate * 0.15;
      const buffer = weatherAudioContext.createBuffer(1, bufferSize, weatherAudioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (bufferSize * 0.3));
        data[i] = (Math.random() * 2 - 1) * decay * 0.4; // Increased amplitude
      }
      
      const noiseSource = weatherAudioContext.createBufferSource();
      noiseSource.buffer = buffer;
      
      // Band-pass filter for weather character
      const filter = weatherAudioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 3;
      
      weatherGainNode = weatherAudioContext.createGain();
      const adjustedVolume = 0.5 * volume; // Much louder base volume
      weatherGainNode.gain.setValueAtTime(adjustedVolume, weatherAudioContext.currentTime);
      
      // Mix oscillator and noise
      weatherOscillator.connect(filter);
      noiseSource.connect(filter);
      filter.connect(weatherGainNode);
      weatherGainNode.connect(weatherAudioContext.destination);
      
      weatherOscillator.start(weatherAudioContext.currentTime);
      noiseSource.start(weatherAudioContext.currentTime);
    } catch (error) {
      console.error('Weather sound error:', error);
    }
  };

  const stopWeatherAmbient = () => {
    if (!weatherOscillator || !weatherGainNode) return;
    
    try {
      weatherGainNode.gain.exponentialRampToValueAtTime(0.001, weatherAudioContext.currentTime + 0.5); // Smooth fade
      
      weatherOscillator.stop(weatherAudioContext.currentTime + 0.5);
      weatherOscillator = null;
      weatherGainNode = null;
      
      setTimeout(() => {
        weatherAudioContext.close();
      }, 600);
    } catch (error) {
      console.error('Stop weather sound error:', error);
    }
  };

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playClick, playLaserShot, playGameAction, playThunder, startRain, stopRain, startWeatherAmbient, stopWeatherAmbient, volume, setVolume }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    // Return safe defaults during hot reload or when context is not available
    return {
      soundEnabled: false,
      toggleSound: () => {},
      playClick: () => {},
      playLaserShot: () => {},
      playGameAction: () => {},
      playThunder: () => {},
      startRain: () => {},
      stopRain: () => {},
      startWeatherAmbient: () => {},
      stopWeatherAmbient: () => {},
      volume: 0.7,
      setVolume: () => {},
    };
  }
  return context;
}