export function playSuccessBeep({ duration = 200, freq = 800, volume = 0.3 } = {}) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    const now = audioContext.currentTime;
    const tiny = 0.0001;
    gainNode.gain.setValueAtTime(tiny, now);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(tiny, volume), now + 0.008);
    oscillator.start();
    oscillator.stop(now + duration / 1000);
    setTimeout(() => {
      try {
        audioContext.close();
        console.log('AudioContext closed (success)');
      } catch (e) {}
    }, duration + 120);
    console.log(`Played success beep — freq ${freq}Hz dur ${duration}ms vol ${volume}`);
  } catch (err) {
    console.warn('playSuccessBeep failed', err);
  }
}

export function playErrorBeep({ duration = 220, freq = 300, volume = 0.2 } = {}) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    const now = audioContext.currentTime;
    const tiny = 0.0001;
    gainNode.gain.setValueAtTime(tiny, now);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(tiny, volume), now + 0.008);
    oscillator.start();
    oscillator.stop(now + duration / 1000);
    setTimeout(() => {
      try {
        audioContext.close();
        console.log('AudioContext closed (error)');
      } catch (e) {}
    }, duration + 120);
    console.log(`Played error beep — freq ${freq}Hz dur ${duration}ms vol ${volume}`);
  } catch (err) {
    console.warn('playErrorBeep failed', err);
  }
}
