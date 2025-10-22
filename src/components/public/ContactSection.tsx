
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin } from "lucide-react";

export function ContactSection() {
    return (
        <section id="contact" className="py-16 md:py-24 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">Get in Touch</h2>
                    <p className="text-lg text-gray-600 mt-2 font-body">We'd love to hear from you. Please reach out with any questions.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-accent p-3 rounded-full text-primary-deep"><MapPin size={24} /></div>
                            <div>
                                <h3 className="text-xl font-semibold font-headline text-primary-deep">Head Office</h3>
                                <p className="text-gray-600">Dutse Uku, Jos North, Plateau State, Nigeria</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-accent p-3 rounded-full text-primary-deep"><Mail size={24} /></div>
                            <div>
                                <h3 className="text-xl font-semibold font-headline text-primary-deep">Email Us</h3>
                                <p className="text-gray-600">contact@alhuffaazh.com</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-accent p-3 rounded-full text-primary-deep"><Phone size={24} /></div>
                            <div>
                                <h3 className="text-xl font-semibold font-headline text-primary-deep">Call Us</h3>
                                <p className="text-gray-600">+234 (803) 123-4567</p>
                            </div>
                        </div>
                    </div>
                    <Card className="rounded-2xl shadow-lg p-2">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl text-primary-deep">Send a Message</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="name" className="font-body">Full Name</Label>
                                    <Input id="name" placeholder="Your Name" className="rounded-xl" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="email" className="font-body">Email Address</Label>
                                    <Input id="email" type="email" placeholder="you@example.com" className="rounded-xl" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="message" className="font-body">Message</Label>
                                    <Textarea id="message" placeholder="Your message..." className="rounded-xl min-h-[120px]" />
                                </div>
                                <Button type="submit" className="w-full rounded-xl bg-primary-deep hover:bg-primary-deep/90 text-white shadow-md">
                                    Send Message
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
