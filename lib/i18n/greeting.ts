import dayjs from "dayjs";

export type GreetingPeriod = "morning" | "afternoon" | "evening" | "night";

export const getGreetingPeriod = (): GreetingPeriod => {
  const hour = dayjs().hour();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

export const getGreetingKey = (): `greeting.${GreetingPeriod}` =>
  `greeting.${getGreetingPeriod()}`;
