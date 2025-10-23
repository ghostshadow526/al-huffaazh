
'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactSection() {
    return (
        <section id="contact" className="py-16 md:py-24 bg-gray-50">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">Get in Touch</h2>
                    <p className="text-lg text-gray-600 mt-2 font-body">We'd love to hear from you. Please fill out the form below.</p>
                </div>
                <div className="max-w-xl mx-auto">
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input type="text" placeholder="Your Name" className="bg-white text-base py-6 rounded-xl" />
                            <Input type="email" placeholder="Your Email" className="bg-white text-base py-6 rounded-xl" />
                        </div>
                        <Input type="text" placeholder="Subject" className="bg-white text-base py-6 rounded-xl" />
                        <Textarea placeholder="Your Message" rows={6} className="bg-white text-base rounded-xl" />
                        <div className="text-center">
                            <Button type="submit" size="lg" className="rounded-xl bg-primary-deep hover:bg-primary-deep/90 w-full sm:w-auto">
                                Send Message
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    )
}
