// ports: twilight/utils/sleepgreetings.swift

export type GreetingBank =
  | 'afternoon'
  | 'currentlySleeping'
  | 'earlyMorning'
  | 'evening'
  | 'hourAfterWake'
  | 'hourBeforeSleep'
  | 'morning'
  | 'night'
  | 'shouldBeSleeping';

export type GreetingInput = {
  currentMinutes: number;
  isSleeping?: boolean;
  sleepMinutes: number;
  wakeMinutes: number;
};

export const greetingBanks: Record<GreetingBank, readonly string[]> = {
  earlyMorning: [
    'Rise & Shine',
    'Gm King/Queen',
    'Morning, Champ!',
    'Early Bird Mode',
    'Dawn Patrol!',
    'Fresh Start!',
    'Hello, Sunshine!',
    'Wakey Wakey!',
    "Coffee O'Clock",
    'Morning Glory!',
    'Carpe Diem!',
  ],
  morning: ['Crushing It!', 'You Got This!', 'Seize the Day!', 'Carpe Diem!', 'Boss Mode!'],
  afternoon: [
    'Good Afternoon!',
    'Carpe Diem!',
    'Hey Superstar!',
    'Still Going!',
    'Halfway There!',
    'Keep Crushing!',
    'Power Through!',
    'Stay Strong!',
    'Afternoon slum?',
  ],
  evening: [
    'Good Evening!',
    'Evening Mode',
    'Wind Down Time',
    'Chill Vibes',
    'Almost There!',
    'Relax Mode',
    'Sunset Crew',
    'Day Well Spent',
    'Ease Into Night',
    'Golden Hour',
    'Take It Easy',
    'Breathe Deep',
  ],
  night: [
    'Good Night',
    'Sleepy Time?',
    'Sleep Soon!',
    "I'll c u in bed ;)",
    'Rest Up!',
    "Moon's Up!",
    'Cozy Time',
    'Sweet Dreams!',
    'Dim The Lights!',
    'Final chug of water!',
  ],
  hourBeforeSleep: [
    'Bedtime Soon!',
    "I'll c u in bed ;)",
    'Wind Down!',
    'Almost Sleepy',
    'Prep for Zzz',
    'Dim the Lights!',
    'Sleep Incoming!',
    "Pillow's Waiting",
    'Get Cozy!',
    'Relaxation Time',
    'Settle Down',
  ],
  hourAfterWake: [
    'Awake Champion!',
    'Eat The Frog!',
    'Nailed It!',
    'Up & Running!',
    'Sleep Success!',
    'Fresh & Ready!',
    'Day Started!',
    'Alert Mode!',
    'Fully Charged!',
    'Go Time!',
  ],
  shouldBeSleeping: [
    'Why Up?',
    'Sleep, Please!',
    'Bed Misses You',
    'Go To Sleep!',
    'Still Awake?!',
    'Shhh... Sleep!',
    'Seriously, Sleep!',
    'Your Bed Awaits!',
    'Zzz NOW!',
    'Close Your Eyes!',
  ],
  currentlySleeping: [
    'Sweet Dreams',
    'Rest Well',
    'Sleep Tight',
    'Dreaming...',
    'In Dreamland',
    'Zzz Mode',
    'Recharging...',
    'Dream Big',
    'Night Night',
    'Gn King/Queen',
  ],
};

function shouldBeSleepingNow(currentMinutes: number, sleepMinutes: number, wakeMinutes: number) {
  if (sleepMinutes > wakeMinutes) {
    return currentMinutes >= sleepMinutes || currentMinutes < wakeMinutes;
  }

  return currentMinutes >= sleepMinutes && currentMinutes < wakeMinutes;
}

function timeOfDayBank(currentMinutes: number): GreetingBank {
  const hour = Math.floor(currentMinutes / 60);

  if (hour >= 5 && hour < 9) {
    return 'earlyMorning';
  }

  if (hour >= 9 && hour < 12) {
    return 'morning';
  }

  if (hour >= 12 && hour < 17) {
    return 'afternoon';
  }

  if (hour >= 17 && hour < 20) {
    return 'evening';
  }

  return 'night';
}

export function selectGreetingBank({ currentMinutes, isSleeping = false, sleepMinutes, wakeMinutes }: GreetingInput): GreetingBank {
  if (isSleeping) {
    return 'currentlySleeping';
  }

  const minutesBeforeSleep = sleepMinutes - currentMinutes;
  if (minutesBeforeSleep > 0 && minutesBeforeSleep <= 60) {
    return 'hourBeforeSleep';
  }

  const minutesAfterWake = currentMinutes - wakeMinutes;
  if (minutesAfterWake >= 0 && minutesAfterWake <= 60) {
    return 'hourAfterWake';
  }

  if (shouldBeSleepingNow(currentMinutes, sleepMinutes, wakeMinutes)) {
    return 'shouldBeSleeping';
  }

  return timeOfDayBank(currentMinutes);
}

export function getGreeting(input: GreetingInput, index = 0) {
  const bank = greetingBanks[selectGreetingBank(input)];
  return bank[Math.abs(index) % bank.length];
}

export function getShuffledGreeting(currentGreeting: string, input: GreetingInput) {
  const bank = greetingBanks[selectGreetingBank(input)];
  const currentIndex = bank.indexOf(currentGreeting);

  if (bank.length <= 1) {
    return bank[0];
  }

  return bank[(Math.max(0, currentIndex) + 1) % bank.length];
}

export function minutesSinceMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}
