
'use client';

import { PublicLayout } from '@/components/public/PublicLayout';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <PublicLayout>
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary-deep">About Al-Huffaazh Academy</h1>
              <p className="text-lg text-gray-600 mt-2 font-body">Our Mission, Vision, and Leadership</p>
          </div>
          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold font-headline text-primary-deep">Our Mission</h2>
              <p className="text-lg text-gray-600 font-body leading-relaxed">
                Al-Huffaazh Academy is a leading institution dedicated to providing an exceptional blend of Islamic and Western education. Our core mission is to nurture the next generation of scholars and leaders who are not only proficient in modern sciences but are also deeply rooted in the teachings of the Holy Quran.
              </p>
              <p className="text-gray-600 font-body leading-relaxed">
                We believe in creating a disciplined, faith-based environment where students can thrive academically, morally, and spiritually. Our curriculum is designed to foster critical thinking, creativity, and a lifelong love for learning, all within a framework of Islamic values.
              </p>
            </div>
            <div>
              <Image 
                src="https://picsum.photos/seed/about1/600/400"
                alt="Students in a classroom"
                width={600}
                height={400}
                className="rounded-2xl shadow-lg"
                data-ai-hint="students classroom"
              />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">Meet Our Director</h2>
            <p className="text-lg text-gray-600 mt-2 font-body">Guiding our vision with wisdom and dedication.</p>
          </div>
          <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-12 bg-gray-50 p-8 md:p-12 rounded-2xl">
                <Image
                    src="https://picsum.photos/seed/director/400/400"
                    alt="Dr. Muhyiddeen Ibraheem Solahuddeen"
                    width={250}
                    height={250}
                    className="rounded-full border-4 border-primary shadow-xl object-cover w-[200px] h-[200px] md:w-[250px] md:h-[250px]"
                    data-ai-hint="man portrait professional"
                />
                <div className="text-center md:text-left md:w-1/2">
                    <h3 className="text-2xl md:text-3xl font-bold font-headline text-primary-deep">Dr. Muhyiddeen Ibraheem Solahuddeen</h3>
                    <p className="text-primary font-semibold text-lg mt-1">ISLAMIC SCHOLAR</p>
                    <p className="text-gray-600 mt-4 leading-relaxed">
                        We are honored to be led by the eminent and profoundly respected Islamic scholar, Dr. Muhyiddeen Ibraheem Solahuddeen. His exceptional wisdom, unwavering dedication to authentic Islamic knowledge, and visionary leadership are the cornerstones of our academy's mission. Under his esteemed guidance, we are committed to fostering a generation that excels in both spiritual and worldly knowledge, prepared to lead with integrity and faith.
                    </p>
                </div>
            </div>
        </div>
      </section>
    </PublicLayout>
  );
}

