import { RequireAdmin } from "@/app/(mainapp)/_components/require-permission";
import { CalendarView } from "./_components/calendar-view";

export default function CalendarPage() {
  return (
    <RequireAdmin>
      <CalendarView />
    </RequireAdmin>
  );
}
