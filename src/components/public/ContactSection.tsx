
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, MapPin } from 'lucide-react';

export function ContactSection() {
    return (
        <section id="contact" className="py-16 md:py-24 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">Get in Touch</h2>
                    <p className="text-lg text-gray-600 mt-2 font-body">We are here to help. Contact us for any inquiries.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6 bg-white p-8 rounded-2xl shadow-md">
                        <h3 className="text-2xl font-bold font-headline">Contact Form</h3>
                        <form className="space-y-4">
                            <Input placeholder="Your Name" className="rounded-xl p-6" />
                            <Input type="email" placeholder="Your Email" className="rounded-xl p-6" />
                            <Textarea placeholder="Your Message" className="rounded-xl p-6" rows={5} />
                            <Button type="submit" size="lg" className="w-full rounded-xl bg-primary-deep hover:bg-primary-deep/90">Send Message</Button>
                        </form>
                    </div>
                     <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-accent/80 p-4 rounded-xl">
                                <MapPin className="h-6 w-6 text-primary-deep"/>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold font-headline">Head Office Address</h4>
                                <p className="text-gray-600">123 Islamic Education Way, Knowledge City, Nigeria</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-accent/80 p-4 rounded-xl">
                                <Mail className="h-6 w-6 text-primary-deep"/>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold font-headline">Email Address</h4>
                                <p className="text-gray-600">contact@alhuffaazh.com</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-accent/80 p-4 rounded-xl">
                                <Phone className="h-6 w-6 text-primary-deep"/>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold font-headline">Phone Number</h4>
                                <p className="text-gray-600">+234 (800) 123-4567</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
