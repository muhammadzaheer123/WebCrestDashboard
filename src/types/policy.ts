export type LeaveType = {
  id: string;
  name: string;
  paid: boolean;
  requiresApproval: boolean;
  maxPerYear: number;
};

export type Holiday = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
};

export type ShiftTemplate = {
  id: string;
  name: string;
  start: string; // HH:MM
  end: string; // HH:MM
  breakMinutes: number;
};

export type PolicyState = {
  workdayStart: string;
  workdayEnd: string;
  graceMinutes: number;

  lateAfterMinutes: number;
  halfDayAfterMinutes: number;
  absentAfterMinutes: number;

  leaveTypes: LeaveType[];
  holidays: Holiday[];
  shifts: ShiftTemplate[];
};
