export const getCurrentWeek = (): string => {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
  return startOfWeek.toISOString().split("T")[0];
};

export const getNextWeek = (): string => {
  const now = new Date();
  const nextWeek = new Date(now.setDate(now.getDate() - now.getDay() + 8));
  return nextWeek.toISOString().split("T")[0];
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};
