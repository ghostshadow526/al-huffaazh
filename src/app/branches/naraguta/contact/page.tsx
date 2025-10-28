'use client';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NaragutaContactPage() {
  const branchAddress = "Naraguta, Jos, Plateau State";

  return (
    <div className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary-deep">Contact Us</h1>
            <p className="text-lg text-gray-600 mt-2 font-body">We'd love to hear from you. Get in touch with our team.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center gap-3">
                        <MapPin size={32} className="text-primary"/>
                        Our Address
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{branchAddress}</p>
                    <Button variant="link" asChild className="mt-2 text-primary-deep font-semibold">
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branchAddress)}`} target="_blank" rel="noopener noreferrer">
                            Get Directions
                        </a>
                    </Button>
                </CardContent>
            </Card>
            <Card className="text-center">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center gap-3">
                        <Phone size={32} className="text-primary"/>
                        Call Us
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">+234 123 456 7899</p>
                    <Button variant="link" asChild className="mt-2 text-primary-deep font-semibold">
                       <a href="tel:+2341234567899">Call Now</a>
                    </Button>
                </CardContent>
            </Card>
            <Card className="text-center">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center gap-3">
                        <Mail size={32} className="text-primary"/>
                        Email Us
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground break-all">naraguta@alhuffaazh.com</p>
                    <Button variant="link" asChild className="mt-2 text-primary-deep font-semibold">
                        <a href="mailto:naraguta@alhuffaazh.com">Send an Email</a>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
