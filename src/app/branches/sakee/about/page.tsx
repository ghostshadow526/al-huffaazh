'use client';
import Image from 'next/image';

export default function SakeeAboutPage() {
  return (
    <div className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary-deep">About Us</h1>
            <p className="text-lg text-gray-600 mt-2 font-body">Our Commitment to Excellence</p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-primary">Our Mission</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                At the Sakee Branch of Al-Huffaazh Academy, our mission is to cultivate a generation of well-rounded individuals who excel both academically and spiritually. We provide a nurturing environment where students are encouraged to memorize the Holy Quran while simultaneously receiving a high-quality contemporary education.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We believe in fostering discipline, moral integrity, and a deep-rooted love for Islam. Our goal is to empower our students with the knowledge and character to become leaders and positive contributors to society.
              </p>
            </div>
            <div>
              <Image 
                src="https://picsum.photos/seed/sakee-about/600/400"
                alt="Students studying in Sakee"
                width={600}
                height={400}
                className="rounded-2xl shadow-lg"
                data-ai-hint="students library books"
              />
            </div>
        </div>
      </div>
    </div>
  );
}
