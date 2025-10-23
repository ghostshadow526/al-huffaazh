
'use client';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, MapPin } from "lucide-react"


export function ContactSection() {
    return (
        <section id="contact" className="py-16 md:py-24 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">Get in Touch</h2>
                    <p className="text-lg text-gray-600 mt-2 font-body">We'd love to hear from you. Please reach out with any questions.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-16 items-start">
                    <div className="space-y-6">
                         <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-primary-deep"/>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold font-headline">Main Office</h3>
                                <p className="text-gray-600">Dutse-Uku, Jos North, Plateau State, Nigeria</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                             <div className="flex-shrink-0 w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                                <Mail className="w-6 h-6 text-primary-deep"/>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold font-headline">Email Us</h3>
                                <p className="text-gray-600">info@alhuffaazh.com</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                                <Phone className="w-6 h-6 text-primary-deep"/>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold font-headline">Call Us</h3>
                                <p className="text-gray-600">+234 (803) 123-4567</p>
                            </div>
                        </div>
                    </div>
                    <form className="space-y-4 bg-white p-8 rounded-2xl shadow-lg">
                        <Input type="text" placeholder="Your Name" className="text-base"/>
                        <Input type="email" placeholder="Your Email" className="text-base"/>
                        <Textarea placeholder="Your Message" rows={5} className="text-base" />
                        <Button size="lg" className="w-full rounded-xl bg-primary-deep hover:bg-primary-deep/90">Send Message</Button>
                    </form>
                </div>
            </div>
        </section>
    )
}
