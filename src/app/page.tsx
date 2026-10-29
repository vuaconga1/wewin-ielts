import type { Metadata } from "next";
import { LandingHeader } from "@/components/test-practice/landing-header";
import { AboutLanding } from "@/components/test-practice/about-landing";

export const metadata: Metadata = {
  title: "WEWIN Education - Nền tảng Học & Luyện thi IELTS thực chiến",
  description:
    "Nền tảng học và luyện thi IELTS thực chiến 4 kỹ năng tại Wewin Education: kho đề Cambridge & Real Exam, chấm điểm tức thì, Shadowing, Dictation và bảng vàng học viên đạt 7.5 - 8.5 IELTS.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-blue-600 selection:text-white">
      <LandingHeader />
      <main className="flex-1 w-full overflow-x-hidden">
        <AboutLanding />
      </main>
    </div>
  );
}
