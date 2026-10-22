import type { Metadata } from "next";
import { DailyPractice } from "@/components/games/DailyPractice";

export const metadata: Metadata = {
  title: "Today's practice · Chinese Learning with Groves",
};

export default function DailyPage() {
  return <DailyPractice />;
}
