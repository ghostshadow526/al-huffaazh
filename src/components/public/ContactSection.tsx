
'use client';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

export function ContactSection() {
  return (
    <section id="contact" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">Get In Touch</h2>
          <p className="text-lg text-gray-600 mt-2 font-body">We'd love to hear from you. Send us a message.</p>
        </div>
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
            <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</label>
                        <Input id="name" placeholder="Your Name" />
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                        <Input id="email" type="email" placeholder="you@example.com" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-gray-700">Message</label>
                    <Textarea id="message" placeholder="Your message..." rows={5} />
                </div>
                <div className="text-right">
                    <Button type="submit" size="lg" className="bg-primary-deep hover:bg-primary-deep/90">Send Message</Button>
                </div>
            </form>
        </div>
      </div>
    </section>
  );
}
