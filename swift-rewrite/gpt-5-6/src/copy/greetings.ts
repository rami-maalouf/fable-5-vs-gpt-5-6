export const EARLY_MORNING_GREETINGS = [
  'Rise & Shine ☀️',
  'Gm King/Queen 👑',
  'Morning, Champ! 🏆',
  'Early Bird Mode 🐦',
  'Dawn Patrol! 🌄',
  'Fresh Start! ✨',
  'Hello, Sunshine! 🌞',
  'Wakey Wakey! 🥚',
  "Coffee O'Clock ☕",
  'Morning Glory! 🌻',
  'Carpe Diem! 🌟',
] as const;

export const MORNING_GREETINGS = [
  'Crushing It! 💪',
  'You Got This! ⭐',
  'Seize the Day! 🌟',
  'Carpe Diem! 🌟',
  'Boss Mode! 😎',
] as const;

export const AFTERNOON_GREETINGS = [
  'Good Afternoon! 🌤️',
  'Carpe Diem! 🌟',
  'Hey Superstar! ⭐',
  'Still Going! 💪',
  'Halfway There! 🎯',
  'Keep Crushing! 🔥',
  'Power Through! ⚡',
  'Stay Strong! 💫',
  'Afternoon slum? 🫠',
] as const;

export const EVENING_GREETINGS = [
  'Good Evening! 🌆',
  'Evening Mode 🌇',
  'Wind Down Time 🍃',
  'Chill Vibes 😌',
  'Almost There! 🌙',
  'Relax Mode 🧘',
  'Sunset Crew 🌅',
  'Day Well Spent ✨',
  'Ease Into Night 🌜',
  'Golden Hour ⭐',
  'Take It Easy 🎵',
  'Breathe Deep 💨',
] as const;

export const NIGHT_GREETINGS = [
  'Good Night 🌙',
  'Sleepy Time? 😴',
  'Sleep Soon! 💤',
  "I'll c u in bed ;)",
  'Rest Up! 🛏️',
  "Moon's Up! 🌕",
  'Cozy Time 🧸',
  'Sweet Dreams! 🌙',
  'Dim The Lights! 💡',
  'Final chug of water! 🍼',
] as const;

export const HOUR_BEFORE_SLEEP_GREETINGS = [
  'Bedtime Soon! 🛏️',
  "I'll c u in bed ;)",
  'Wind Down! 🌙',
  'Almost Sleepy 😴',
  'Prep for Zzz 💤',
  'Dim the Lights! 💡',
  'Sleep Incoming! 🌜',
  "Pillow's Waiting 🛏️",
  'Get Cozy! 🧸',
  'Relaxation Time 🍵',
  'Settle Down 🌿',
] as const;

export const HOUR_AFTER_WAKE_GREETINGS = [
  'Awake Champion! 🏆',
  'Eat The Frog! 🐸',
  'Nailed It! 💪',
  'Up & Running! 🏃',
  'Sleep Success! ✅',
  'Fresh & Ready! 🌟',
  'Day Started! 🚀',
  'Alert Mode! ⚡',
  'Fully Charged! 🔋',
  'Go Time! 🎯',
] as const;

export const SHOULD_BE_SLEEPING_GREETINGS = [
  'Why Up? 🤨',
  'Sleep, Please! 😴',
  'Bed Misses You 🛏️',
  'Go To Sleep! 💤',
  'Still Awake?! 👀',
  'Shhh... Sleep! 🤫',
  'Seriously, Sleep!',
  'Your Bed Awaits! 🛏️',
  'Zzz NOW! 💤',
  'Close Your Eyes!',
] as const;

export const CURRENTLY_SLEEPING_GREETINGS = [
  'Sweet Dreams 🌙',
  'Rest Well 💤',
  'Sleep Tight 😴',
  'Dreaming... 🌌',
  'In Dreamland 💫',
  'Zzz Mode 💤',
  'Recharging... 🔋',
  'Dream Big 🌟',
  'Night Night 🌜',
  'Gn King/Queen 👑',
] as const;

export function greetingBank(
  currentMinutes: number,
  sleepMinutes: number,
  wakeMinutes: number,
  isSleeping: boolean,
): readonly string[] {
  if (isSleeping) {
    return CURRENTLY_SLEEPING_GREETINGS;
  }
  const minutesBeforeSleep = sleepMinutes - currentMinutes;
  if (minutesBeforeSleep > 0 && minutesBeforeSleep <= 60) {
    return HOUR_BEFORE_SLEEP_GREETINGS;
  }
  const minutesAfterWake = currentMinutes - wakeMinutes;
  if (minutesAfterWake >= 0 && minutesAfterWake <= 60) {
    return HOUR_AFTER_WAKE_GREETINGS;
  }
  const shouldBeSleeping = sleepMinutes > wakeMinutes
    ? currentMinutes >= sleepMinutes || currentMinutes < wakeMinutes
    : currentMinutes >= sleepMinutes && currentMinutes < wakeMinutes;
  if (shouldBeSleeping) {
    return SHOULD_BE_SLEEPING_GREETINGS;
  }
  const hour = Math.trunc(currentMinutes / 60);
  if (hour >= 5 && hour < 9) return EARLY_MORNING_GREETINGS;
  if (hour >= 9 && hour < 12) return MORNING_GREETINGS;
  if (hour >= 12 && hour < 17) return AFTERNOON_GREETINGS;
  if (hour >= 17 && hour < 20) return EVENING_GREETINGS;
  return NIGHT_GREETINGS;
}

export function getGreeting(
  currentMinutes: number,
  sleepMinutes: number,
  wakeMinutes: number,
  isSleeping: boolean,
  random: () => number = Math.random,
): string {
  const bank = greetingBank(currentMinutes, sleepMinutes, wakeMinutes, isSleeping);
  return bank[Math.floor(random() * bank.length)];
}

export function getShuffledGreeting(
  currentGreeting: string,
  currentMinutes: number,
  sleepMinutes: number,
  wakeMinutes: number,
  isSleeping: boolean,
  random: () => number = Math.random,
): string {
  let nextGreeting = currentGreeting;
  for (let attempt = 0; attempt < 5 && nextGreeting === currentGreeting; attempt += 1) {
    nextGreeting = getGreeting(currentMinutes, sleepMinutes, wakeMinutes, isSleeping, random);
  }
  return nextGreeting;
}
